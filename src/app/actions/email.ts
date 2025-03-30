"use server";

import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

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
