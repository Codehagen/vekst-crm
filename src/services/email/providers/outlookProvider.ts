import axios from "axios";
import { EmailProvider } from "@prisma/client";
import { simpleParser } from "mailparser";

interface OutlookEmailFetchOptions {
  maxEmails?: number;
  folderName?: string;
  skip?: number;
  filterQuery?: string;
}

interface RawEmail {
  raw: string;
  id: string;
  threadId?: string;
}

/**
 * Fetch emails from Microsoft Outlook via Graph API
 */
export async function fetchEmailsFromOutlook(
  provider: EmailProvider,
  options: OutlookEmailFetchOptions = {}
): Promise<RawEmail[]> {
  const {
    maxEmails = 10,
    folderName = "inbox",
    skip = 0,
    filterQuery = "",
  } = options;

  try {
    // Build the base URL for Microsoft Graph API using the folder path
    // Instead of filtering by folderName, use the folder structure directly
    let baseUrl = "https://graph.microsoft.com/v1.0/me";

    // Get the correct folder path
    const folderPath = getWellKnownFolderPath(folderName);
    let url = `${baseUrl}/${folderPath}`;

    // Add query parameters
    const params = new URLSearchParams();

    // Select all fields including body content
    params.append(
      "$select",
      "id,subject,receivedDateTime,from,toRecipients,ccRecipients,bodyPreview,conversationId,internetMessageId,body"
    );

    // Order by received date, newest first
    params.append("$orderby", "receivedDateTime DESC");

    // Set limit
    params.append("$top", maxEmails.toString());

    // Set skip for pagination
    if (skip > 0) {
      params.append("$skip", skip.toString());
    }

    // Add filter if provided
    if (filterQuery) {
      params.append("$filter", filterQuery);
    }

    url = `${url}?${params.toString()}`;

    console.log(`Fetching emails from Microsoft Graph API: ${url}`);

    // Make the API request
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${provider.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.data.value || !Array.isArray(response.data.value)) {
      console.error(
        "Invalid response from Microsoft Graph API:",
        response.data
      );
      return [];
    }

    const emails = response.data.value;
    console.log(`Retrieved ${emails.length} emails from Microsoft Graph API`);

    // For each email, fetch the MIME content
    const rawEmails: RawEmail[] = [];

    for (const email of emails) {
      try {
        // Get the MIME content using the $value endpoint
        const mimeResponse = await axios.get(
          `https://graph.microsoft.com/v1.0/me/messages/${email.id}/$value`,
          {
            headers: {
              Authorization: `Bearer ${provider.accessToken}`,
              Accept: "text/plain",
            },
            responseType: "text",
          }
        );

        if (mimeResponse.data) {
          rawEmails.push({
            raw: mimeResponse.data,
            id: email.id,
            threadId: email.conversationId,
          });
        }
      } catch (mimeError) {
        console.error(
          `Error fetching MIME content for email ${email.id}:`,
          mimeError
        );

        // As a fallback, try to construct a simplified email
        try {
          const sender = email.from?.emailAddress?.address || "";
          const senderName = email.from?.emailAddress?.name || "";
          const recipients = (email.toRecipients || [])
            .map((r: any) => r.emailAddress?.address || "")
            .filter(Boolean)
            .join(", ");
          const ccRecipients = (email.ccRecipients || [])
            .map((r: any) => r.emailAddress?.address || "")
            .filter(Boolean)
            .join(", ");

          // Create a simplified email in RFC822 format
          const simpleEmail = [
            `From: ${senderName} <${sender}>`,
            `To: ${recipients}`,
            `Cc: ${ccRecipients}`,
            `Subject: ${email.subject || ""}`,
            `Date: ${email.receivedDateTime || new Date().toISOString()}`,
            `Message-ID: ${
              email.internetMessageId || `<${email.id}@outlook.office365.com>`
            }`,
            `Thread-ID: ${email.conversationId || ""}`,
            "",
            email.body?.content || email.bodyPreview || "",
          ].join("\r\n");

          // Parse the email to ensure it's valid
          await simpleParser(simpleEmail);

          rawEmails.push({
            raw: simpleEmail,
            id: email.id,
            threadId: email.conversationId,
          });
        } catch (fallbackError) {
          console.error(
            `Failed to create fallback email for ${email.id}:`,
            fallbackError
          );
        }
      }
    }

    return rawEmails;
  } catch (error) {
    console.error("Error fetching emails from Outlook:", error);

    // Extract and log the actual error message from Microsoft Graph API
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      console.error(
        "Microsoft Graph API error details:",
        error.response.data.error
      );
    }

    throw new Error(
      `Failed to fetch emails from Outlook: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Convert folder name to well-known folder path for Microsoft Graph API
 */
function getWellKnownFolderPath(folderName: string): string {
  // Convert folder name to lowercase for case-insensitive comparison
  const normalizedName = folderName.toLowerCase();

  // Map common folder names to their well-known paths in Microsoft Graph API
  switch (normalizedName) {
    case "inbox":
      return "mailFolders/inbox/messages";
    case "drafts":
      return "mailFolders/drafts/messages";
    case "sent":
    case "sentitems":
      return "mailFolders/sentItems/messages";
    case "deleted":
    case "deleteditems":
      return "mailFolders/deletedItems/messages";
    case "junk":
    case "junkemail":
      return "mailFolders/junkemail/messages";
    case "archive":
      return "mailFolders/archive/messages";
    case "outbox":
      return "mailFolders/outbox/messages";
    default:
      // If it's not a well-known folder, try to use it as a custom folder name
      return `mailFolders/${folderName}/messages`;
  }
}

/**
 * Get Outlook delta changes since last sync using delta token
 */
export async function getOutlookDelta(
  provider: EmailProvider,
  deltaToken?: string
): Promise<{
  addedMessages: Array<{ id: string; raw: string }>;
  deletedMessages: string[];
  newDeltaToken: string;
}> {
  try {
    // Endpoint for delta query
    let url =
      "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta";

    // If we have a delta token, use it as the complete URL
    if (deltaToken) {
      url = deltaToken;
    }

    // Execute delta query
    const deltaResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${provider.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const addedMessages: Array<{ id: string; raw: string }> = [];
    const deletedMessages: string[] = [];

    // Process results
    if (deltaResponse.data.value) {
      for (const item of deltaResponse.data.value) {
        if (item["@removed"]) {
          // This is a deleted message
          deletedMessages.push(item.id);
        } else {
          // This is a new or updated message
          try {
            // Get the full MIME content
            const mimeResponse = await axios.get(
              `https://graph.microsoft.com/v1.0/me/messages/${item.id}/$value`,
              {
                headers: {
                  Authorization: `Bearer ${provider.accessToken}`,
                  Accept: "text/plain",
                },
                responseType: "text",
              }
            );

            addedMessages.push({
              id: item.id,
              raw: mimeResponse.data,
            });
          } catch (error) {
            console.error(
              `Error fetching MIME content for delta message ${item.id}:`,
              error
            );
          }
        }
      }
    }

    // Get the new delta token from the response
    const newDeltaToken = deltaResponse.data["@odata.deltaLink"] || "";

    return {
      addedMessages,
      deletedMessages,
      newDeltaToken,
    };
  } catch (error) {
    console.error("Error getting Outlook delta:", error);
    throw new Error(
      `Failed to get Outlook delta: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Update email status (read/flagged) in Outlook
 */
export async function updateOutlookEmailStatus(
  provider: EmailProvider,
  messageId: string,
  options: { isRead?: boolean; isStarred?: boolean }
): Promise<boolean> {
  try {
    const { isRead, isStarred } = options;
    const updates: Record<string, any> = {};

    // Update read status if specified
    if (isRead !== undefined) {
      updates.isRead = isRead;
    }

    // Update flagged status if specified
    if (isStarred !== undefined) {
      if (isStarred) {
        updates.flag = {
          flagStatus: "flagged",
        };
      } else {
        updates.flag = {
          flagStatus: "notFlagged",
        };
      }
    }

    // Only make the API call if we have updates
    if (Object.keys(updates).length > 0) {
      await axios.patch(
        `https://graph.microsoft.com/v1.0/me/messages/${messageId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${provider.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return true;
  } catch (error) {
    console.error("Error updating Outlook email status:", error);
    return false;
  }
}
