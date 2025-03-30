import { prisma } from "@/lib/db";
import { fetchEmailsFromGmail } from "../services/email/providers/gmailProvider";
import { fetchEmailsFromOutlook } from "../services/email/providers/outlookProvider";
import { processEmail } from "../services/email/emailProcessor";
import { EmailProvider } from "@prisma/client";
import axios from "axios";

/**
 * Refresh the Gmail access token if needed
 */
async function refreshGmailToken(
  provider: EmailProvider
): Promise<EmailProvider> {
  // Check if token needs refresh
  if (provider.expiresAt && new Date() >= provider.expiresAt) {
    console.log("Access token expired, refreshing...");

    if (!provider.refreshToken) {
      console.error(
        "No refresh token available. Please reconnect your Gmail account."
      );
      throw new Error("No refresh token available");
    }

    try {
      // Refresh the token
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        refresh_token: provider.refreshToken,
        grant_type: "refresh_token",
      });

      const response = await axios.post(
        "https://oauth2.googleapis.com/token",
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const tokens = response.data;

      if (!tokens.access_token) {
        throw new Error("No access token received during refresh");
      }

      // Calculate new expiration time
      const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null;

      // Update the provider
      const updatedProvider = await prisma.emailProvider.update({
        where: { id: provider.id },
        data: {
          accessToken: tokens.access_token,
          expiresAt: expiresAt,
        },
      });

      console.log("Token refreshed successfully");
      return updatedProvider;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      throw error;
    }
  }

  return provider;
}

/**
 * Refresh the Microsoft access token if needed
 */
async function refreshMicrosoftToken(
  provider: EmailProvider
): Promise<EmailProvider> {
  // Check if token needs refresh
  if (provider.expiresAt && new Date() >= provider.expiresAt) {
    console.log("Microsoft access token expired, refreshing...");

    if (!provider.refreshToken) {
      console.error(
        "No refresh token available. Please reconnect your Microsoft account."
      );
      throw new Error("No refresh token available");
    }

    try {
      // Refresh the token
      const params = new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID as string,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET as string,
        refresh_token: provider.refreshToken,
        grant_type: "refresh_token",
        scope: [
          "openid",
          "email",
          "profile",
          "offline_access",
          "https://graph.microsoft.com/Mail.Read",
          "https://graph.microsoft.com/Mail.ReadWrite",
          "https://graph.microsoft.com/Mail.Send",
          "https://graph.microsoft.com/User.Read",
        ].join(" "),
      });

      const response = await axios.post(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const tokens = response.data;

      if (!tokens.access_token) {
        throw new Error("No access token received during refresh");
      }

      // Calculate new expiration time
      const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null;

      // Update the provider
      const updatedProvider = await prisma.emailProvider.update({
        where: { id: provider.id },
        data: {
          accessToken: tokens.access_token,
          // Update refresh token if a new one was provided
          refreshToken: tokens.refresh_token || provider.refreshToken,
          expiresAt: expiresAt,
        },
      });

      console.log("Microsoft token refreshed successfully");
      return updatedProvider;
    } catch (error) {
      console.error("Failed to refresh Microsoft token:", error);
      throw error;
    }
  }

  return provider;
}

/**
 * Test function to fetch emails from Gmail and process them
 */
async function testGmailParser(businessId?: string) {
  try {
    console.log("Starting Gmail parser test...");

    // Get the first email provider for testing
    let provider = await prisma.emailProvider.findFirst({
      where: { provider: "google" },
    });

    if (!provider) {
      console.error(
        "No Gmail provider found. Please connect a Gmail account first."
      );
      return;
    }

    console.log(`Found provider for email: ${provider.email}`);

    // Refresh token if needed
    try {
      provider = await refreshGmailToken(provider);
    } catch (error) {
      console.error(
        "Failed to refresh token, attempting to proceed with existing token"
      );
    }

    // Fetch the latest emails
    console.log("Fetching emails from Gmail...");
    const emails = await fetchEmailsFromGmail(provider, {
      maxEmails: 1, // Just get one email for testing
      labelFilter: ["INBOX"],
    });

    if (emails.length === 0) {
      console.log("No emails found in the inbox.");
      return;
    }

    console.log(`Found ${emails.length} email(s). Processing the first one...`);

    // Process the first email
    const result = await processEmail(
      emails[0].raw,
      provider.userId,
      provider.id
    );

    if (result.success) {
      console.log("Email processed successfully!");
      console.log(`Email ID: ${result.emailSyncId}`);
      console.log(`External ID: ${result.externalId}`);

      // If a business ID was provided, associate the email with the business
      if (businessId) {
        await prisma.emailSync.update({
          where: { id: result.emailSyncId },
          data: { businessId },
        });
        console.log(
          `Email has been associated with business ID: ${businessId}`
        );
      }

      // Fetch the processed email to display details
      const processedEmail = await prisma.emailSync.findUnique({
        where: { id: result.emailSyncId },
      });

      console.log("\nProcessed Email Details:");
      console.log(`Subject: ${processedEmail?.subject}`);
      console.log(
        `From: ${processedEmail?.fromName} <${processedEmail?.fromEmail}>`
      );
      console.log(`To: ${processedEmail?.toEmail.join(", ")}`);
      console.log(`Sent at: ${processedEmail?.sentAt}`);
      console.log(`Thread ID: ${processedEmail?.threadId}`);
    } else {
      console.error("Failed to process email:", result.error);
    }
  } catch (error) {
    console.error("Error testing Gmail parser:", error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Test function to fetch emails from Microsoft Outlook and process them
 */
async function testOutlookParser(businessId?: string) {
  try {
    console.log("Starting Outlook parser test...");

    // Get the first email provider for testing
    let provider = await prisma.emailProvider.findFirst({
      where: { provider: "microsoft" },
    });

    if (!provider) {
      console.error(
        "No Microsoft provider found. Please connect a Microsoft account first."
      );
      return;
    }

    console.log(`Found provider for email: ${provider.email}`);

    // Refresh token if needed
    try {
      provider = await refreshMicrosoftToken(provider);
    } catch (error) {
      console.error(
        "Failed to refresh Microsoft token, attempting to proceed with existing token"
      );
    }

    try {
      // Fetch the latest emails
      console.log("Fetching emails from Outlook...");
      const emails = await fetchEmailsFromOutlook(provider, {
        maxEmails: 1, // Just get one email for testing
        folderName: "inbox",
      });

      if (emails.length === 0) {
        console.log("No emails found in the inbox.");
        return;
      }

      console.log(
        `Found ${emails.length} email(s). Processing the first one...`
      );

      try {
        // Process the first email
        const result = await processEmail(
          emails[0].raw,
          provider.userId,
          provider.id
        );

        if (result.success) {
          console.log("Email processed successfully!");
          console.log(`Email ID: ${result.emailSyncId}`);
          console.log(`External ID: ${result.externalId}`);

          // If a business ID was provided, associate the email with the business
          if (businessId) {
            await prisma.emailSync.update({
              where: { id: result.emailSyncId },
              data: { businessId },
            });
            console.log(
              `Email has been associated with business ID: ${businessId}`
            );
          }

          // Fetch the processed email to display details
          const processedEmail = await prisma.emailSync.findUnique({
            where: { id: result.emailSyncId },
          });

          console.log("\nProcessed Email Details:");
          console.log(`Subject: ${processedEmail?.subject}`);
          console.log(
            `From: ${processedEmail?.fromName} <${processedEmail?.fromEmail}>`
          );
          console.log(`To: ${processedEmail?.toEmail.join(", ")}`);
          console.log(`Sent at: ${processedEmail?.sentAt}`);
          console.log(`Thread ID: ${processedEmail?.threadId}`);
        } else {
          console.error("Failed to process email:", result.error);
        }
      } catch (error) {
        // Check if it's a duplicate email constraint error
        // Check if it's a Prisma error with code P2002 (unique constraint violation)
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2002" &&
          "meta" in error &&
          error.meta &&
          typeof error.meta === "object" &&
          "target" in error.meta &&
          Array.isArray(error.meta.target) &&
          error.meta.target.includes("externalId")
        ) {
          console.log("\n--------- DUPLICATE EMAIL DETECTED ---------");
          console.log("This email already exists in the database.");
          console.log("Retrieving existing email information...");

          // Try to retrieve the existing email
          const existingEmail = await prisma.emailSync.findFirst({
            where: {
              userId: provider.userId,
              externalId: emails[0].id,
            },
          });

          if (existingEmail) {
            console.log("\nExisting Email Details:");
            console.log(`Email ID: ${existingEmail.id}`);
            console.log(`Subject: ${existingEmail.subject}`);
            console.log(
              `From: ${existingEmail.fromName} <${existingEmail.fromEmail}>`
            );
            console.log(`To: ${existingEmail.toEmail.join(", ")}`);
            console.log(`Sent at: ${existingEmail.sentAt}`);
            console.log(`Thread ID: ${existingEmail.threadId}`);
          } else {
            console.log("Email exists but could not retrieve details.");
          }
          console.log("-------------------------------------------\n");
        } else {
          console.error("Error processing email:", error);
        }
      }
    } catch (fetchError: any) {
      // Check for specific Microsoft errors
      const errorData = fetchError.response?.data?.error;

      if (errorData && errorData.code === "AuthenticationError") {
        console.error("\n--------- MICROSOFT ACCOUNT ISSUE ---------");
        console.error(
          "There appears to be an issue with the Microsoft account or permissions:"
        );
        console.error("Error Code:", errorData.code);
        console.error("Error Message:", errorData.message);

        if (
          errorData.message.includes(
            "subscription within the tenant has lapsed"
          )
        ) {
          console.error(
            "\nYour Microsoft 365 subscription appears to have expired or been disabled."
          );
          console.error("Solutions to try:");
          console.error(
            "1. Check with your Microsoft 365 admin about subscription status"
          );
          console.error("2. Verify the app has proper permissions in Azure AD");
          console.error(
            "3. Reconnect the account using 'Direct Outlook OAuth with Refresh Token'"
          );
        } else {
          console.error("\nSolutions to try:");
          console.error(
            "1. Reconnect the account using 'Direct Outlook OAuth with Refresh Token'"
          );
          console.error(
            "2. Check with your Microsoft 365 admin about application permissions"
          );
          console.error("3. Verify the subscription status is active");
        }
        console.error("------------------------------------------\n");
      } else if (
        fetchError.message &&
        fetchError.message.includes("Request failed with status code")
      ) {
        console.error("\n--------- API REQUEST ISSUE ---------");
        console.error(
          "There was a problem with the Microsoft Graph API request:"
        );
        console.error("Status Code:", fetchError.response?.status);
        console.error("Error Message:", fetchError.message);
        console.error(
          "Error Details:",
          errorData || "No detailed error information available"
        );
        console.error(
          "\nTry reconnecting your Microsoft account and ensure you have the correct permissions."
        );
        console.error("-------------------------------------\n");
      } else {
        console.error("Error fetching emails from Outlook:", fetchError);
      }
    }
  } catch (error) {
    console.error("Error testing Outlook parser:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Update main execution to support running either test
async function main() {
  try {
    const providerType = process.argv[2]?.toLowerCase();
    const businessId = process.argv[3]; // Optional business ID to associate the email with

    if (providerType === "microsoft" || providerType === "outlook") {
      await testOutlookParser(businessId);
    } else {
      // Default to Gmail if no provider specified or "gmail" is specified
      await testGmailParser(businessId);
    }
  } catch (error) {
    console.error("Error in main execution:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the main function instead of directly calling testGmailParser
main();
