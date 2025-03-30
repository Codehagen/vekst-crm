"use server";

import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth/server";
import type { EmailSync, Prisma } from "@prisma/client";
import {
  processEmail,
  batchProcessEmails,
} from "@/services/email/emailProcessor";
import { fetchEmailsFromGmail } from "@/services/email/providers/gmailProvider";
import { fetchEmailsFromOutlook } from "@/services/email/providers/outlookProvider";

interface SendEmailProps {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

/**
 * Server action to send an email via the connected email provider
 */
export async function sendEmail({
  to,
  subject,
  body,
  cc,
  bcc,
}: SendEmailProps) {
  try {
    console.log("Starting email send process");

    const session = await getSession({
      headers: await headers(),
    });

    if (!session) {
      console.error("Email send failed: No session found");
      throw new Error("Not authenticated");
    }

    console.log(`Fetching email provider for user: ${session.user.id}`);

    // Get the email provider details for the user
    const emailProvider = await prisma.emailProvider.findUnique({
      where: { userId: session.user.id },
    });

    if (!emailProvider) {
      console.error("Email send failed: No email provider found for user");
      throw new Error("No email provider configured");
    }

    console.log(
      `Email provider found: ${emailProvider.provider}, email: ${emailProvider.email}`
    );

    // Check if token is expired and refresh if needed
    if (
      emailProvider.expiresAt &&
      new Date(emailProvider.expiresAt) < new Date()
    ) {
      console.log("Access token expired, refreshing token");
      // Need to refresh the token
      await refreshEmailProviderToken(emailProvider.id);
    }

    // Get the refreshed provider
    const refreshedProvider = await prisma.emailProvider.findUnique({
      where: { id: emailProvider.id },
    });

    if (!refreshedProvider) {
      console.error("Email send failed: Unable to refresh provider token");
      throw new Error("Failed to refresh email provider token");
    }

    // Send email based on provider
    if (refreshedProvider.provider === "google") {
      console.log("Sending email via Gmail API");
      return await sendGmailEmail({
        accessToken: refreshedProvider.accessToken,
        fromEmail: refreshedProvider.email,
        to,
        subject,
        body,
        cc,
        bcc,
      });
    } else if (refreshedProvider.provider === "microsoft") {
      console.log("Sending email via Microsoft Graph API");
      return await sendMicrosoftEmail({
        accessToken: refreshedProvider.accessToken,
        fromEmail: refreshedProvider.email,
        to,
        subject,
        body,
        cc,
        bcc,
      });
    } else {
      console.error(
        `Email send failed: Unsupported provider: ${refreshedProvider.provider}`
      );
      throw new Error(
        `Unsupported email provider: ${refreshedProvider.provider}`
      );
    }
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

/**
 * Refresh the OAuth token for an email provider
 */
async function refreshEmailProviderToken(emailProviderId: string) {
  try {
    console.log(`Refreshing token for email provider: ${emailProviderId}`);

    const emailProvider = await prisma.emailProvider.findUnique({
      where: { id: emailProviderId },
    });

    if (!emailProvider || !emailProvider.refreshToken) {
      console.error(
        `Token refresh failed: No refresh token available for provider: ${emailProviderId}`
      );
      throw new Error("No refresh token available");
    }

    // Use provider-specific refresh logic
    if (emailProvider.provider === "google") {
      console.log("Refreshing Google OAuth token");
      const tokenData = await refreshGoogleToken(emailProvider.refreshToken);

      console.log("Token refreshed successfully, updating provider record");
      // Update the provider with the new token
      await prisma.emailProvider.update({
        where: { id: emailProviderId },
        data: {
          accessToken: tokenData.access_token,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        },
      });

      console.log("Provider record updated with new token");
    } else if (emailProvider.provider === "microsoft") {
      console.log("Refreshing Microsoft OAuth token");
      const tokenData = await refreshMicrosoftToken(emailProvider.refreshToken);

      console.log("Token refreshed successfully, updating provider record");
      // Update the provider with the new token
      await prisma.emailProvider.update({
        where: { id: emailProviderId },
        data: {
          accessToken: tokenData.access_token,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        },
      });

      console.log("Provider record updated with new token");
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
}

/**
 * Refresh a Google OAuth token
 */
async function refreshGoogleToken(refreshToken: string) {
  const tokenEndpoint = "https://oauth2.googleapis.com/token";

  console.log("Making request to refresh Google token");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Google token refresh failed:", errorData);
    throw new Error(`Token refresh failed: ${JSON.stringify(errorData)}`);
  }

  console.log("Google token refreshed successfully");
  return await response.json();
}

/**
 * Refresh a Microsoft OAuth token
 */
async function refreshMicrosoftToken(refreshToken: string) {
  const tokenEndpoint =
    "https://login.microsoftonline.com/common/oauth2/v2.0/token";

  console.log("Making request to refresh Microsoft token");

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID as string,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET as string,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: "openid email profile https://graph.microsoft.com/Mail.Send",
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { error: errorText };
    }
    console.error("Microsoft token refresh failed:", errorData);
    throw new Error(`Token refresh failed: ${JSON.stringify(errorData)}`);
  }

  console.log("Microsoft token refreshed successfully");
  return await response.json();
}

interface SendGmailEmailProps {
  accessToken: string;
  fromEmail: string;
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

/**
 * Send an email via Gmail API
 */
async function sendGmailEmail({
  accessToken,
  fromEmail,
  to,
  subject,
  body,
  cc,
  bcc,
}: SendGmailEmailProps) {
  console.log(`Preparing to send email from ${fromEmail} to ${to}`);

  // Format the email in MIME format
  const email = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    cc ? `Cc: ${cc}` : "",
    bcc ? `Bcc: ${bcc}` : "",
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    body,
  ]
    .filter(Boolean)
    .join("\r\n");

  // Base64 encode the email
  const encodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  console.log("Email encoded, sending to Gmail API");

  // Send the email
  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: encodedEmail,
      }),
    }
  );

  console.log(`Gmail API response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { error: errorText };
    }

    console.error("Gmail API error:", errorData);
    throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
  }

  console.log("Email sent successfully");
  return await response.json();
}

interface SendMicrosoftEmailProps {
  accessToken: string;
  fromEmail: string;
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

/**
 * Send an email via Microsoft Graph API
 */
async function sendMicrosoftEmail({
  accessToken,
  fromEmail,
  to,
  subject,
  body,
  cc,
  bcc,
}: SendMicrosoftEmailProps) {
  console.log(
    `Preparing to send email from ${fromEmail} to ${to} via Microsoft`
  );

  // Format the email for Microsoft Graph API - define with proper TypeScript structure
  const messageData: {
    message: {
      subject: string;
      body: {
        contentType: string;
        content: string;
      };
      toRecipients: {
        emailAddress: {
          address: string;
        };
      }[];
      ccRecipients?: {
        emailAddress: {
          address: string;
        };
      }[];
      bccRecipients?: {
        emailAddress: {
          address: string;
        };
      }[];
    };
    saveToSentItems: boolean;
  } = {
    message: {
      subject,
      body: {
        contentType: "HTML",
        content: body,
      },
      toRecipients: to.split(",").map((email) => ({
        emailAddress: {
          address: email.trim(),
        },
      })),
    },
    saveToSentItems: true,
  };

  // Add CC recipients if provided
  if (cc) {
    messageData.message.ccRecipients = cc.split(",").map((email) => ({
      emailAddress: {
        address: email.trim(),
      },
    }));
  }

  // Add BCC recipients if provided
  if (bcc) {
    messageData.message.bccRecipients = bcc.split(",").map((email) => ({
      emailAddress: {
        address: email.trim(),
      },
    }));
  }

  console.log("Email formatted, sending to Microsoft Graph API");

  // Send the email using Microsoft Graph API
  const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messageData),
  });

  console.log(`Microsoft Graph API response status: ${response.status}`);

  // Microsoft Graph API returns 202 Accepted with no body when successful
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { error: await response.text() };
    }

    console.error("Microsoft Graph API error:", errorData);
    throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
  }

  console.log("Email sent successfully via Microsoft");
  // Microsoft Graph API doesn't return a body on success (returns 202 Accepted)
  return { success: true };
}

/**
 * Get the status of email provider connection
 */
export async function getEmailProviderStatus() {
  try {
    console.log("Checking email provider status");

    const session = await getSession({
      headers: await headers(),
    });

    if (!session) {
      console.log("No session found, returning disconnected status");
      return { connected: false };
    }

    console.log(`Finding email provider for user: ${session.user.id}`);

    const emailProvider = await prisma.emailProvider.findUnique({
      where: { userId: session.user.id },
    });

    console.log(
      "Email provider status check result:",
      emailProvider
        ? `Connected to ${emailProvider.provider} with email ${emailProvider.email}`
        : "No provider connected"
    );

    return {
      connected: !!emailProvider,
      provider: emailProvider?.provider,
      email: emailProvider?.email,
    };
  } catch (error) {
    console.error("Error getting email provider status:", error);
    return { connected: false, error: "Failed to check email provider status" };
  }
}

// Types
interface FetchEmailsParams {
  businessId?: string;
  isRead?: boolean;
  isStarred?: boolean;
  limit?: number;
  orderBy?: "sentAt" | "receivedAt";
  orderDirection?: "asc" | "desc";
}

interface SyncEmailsParams {
  maxEmails?: number;
  syncFrom?: Date | string;
  businessId?: string;
}

interface UpdateEmailParams {
  emailId: string;
  isRead?: boolean;
  isStarred?: boolean;
  businessId?: string;
  contactId?: string;
}

/**
 * Fetch emails for the current user with optional filtering
 */
export async function fetchEmails(params: FetchEmailsParams = {}) {
  try {
    // Verify authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Build the query with filters
    const {
      businessId,
      isRead,
      isStarred,
      limit = 50,
      orderBy = "sentAt",
      orderDirection = "desc",
    } = params;

    const where: any = {
      userId: user.id,
      isDeleted: false,
    };

    // Add optional filters
    if (businessId) {
      where.businessId = businessId;
    }

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (isStarred !== undefined) {
      where.isStarred = isStarred;
    }

    // Execute the query
    const emails = await prisma.emailSync.findMany({
      where,
      orderBy: {
        [orderBy]: orderDirection,
      },
      take: limit,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return { success: true, emails };
  } catch (error) {
    console.error("Error fetching emails:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sync emails from the connected provider
 */
export async function syncEmails(params: SyncEmailsParams = {}) {
  try {
    // Verify authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    // Get the user with email provider
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { emailProvider: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.emailProvider) {
      throw new Error("No email provider connected");
    }

    // Parse parameters
    const { maxEmails = 50 } = params;
    const syncFrom =
      params.syncFrom instanceof Date
        ? params.syncFrom
        : params.syncFrom
        ? new Date(params.syncFrom)
        : undefined;

    // Prepare options
    const options = {
      maxEmails,
      syncFrom,
      labelFilter: ["INBOX"], // Default to inbox for Gmail
      folderFilter: ["inbox"], // Default to inbox for Outlook
    };

    // Fetch emails based on provider type
    let rawEmails: { id: string; raw: string }[] = [];

    if (user.emailProvider.provider === "google") {
      rawEmails = await fetchEmailsFromGmail(user.emailProvider, options);
    } else if (user.emailProvider.provider === "microsoft") {
      rawEmails = await fetchEmailsFromOutlook(user.emailProvider, options);
    } else {
      throw new Error("Unsupported email provider");
    }

    // Process emails
    const results = await Promise.all(
      rawEmails.map((email) =>
        processEmail(email.raw, user.id, user.emailProvider!.id)
      )
    );

    // Count successes and failures
    const successes = results.filter((result) => result.success).length;
    const failures = results.filter((result) => !result.success).length;

    // Revalidate email list paths
    revalidatePath("/dashboard/email");
    revalidatePath("/leads");
    if (params.businessId) {
      revalidatePath(`/business/${params.businessId}`);
    }

    return {
      success: true,
      message: `Synced ${successes} emails successfully (${failures} failed)`,
      totalProcessed: rawEmails.length,
      successCount: successes,
      failureCount: failures,
    };
  } catch (error) {
    console.error("Error syncing emails:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update an email (mark as read, starred, or associate with business/contact)
 */
export async function updateEmail(params: UpdateEmailParams) {
  try {
    // Verify authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const { emailId, isRead, isStarred, businessId, contactId } = params;

    // Verify email ownership
    const email = await prisma.emailSync.findFirst({
      where: {
        id: emailId,
        userId: user.id,
      },
      include: {
        emailProvider: true,
      },
    });

    if (!email) {
      throw new Error("Email not found or access denied");
    }

    // Build update object with only defined fields
    const updateData: any = {};

    if (isRead !== undefined) {
      updateData.isRead = isRead;
    }

    if (isStarred !== undefined) {
      updateData.isStarred = isStarred;
    }

    if (businessId !== undefined) {
      updateData.business = businessId
        ? { connect: { id: businessId } }
        : { disconnect: true };
    }

    if (contactId !== undefined) {
      updateData.contact = contactId
        ? { connect: { id: contactId } }
        : { disconnect: true };
    }

    // Update in the database
    const updatedEmail = await prisma.emailSync.update({
      where: { id: emailId },
      data: updateData,
    });

    // Also update in the email provider if status changed
    if (
      email.emailProvider &&
      (isRead !== undefined || isStarred !== undefined)
    ) {
      try {
        if (email.emailProvider.provider === "google") {
          const { updateGmailEmailStatus } = await import(
            "@/services/email/providers/gmailProvider"
          );
          await updateGmailEmailStatus(email.emailProvider, email.externalId, {
            isRead,
            isStarred,
          });
        } else if (email.emailProvider.provider === "microsoft") {
          const { updateOutlookEmailStatus } = await import(
            "@/services/email/providers/outlookProvider"
          );
          await updateOutlookEmailStatus(
            email.emailProvider,
            email.externalId,
            {
              isRead,
              isStarred,
            }
          );
        }
      } catch (providerError) {
        console.error("Error updating email in provider:", providerError);
        // We don't fail the operation if provider update fails
      }
    }

    // Revalidate paths
    revalidatePath("/dashboard/email");
    if (email.businessId) {
      revalidatePath(`/business/${email.businessId}`);
    }
    if (businessId) {
      revalidatePath(`/business/${businessId}`);
    }

    return { success: true, email: updatedEmail };
  } catch (error) {
    console.error("Error updating email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Associate multiple emails with a business
 */
export async function associateEmailsWithBusiness(
  emailIds: string[],
  businessId: string
) {
  try {
    // Verify authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error("Business not found");
    }

    // Update all emails
    const updatedEmails = await prisma.emailSync.updateMany({
      where: {
        id: { in: emailIds },
        userId: user.id, // Ensure user owns these emails
      },
      data: {
        businessId,
      },
    });

    // Revalidate paths
    revalidatePath("/dashboard/email");
    revalidatePath(`/business/${businessId}`);

    return {
      success: true,
      count: updatedEmails.count,
    };
  } catch (error) {
    console.error("Error associating emails with business:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
