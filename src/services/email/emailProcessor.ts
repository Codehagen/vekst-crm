import { ParsedMail, AddressObject } from "mailparser";
import { prisma } from "@/lib/db";
import { parseMimeStructure, processAttachmentsForStorage } from "./mimeParser";
import { identifyEmailThread } from "./threadIdentifier";
import { extractMeaningfulContent } from "./contentExtractor";
import { Prisma } from "@prisma/client";
import { associateEmailWithBusiness } from "./businessAssociator";

interface EmailProcessingResult {
  emailSyncId: string;
  success: boolean;
  externalId: string;
  error?: string;
}

/**
 * Main email processing pipeline
 */
export async function processEmail(
  rawEmail: string,
  userId: string,
  providerId: string
): Promise<EmailProcessingResult> {
  try {
    // Step 1: Parse MIME structure
    const parsedEmail = await parseMimeStructure(rawEmail);

    // Step 2: Identify thread
    const threadInfo = identifyEmailThread(parsedEmail.parsedEmail);

    // Step 3: Extract meaningful content
    const extractedContent = extractMeaningfulContent(parsedEmail.parsedEmail, {
      includeQuotedContent: true,
      includeSignature: true,
      includeDisclaimer: true,
    });

    // Step 4: Process attachments for storage
    const messageId =
      parsedEmail.parsedEmail.messageId || `unknown-${Date.now()}`;
    const attachmentMetadata = await processAttachmentsForStorage(
      parsedEmail.attachments,
      messageId,
      "local" // Use 'cloud' for production with proper storage implementation
    );

    // Step 5: Create EmailSync record
    const emailSync = await createEmailSyncRecord(
      parsedEmail.parsedEmail,
      extractedContent,
      threadInfo,
      attachmentMetadata,
      userId,
      providerId
    );

    // Step 6: Try to associate with business (will be implemented separately)
    await associateEmailWithBusiness(emailSync.id);

    return {
      emailSyncId: emailSync.id,
      success: true,
      externalId: emailSync.externalId,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Email processing failed:", error);
    return {
      emailSyncId: "",
      success: false,
      externalId: "",
      error: `Failed to process email: ${errorMessage}`,
    };
  }
}

type EmailSyncWithId = {
  id: string;
  externalId: string;
};

/**
 * Extract email addresses from AddressObject
 */
function extractAddresses(
  addressObj: AddressObject | AddressObject[] | undefined
): string[] {
  // If undefined, return empty array
  if (!addressObj) return [];

  // If it's already an array, extract addresses
  if (Array.isArray(addressObj)) {
    return addressObj.map((addr) => addr.address || "");
  }

  // If it's a single object with value property
  if ("value" in addressObj && Array.isArray(addressObj.value)) {
    return addressObj.value.map((addr) => addr.address || "");
  }

  // If it's a single address object
  if ("address" in addressObj) {
    return [addressObj.address];
  }

  return [];
}

/**
 * Create EmailSync record in database
 */
async function createEmailSyncRecord(
  parsedEmail: ParsedMail,
  extractedContent: any,
  threadInfo: any,
  attachmentMetadata: any[],
  userId: string,
  providerId: string
): Promise<EmailSyncWithId> {
  // Extract basic email data
  const messageId = parsedEmail.messageId || `unknown-${Date.now()}`;
  const subject = parsedEmail.subject || "";
  const sentDate = parsedEmail.date || new Date();

  // Handle from address safely
  let fromEmail = "";
  let fromName = "";

  if (
    parsedEmail.from &&
    "value" in parsedEmail.from &&
    Array.isArray(parsedEmail.from.value) &&
    parsedEmail.from.value.length > 0
  ) {
    fromEmail = parsedEmail.from.value[0].address || "";
    fromName = parsedEmail.from.value[0].name || "";
  }

  // Extract recipients
  const toEmails = extractAddresses(parsedEmail.to);
  const ccEmails = extractAddresses(parsedEmail.cc);
  const bccEmails = extractAddresses(parsedEmail.bcc);

  // Compile metadata
  const metadata: Record<string, any> = {
    headers: Object.fromEntries(
      Array.from(parsedEmail.headers.entries()).map(([key, value]) => [
        key,
        String(value),
      ])
    ),
    threadInfo: {
      confidence: threadInfo.confidence,
      method: threadInfo.method,
      relatedMessageIds: threadInfo.relatedMessageIds,
    },
    contentInfo: {
      replyStyle: extractedContent.replyStyle,
      hasQuotedContent: !!extractedContent.quotedContent,
      hasSignature: !!extractedContent.signature,
      hasDisclaimer: !!extractedContent.disclaimer,
    },
    extractedParts: {
      quotedContent: extractedContent.quotedContent,
      signature: extractedContent.signature,
      disclaimer: extractedContent.disclaimer,
    },
  };

  // Get importance header as string
  const importance = parsedEmail.headers.get("importance");
  const importanceValue = importance ? String(importance) : "normal";

  // Use upsert instead of create to handle duplicate emails
  const emailSync = await prisma.emailSync.upsert({
    where: {
      userId_externalId: {
        userId,
        externalId: messageId,
      },
    },
    update: {
      // Only update these fields if they change
      subject,
      body: extractedContent.textContent,
      htmlBody: extractedContent.htmlContent,
      fromEmail,
      fromName,
      toEmail: toEmails,
      ccEmail: ccEmails,
      bccEmail: bccEmails,
      attachments: attachmentMetadata as Prisma.InputJsonValue,
      threadId: threadInfo.threadId,
      importance: importanceValue,
      metadata: metadata as Prisma.InputJsonValue,
      updatedAt: new Date(),
    },
    create: {
      externalId: messageId,
      subject,
      body: extractedContent.textContent,
      htmlBody: extractedContent.htmlContent,
      sentAt: sentDate,
      receivedAt: new Date(),
      fromEmail,
      fromName,
      toEmail: toEmails,
      ccEmail: ccEmails,
      bccEmail: bccEmails,
      attachments: attachmentMetadata as Prisma.InputJsonValue,
      isRead: false,
      isStarred: false,
      isDeleted: false,
      threadId: threadInfo.threadId,
      importance: importanceValue,
      metadata: metadata as Prisma.InputJsonValue,
      userId,
      providerId,
    },
  });

  return {
    id: emailSync.id,
    externalId: emailSync.externalId,
  };
}

/**
 * Batch process multiple emails
 */
export async function batchProcessEmails(
  rawEmails: string[],
  userId: string,
  providerId: string,
  concurrency: number = 5
): Promise<EmailProcessingResult[]> {
  const results: EmailProcessingResult[] = [];

  // Simple implementation - process emails in batches
  // For production, consider using a proper queue system like Bull
  const batches = [];
  for (let i = 0; i < rawEmails.length; i += concurrency) {
    batches.push(rawEmails.slice(i, i + concurrency));
  }

  for (const batch of batches) {
    const batchPromises = batch.map((rawEmail) =>
      processEmail(rawEmail, userId, providerId)
    );
    const batchResults = await Promise.allSettled(batchPromises);

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({
          emailSyncId: "",
          success: false,
          externalId: "",
          error: result.reason || "Unknown error in batch processing",
        });
      }
    }
  }

  return results;
}
