import { simpleParser, ParsedMail, Attachment } from "mailparser";

interface ProcessedAttachment {
  filename: string;
  contentType: string;
  contentDisposition: string;
  contentId: string | null;
  size: number;
  content?: Buffer;
  url?: string;
}

interface ProcessedInlineImage {
  contentId: string;
  contentType: string;
  content: Buffer;
  size: number;
}

export interface MimeParsingResult {
  parsedEmail: ParsedMail;
  textContent: string;
  htmlContent: string | null;
  attachments: ProcessedAttachment[];
  inlineImages: ProcessedInlineImage[];
  hasMultipleAlternatives: boolean;
}

/**
 * Parse raw email content and extract MIME structure
 */
export async function parseMimeStructure(
  rawEmail: string
): Promise<MimeParsingResult> {
  try {
    // Parse the raw email using mailparser
    const parsedEmail = await simpleParser(rawEmail);

    // Extract text content (prioritize plain text part)
    const textContent = parsedEmail.text || "";

    // Extract HTML content if available
    const htmlContent = parsedEmail.html || null;

    // Process attachments and inline images
    const attachments: ProcessedAttachment[] = [];
    const inlineImages: ProcessedInlineImage[] = [];

    // Process each attachment
    for (const attachment of parsedEmail.attachments || []) {
      // Check if it's an inline image
      if (
        attachment.contentDisposition === "inline" &&
        attachment.contentId &&
        attachment.contentType.startsWith("image/")
      ) {
        inlineImages.push({
          contentId: attachment.contentId.replace(/[<>]/g, ""),
          contentType: attachment.contentType,
          content: attachment.content,
          size: attachment.size,
        });
      } else {
        // Regular attachment
        attachments.push({
          filename:
            attachment.filename || `attachment-${attachments.length + 1}`,
          contentType: attachment.contentType,
          contentDisposition: attachment.contentDisposition || "attachment",
          contentId: attachment.contentId
            ? attachment.contentId.replace(/[<>]/g, "")
            : null,
          size: attachment.size,
          content: attachment.content,
        });
      }
    }

    // Process HTML content to replace CID references with base64 data URLs
    let processedHtmlContent = htmlContent;
    if (htmlContent && inlineImages.length > 0) {
      processedHtmlContent = processInlineImagesInHtml(
        htmlContent,
        inlineImages
      );
    }

    // Determine if email has multiple alternative representations
    const hasMultipleAlternatives = Boolean(
      parsedEmail.html &&
        parsedEmail.text &&
        parsedEmail.html !== parsedEmail.text
    );

    return {
      parsedEmail,
      textContent,
      htmlContent: processedHtmlContent,
      attachments,
      inlineImages,
      hasMultipleAlternatives,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("MIME parsing error:", error);
    throw new Error(`Failed to parse MIME structure: ${errorMessage}`);
  }
}

/**
 * Process inline images and update HTML content to use embedded base64 data
 */
function processInlineImagesInHtml(
  htmlContent: string,
  inlineImages: ProcessedInlineImage[]
): string {
  if (!htmlContent || inlineImages.length === 0) {
    return htmlContent;
  }

  let processedHtml = htmlContent;

  // Replace each cid reference with a data URL
  for (const image of inlineImages) {
    const cidPattern = new RegExp(`cid:${image.contentId}`, "gi");
    const base64Content = image.content.toString("base64");
    const dataUrl = `data:${image.contentType};base64,${base64Content}`;

    processedHtml = processedHtml.replace(cidPattern, dataUrl);
  }

  return processedHtml;
}

/**
 * Process attachments for storage (e.g., upload to cloud storage)
 * This is a placeholder - implement actual storage logic as needed
 */
export async function processAttachmentsForStorage(
  attachments: ProcessedAttachment[],
  messageId: string,
  storageType: "local" | "cloud" = "local"
): Promise<ProcessedAttachment[]> {
  // Placeholder function - in a real implementation, this would:
  // 1. Store attachments in the chosen storage system
  // 2. Generate URLs for stored attachments
  // 3. Return attachment metadata without actual content buffers

  return attachments.map((attachment) => {
    // Create a copy without the content buffer
    const { content, ...metadataOnly } = attachment;

    // Add a placeholder URL (in a real implementation, this would be the actual storage URL)
    return {
      ...metadataOnly,
      url: `https://storage.example.com/attachments/${messageId}/${attachment.filename}`,
    };
  });
}
