import { google } from "googleapis";
import { EmailProvider } from "@prisma/client";

interface FetchEmailsOptions {
  maxEmails?: number;
  syncFrom?: Date;
  labelFilter?: string[];
}

/**
 * Fetch emails from Gmail API
 */
export async function fetchEmailsFromGmail(
  provider: EmailProvider,
  options: FetchEmailsOptions = {}
): Promise<{ id: string; raw: string }[]> {
  try {
    // Default options
    const { maxEmails = 50, syncFrom, labelFilter = ["INBOX"] } = options;

    // Initialize Gmail OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set credentials from provider
    oauth2Client.setCredentials({
      access_token: provider.accessToken,
      refresh_token: provider.refreshToken,
      expiry_date: provider.expiresAt?.getTime() || undefined,
    });

    // Handle token refresh if needed
    if (provider.expiresAt && new Date() > provider.expiresAt) {
      const { tokens } = await oauth2Client.refreshToken(
        provider.refreshToken || ""
      );
      // In a real implementation, you'd update the provider with new tokens here
      console.log("Token refreshed for Gmail provider");
    }

    // Create Gmail client
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Build query
    let query = "";

    // Add date filter if specified
    if (syncFrom) {
      const formattedDate = syncFrom.toISOString().split("T")[0]; // YYYY-MM-DD
      query += `after:${formattedDate} `;
    }

    // List messages that match query
    const messageList = await gmail.users.messages.list({
      userId: "me",
      maxResults: maxEmails,
      q: query,
      labelIds: labelFilter,
    });

    if (!messageList.data.messages || messageList.data.messages.length === 0) {
      return [];
    }

    // Fetch each message's raw content
    const emails = await Promise.all(
      messageList.data.messages.map(async (message) => {
        if (!message.id) return null;

        // Get full message
        const response = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "raw",
        });

        if (!response.data.raw) return null;

        // Gmail API returns base64url encoded content
        const rawEmail = Buffer.from(response.data.raw, "base64").toString(
          "utf8"
        );

        return {
          id: message.id,
          raw: rawEmail,
        };
      })
    );

    // Filter out any nulls and return result
    return emails.filter(
      (email): email is { id: string; raw: string } => email !== null
    );
  } catch (error) {
    console.error("Error fetching emails from Gmail:", error);
    throw new Error(
      `Failed to fetch emails from Gmail: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get Gmail history (changes since last sync) using historyId
 */
export async function getGmailHistory(
  provider: EmailProvider,
  historyId: string
): Promise<{ addedMessages: string[]; deletedMessages: string[] }> {
  try {
    // Initialize Gmail OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set credentials from provider
    oauth2Client.setCredentials({
      access_token: provider.accessToken,
      refresh_token: provider.refreshToken,
      expiry_date: provider.expiresAt?.getTime() || undefined,
    });

    // Create Gmail client
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Get history
    const history = await gmail.users.history.list({
      userId: "me",
      startHistoryId: historyId,
      historyTypes: ["messageAdded", "messageDeleted"],
    });

    const addedMessages: string[] = [];
    const deletedMessages: string[] = [];

    if (history.data.history) {
      for (const record of history.data.history) {
        // Handle added messages
        if (record.messagesAdded) {
          for (const message of record.messagesAdded) {
            if (message.message?.id) {
              addedMessages.push(message.message.id);
            }
          }
        }

        // Handle deleted messages
        if (record.messagesDeleted) {
          for (const message of record.messagesDeleted) {
            if (message.message?.id) {
              deletedMessages.push(message.message.id);
            }
          }
        }
      }
    }

    return {
      addedMessages,
      deletedMessages,
    };
  } catch (error) {
    console.error("Error getting Gmail history:", error);
    throw new Error(
      `Failed to get Gmail history: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Update email status (read/starred) in Gmail
 */
export async function updateGmailEmailStatus(
  provider: EmailProvider,
  messageId: string,
  options: { isRead?: boolean; isStarred?: boolean }
): Promise<boolean> {
  try {
    const { isRead, isStarred } = options;

    // Initialize Gmail OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set credentials from provider
    oauth2Client.setCredentials({
      access_token: provider.accessToken,
      refresh_token: provider.refreshToken,
      expiry_date: provider.expiresAt?.getTime() || undefined,
    });

    // Create Gmail client
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Update read status if specified
    if (isRead !== undefined) {
      await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          removeLabelIds: isRead ? ["UNREAD"] : [],
          addLabelIds: isRead ? [] : ["UNREAD"],
        },
      });
    }

    // Update starred status if specified
    if (isStarred !== undefined) {
      await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          removeLabelIds: isStarred ? [] : ["STARRED"],
          addLabelIds: isStarred ? ["STARRED"] : [],
        },
      });
    }

    return true;
  } catch (error) {
    console.error("Error updating Gmail email status:", error);
    return false;
  }
}
