# MIME Parsing Strategy for Email Processing

## Overview

MIME (Multipurpose Internet Mail Extensions) is the standard that enables email to include various types of content beyond plain ASCII text. A robust MIME parsing strategy is essential for correctly processing emails with attachments, HTML content, inline images, and other complex structures.

This document outlines a detailed approach to MIME parsing for the CRM email timeline feature, focusing on handling the complexities of modern email formats.

## 1. MIME Structure Fundamentals

### Understanding MIME Parts

Emails with MIME structure are divided into parts, each with its own headers and content. The structure can be:

- **Single-part**: Contains only one content type
- **Multipart**: Contains multiple parts, each potentially with different content types
  - `multipart/alternative`: Different representations of the same content (e.g., text and HTML)
  - `multipart/mixed`: Different content types (e.g., text plus attachments)
  - `multipart/related`: Related content (e.g., HTML with inline images)
  - `multipart/digest`: Collection of messages
  - `multipart/report`: Delivery status reports

### MIME Headers

Key MIME headers to parse:
- `Content-Type`: Specifies the media type of the content
- `Content-Transfer-Encoding`: How the content is encoded (base64, quoted-printable, etc.)
- `Content-Disposition`: How to present the content (inline or attachment)
- `Content-ID`: Identifier for referencing parts (e.g., for inline images)

## 2. Implementation with mailparser

The `mailparser` library provides a robust foundation for MIME parsing. Here's a detailed implementation:

```typescript
import { simpleParser, ParsedMail, Attachment } from 'mailparser';

interface MimeParsingResult {
  parsedEmail: ParsedMail;
  textContent: string;
  htmlContent: string | null;
  attachments: ProcessedAttachment[];
  inlineImages: ProcessedInlineImage[];
  hasMultipleAlternatives: boolean;
}

interface ProcessedAttachment {
  filename: string;
  contentType: string;
  contentDisposition: string;
  contentId: string | null;
  size: number;
  content: Buffer;
}

interface ProcessedInlineImage {
  contentId: string;
  contentType: string;
  content: Buffer;
  size: number;
}

/**
 * Parse raw email content and extract MIME structure
 */
async function parseMimeStructure(rawEmail: string): Promise<MimeParsingResult> {
  try {
    // Parse the raw email
    const parsedEmail = await simpleParser(rawEmail);
    
    // Extract text content (prioritize plain text part)
    const textContent = parsedEmail.text || '';
    
    // Extract HTML content if available
    const htmlContent = parsedEmail.html || null;
    
    // Process attachments
    const attachments: ProcessedAttachment[] = [];
    const inlineImages: ProcessedInlineImage[] = [];
    
    // Process each attachment
    for (const attachment of parsedEmail.attachments) {
      // Check if it's an inline image
      if (
        attachment.contentDisposition === 'inline' && 
        attachment.contentId && 
        attachment.contentType.startsWith('image/')
      ) {
        inlineImages.push({
          contentId: attachment.contentId.replace(/[<>]/g, ''),
          contentType: attachment.contentType,
          content: attachment.content,
          size: attachment.size
        });
      } else {
        // Regular attachment
        attachments.push({
          filename: attachment.filename || `attachment-${attachments.length + 1}`,
          contentType: attachment.contentType,
          contentDisposition: attachment.contentDisposition || 'attachment',
          contentId: attachment.contentId ? attachment.contentId.replace(/[<>]/g, '') : null,
          size: attachment.size,
          content: attachment.content
        });
      }
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
      htmlContent,
      attachments,
      inlineImages,
      hasMultipleAlternatives
    };
  } catch (error) {
    console.error('MIME parsing error:', error);
    throw new Error(`Failed to parse MIME structure: ${error.message}`);
  }
}
```

## 3. Handling Character Encodings

Email can use various character encodings, which must be properly handled:

```typescript
/**
 * Ensure text is properly decoded from various character encodings
 */
function ensureProperEncoding(text: string, declaredEncoding?: string): string {
  // mailparser should handle most encoding issues, but we can add extra checks
  
  // Check for common encoding issues
  if (text.includes('=?UTF-8?') || text.includes('=?ISO-8859-1?')) {
    // This indicates the text might contain encoded words that weren't properly decoded
    try {
      const libmime = require('libmime');
      return libmime.decodeWords(text);
    } catch (error) {
      console.warn('Failed to decode MIME words:', error);
      // Fall back to original text
      return text;
    }
  }
  
  // Check for HTML entities in plain text
  if (!declaredEncoding || declaredEncoding.toLowerCase() === 'text/plain') {
    if (text.includes('&nbsp;') || text.includes('&lt;') || text.includes('&gt;')) {
      try {
        const entities = require('entities');
        return entities.decodeHTML(text);
      } catch (error) {
        console.warn('Failed to decode HTML entities:', error);
        return text;
      }
    }
  }
  
  return text;
}
```

## 4. Processing Inline Images

Inline images in HTML emails are referenced using the `cid:` protocol. These need special handling:

```typescript
/**
 * Process inline images and update HTML content to use embedded base64 data
 */
function processInlineImagesInHtml(htmlContent: string, inlineImages: ProcessedInlineImage[]): string {
  if (!htmlContent || inlineImages.length === 0) {
    return htmlContent;
  }
  
  let processedHtml = htmlContent;
  
  // Replace each cid reference with a data URL
  for (const image of inlineImages) {
    const cidPattern = new RegExp(`cid:${image.contentId}`, 'gi');
    const base64Content = image.content.toString('base64');
    const dataUrl = `data:${image.contentType};base64,${base64Content}`;
    
    processedHtml = processedHtml.replace(cidPattern, dataUrl);
  }
  
  return processedHtml;
}
```

## 5. Handling Nested MIME Structures

Some emails contain deeply nested MIME structures, especially in forwarded messages or replies:

```typescript
/**
 * Recursively process nested MIME structures
 */
function processNestedMimeParts(part: any, depth: number = 0): any {
  // Prevent excessive recursion
  if (depth > 10) {
    return { type: 'max-depth-reached' };
  }
  
  // Base case: this is a leaf node with content
  if (part.content) {
    return {
      type: part.type,
      content: part.content,
      encoding: part.encoding,
      disposition: part.disposition
    };
  }
  
  // Recursive case: this is a multipart container
  if (part.childNodes && part.childNodes.length > 0) {
    return {
      type: part.type,
      subtype: part.subtype,
      childNodes: part.childNodes.map(child => processNestedMimeParts(child, depth + 1))
    };
  }
  
  // Default case
  return { type: 'unknown' };
}
```

## 6. Extracting Email Headers

Email headers contain crucial metadata that needs careful extraction:

```typescript
/**
 * Extract and normalize important email headers
 */
function extractEmailHeaders(parsedEmail: ParsedMail): Record<string, any> {
  const headers: Record<string, any> = {};
  
  // Standard headers
  headers.messageId = parsedEmail.messageId;
  headers.subject = parsedEmail.subject;
  headers.from = parsedEmail.from;
  headers.to = parsedEmail.to;
  headers.cc = parsedEmail.cc;
  headers.bcc = parsedEmail.bcc;
  headers.date = parsedEmail.date;
  
  // Thread-related headers
  headers.references = parsedEmail.references || [];
  headers.inReplyTo = parsedEmail.inReplyTo || null;
  
  // Extract custom headers that might be useful
  const headerMap = parsedEmail.headers;
  
  // Gmail-specific headers
  if (headerMap.has('x-gm-thrid')) {
    headers.gmailThreadId = headerMap.get('x-gm-thrid');
  }
  
  if (headerMap.has('x-gm-msgid')) {
    headers.gmailMessageId = headerMap.get('x-gm-msgid');
  }
  
  if (headerMap.has('x-gm-labels')) {
    headers.gmailLabels = headerMap.get('x-gm-labels');
  }
  
  // Priority/importance headers
  if (headerMap.has('importance')) {
    headers.importance = headerMap.get('importance');
  }
  
  if (headerMap.has('x-priority')) {
    headers.priority = headerMap.get('x-priority');
  }
  
  // Delivery notification headers
  if (headerMap.has('disposition-notification-to')) {
    headers.readReceiptRequested = true;
    headers.readReceiptEmail = headerMap.get('disposition-notification-to');
  }
  
  return headers;
}
```

## 7. Handling Special MIME Types

Some MIME types require special handling:

```typescript
/**
 * Process special MIME types that need custom handling
 */
function handleSpecialMimeTypes(parsedEmail: ParsedMail): any {
  const specialContent: Record<string, any> = {};
  
  // Check for calendar invites
  const calendarPart = parsedEmail.attachments.find(
    att => att.contentType === 'text/calendar' || 
           att.contentType === 'application/ics'
  );
  
  if (calendarPart) {
    try {
      const ical = require('node-ical');
      const calendarData = ical.parseICS(calendarPart.content.toString());
      specialContent.calendar = calendarData;
    } catch (error) {
      console.warn('Failed to parse calendar data:', error);
    }
  }
  
  // Check for digital signatures (S/MIME)
  const signaturePart = parsedEmail.attachments.find(
    att => att.contentType === 'application/pkcs7-signature' ||
           att.contentType === 'application/x-pkcs7-signature'
  );
  
  if (signaturePart) {
    specialContent.signed = true;
    // Further signature verification would require additional crypto libraries
  }
  
  // Check for encrypted content
  const encryptedPart = parsedEmail.attachments.find(
    att => att.contentType === 'application/pkcs7-mime' && 
           att.contentType.includes('enveloped-data')
  );
  
  if (encryptedPart) {
    specialContent.encrypted = true;
  }
  
  return specialContent;
}
```

## 8. Handling Malformed MIME Content

Email clients don't always follow standards perfectly, so handling malformed content is important:

```typescript
/**
 * Handle common MIME malformations and edge cases
 */
function handleMalformedMime(rawEmail: string): string {
  let processedEmail = rawEmail;
  
  // Fix common boundary issues
  processedEmail = fixBoundaryIssues(processedEmail);
  
  // Fix content-transfer-encoding issues
  processedEmail = fixEncodingIssues(processedEmail);
  
  // Fix content-type issues
  processedEmail = fixContentTypeIssues(processedEmail);
  
  return processedEmail;
}

/**
 * Fix common boundary issues in multipart emails
 */
function fixBoundaryIssues(rawEmail: string): string {
  // Find Content-Type header with boundary
  const boundaryMatch = rawEmail.match(/Content-Type:.*boundary="?([^"\r\n]+)"?/i);
  if (!boundaryMatch) return rawEmail;
  
  const boundary = boundaryMatch[1];
  
  // Check if boundary declarations are consistent
  const boundaryStart = `--${boundary}`;
  const boundaryEnd = `--${boundary}--`;
  
  // If boundary end is missing, add it
  if (rawEmail.includes(boundaryStart) && !rawEmail.includes(boundaryEnd)) {
    return rawEmail + `\r\n${boundaryEnd}\r\n`;
  }
  
  return rawEmail;
}

/**
 * Fix common content-transfer-encoding issues
 */
function fixEncodingIssues(rawEmail: string): string {
  // Some emails declare base64 but aren't properly encoded
  // This is a simplified example - real implementation would be more complex
  if (rawEmail.includes('Content-Transfer-Encoding: base64')) {
    // Check if the content actually looks like base64
    const contentParts = rawEmail.split('\r\n\r\n');
    if (contentParts.length > 1) {
      const body = contentParts[1];
      // Very basic check - real base64 validation would be more thorough
      const looksLikeBase64 = /^[A-Za-z0-9+/=\r\n]+$/.test(body);
      
      if (!looksLikeBase64) {
        // Replace with quoted-printable or 7bit
        return rawEmail.replace(
          'Content-Transfer-Encoding: base64',
          'Content-Transfer-Encoding: quoted-printable'
        );
      }
    }
  }
  
  return rawEmail;
}

/**
 * Fix common content-type issues
 */
function fixContentTypeIssues(rawEmail: string): string {
  // Some emails have malformed content-type headers
  // Example: missing semicolons, incorrect charsets, etc.
  
  // Fix charset declarations
  let processedEmail = rawEmail.replace(
    /Content-Type:([^;]*);[\s]*charset=([^;"\r\n]+)/gi,
    'Content-Type:$1; charset="$2"'
  );
  
  // Fix missing content-type for text
  if (!processedEmail.includes('Content-Type:')) {
    // Add a default content-type if missing
    const headerEndPos = processedEmail.indexOf('\r\n\r\n');
    if (headerEndPos !== -1) {
      const headers = processedEmail.substring(0, headerEndPos);
      const body = processedEmail.substring(headerEndPos);
      processedEmail = headers + '\r\nContent-Type: text/plain; charset="utf-8"' + body;
    }
  }
  
  return processedEmail;
}
```

## 9. Attachment Processing

Handling email attachments requires special attention:

```typescript
/**
 * Process email attachments for storage and retrieval
 */
async function processAttachments(
  attachments: ProcessedAttachment[],
  emailId: string,
  storageStrategy: 'database' | 'filesystem' | 'cloud' = 'cloud'
): Promise<AttachmentMetadata[]> {
  const attachmentMetadata: AttachmentMetadata[] = [];
  
  for (const attachment of attachments) {
    try {
      // Generate a unique ID for the attachment
      const attachmentId = generateUniqueId();
      
      // Store the attachment based on the selected strategy
      let storageReference: string;
      
      switch (storageStrategy) {
        case 'database':
          // Store directly in database (not recommended for large files)
          storageReference = await storeAttachmentInDatabase(
            emailId, 
            attachmentId, 
            attachment
          );
          break;
          
        case 'filesystem':
          // Store in local filesystem
          storageReference = await storeAttachmentInFilesystem(
            emailId, 
            attachmentId, 
            attachment
          );
          break;
          
        case 'cloud':
        default:
          // Store in cloud storage (S3, GCS, etc.)
          storageReference = await storeAttachmentInCloud(
            emailId, 
            attachmentId, 
            attachment
          );
          break;
      }
      
      // Add metadata to the list
      attachmentMetadata.push({
        id: attachmentId,
        filename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.size,
        contentId: attachment.contentId,
        storageReference,
        storageStrategy
      });
    } catch (error) {
      console.error(`Failed to process attachment ${attachment.filename}:`, error);
      // Continue with other attachments
    }
  }
  
  return attachmentMetadata;
}

/**
 * Store attachment in cloud storage (example using AWS S3)
 */
async function storeAttachmentInCloud(
  emailId: string,
  attachmentId: string,
  attachment: ProcessedAttachment
): Promise<string> {
  // This is a simplified example - real implementation would use AWS SDK
  const AWS = require('aws-sdk');
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });
  
  const key = `attachments/${emailId}/${attachmentId}/${attachment.filename}`;
  
  await s3.putObject({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: attachment.content,
    ContentType: attachment.contentType
  }).promise();
  
  return key;
}
```

## 10. Complete MIME Processing Pipeline

Putting it all together into a complete pipeline:

```typescript
/**
 * Complete MIME processing pipeline for email
 */
async function processMimeEmail(
  rawEmail: string,
  userId: string,
  providerId: string
): Promise<ProcessedEmail> {
  try {
    // Step 1: Fix any malformed MIME content
    const fixedEmail = handleMalformedMime(rawEmail);
    
    // Step 2: Parse the MIME structure
    const {
      parsedEmail,
      textContent,
      htmlContent,
      attachments,
      inlineImages,
      hasMultipleAlternatives
    } = await parseMimeStructure(fixedEmail);
    
    // Step 3: Extract and normalize headers
    const headers = extractEmailHeaders(parsedEmail);
    
    // Step 4: Process text content with proper encoding
    const processedTextContent = ensureProperEncoding(textContent, 'text/plain');
    
    // Step 5: Process HTML content and inline images
    let processedHtmlContent = null;
    if (htmlContent) {
      const encodedHtml = ensureProperEncoding(htmlContent, 'text/html');
      processedHtmlContent = processInlineImagesInHtml(encodedHtml, inlineImages);
    }
    
    // Step 6: Handle any special MIME types
    const specialContent = handleSpecialMimeTypes(parsedEmail);
    
    // Step 7: Process attachments
    const attachmentMetadata = await processAttachments(
      attachments,
      headers.messageId,
      'cloud' // Use cloud storage for attachments
    );
    
    // Step 8: Create the processed email object
    const processedEmail: ProcessedEmail = {
      messageId: headers.messageId,
      threadId: headers.gmailThreadId || headers.references[0] || headers.messageId,
      subject: headers.subject || '',
      from: {
        email: headers.from?.value?.[0]?.address || '',
        name: headers.from?.value?.[0]?.name || ''
      },
      to: (headers.to?.value || []).map(addr => ({
        email: addr.address,
        name: addr.name
      })),
      cc: (headers.cc?.value || []).map(addr => ({
        email: addr.address,
        name: addr.name
      })),
      bcc: (headers.bcc?.value || []).map(addr => ({
        email: addr.address,
        name: addr.name
      })),
      sentAt: headers.date || new Date(),
      receivedAt: new Date(),
      importance: headers.importance || 'normal',
      textContent: processedTextContent,
      htmlContent: processedHtmlContent,
      attachments: attachmentMetadata,
      hasAttachments: attachmentMetadata.length > 0,
      specialContent,
      headers: headers,
      userId,
      providerId
    };
    
    return processedEmail;
  } catch (error) {
    console.error('Email MIME processing failed:', error);
    throw new Error(`Failed to process email: ${error.message}`);
  }
}
```

## 11. Testing MIME Parsing

Testing MIME parsing with various email formats is crucial:

```typescript
/**
 * Test suite for MIME parsing
 */
describe('MIME Parsing', () => {
  test('should parse simple text email', async () => {
    const rawEmail = fs.readFileSync('./test/fixtures/simple_text.eml', 'utf8');
    const result = await processMimeEmail(rawEmail, 'test-user', 'test-provider');
    
    expect(result.textContent).toBeTruthy();
    expect(result.htmlContent).toBeNull();
    expect(result.attachments.length).toBe(0);
  });
  
  test('should parse HTML email', async () => {
    const rawEmail = fs.readFileSync('./test/fixtures/html_email.eml', 'utf8');
    const result = await processMimeEmail(rawEmail, 'test-user', 'test-provider');
    
    expect(result.textContent).toBeTruthy();
    expect(result.htmlContent).toBeTruthy();
    expect(result.htmlContent).toContain('<html');
  });
  
  test('should parse email with attachments', async () => {
    const rawEmail = fs.readFileSync('./test/fixtures/email_with_attachments.eml', 'utf8');
    const result = await processMimeEmail(rawEmail, 'test-user', 'test-provider');
    
    expect(result.attachments.length).toBeGreaterThan(0);
    expect(result.hasAttachments).toBe(true);
  });
  
  test('should parse email with inline images', async () => {
    const rawEmail = fs.readFileSync('./test/fixtures/email_with_inline_images.eml', 'utf8');
    const result = await processMimeEmail(rawEmail, 'test-user', 'test-provider');
    
    expect(result.htmlContent).toContain('data:image/');
  });
  
  test('should handle malformed MIME content', async () => {
    const rawEmail = fs.readFileSync('./test/fixtures/malformed_mime.eml', 'utf8');
    const result = await processMimeEmail(rawEmail, 'test-user', 'test-provider');
    
    // Should not throw and should extract whatever content is available
    expect(result.messageId).toBeTruthy();
  });
  
  test('should parse nested forwarded messages', async () => {
    const rawEmail = fs.readFileSync('./test/fixtures/forwarded_email.eml', 'utf8');
    const result = await processMimeEmail(rawEmail, 'test-user', 'test-provider');
    
    // Should contain content from both the wrapper and forwarded message
    expect(result.textContent).toContain('Forwarded message');
  });
});
```

## 12. Performance Considerations

MIME parsing can be resource-intensive, so performance optimization is important:

```typescript
/**
 * Optimize MIME parsing for performance
 */
async function optimizedMimeProcessing(
  rawEmails: string[],
  userId: string,
  providerId: string
): Promise<ProcessedEmail[]> {
  // Process in batches to avoid memory issues
  const batchSize = 10;
  const results: ProcessedEmail[] = [];
  
  for (let i = 0; i < rawEmails.length; i += batchSize) {
    const batch = rawEmails.slice(i, i + batchSize);
    
    // Process batch in parallel with concurrency limit
    const batchPromises = batch.map(rawEmail => 
      processMimeEmail(rawEmail, userId, providerId)
        .catch(error => {
          console.error('Failed to process email in batch:', error);
          return null; // Return null for failed emails
        })
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter(Boolean)); // Filter out nulls
  }
  
  return results;
}
```

## 13. Integration with EmailSync Model

Finally, integrating the MIME parsing with the EmailSync model:

```typescript
/**
 * Store processed email in the EmailSync model
 */
async function storeProcessedEmail(processedEmail: ProcessedEmail): Promise<string> {
  try {
    // Create EmailSync record
    const emailSync = await prisma.emailSync.create({
      data: {
        externalId: processedEmail.messageId,
        subject: processedEmail.subject,
        body: processedEmail.textContent,
        htmlBody: processedEmail.htmlContent,
        sentAt: processedEmail.sentAt,
        receivedAt: processedEmail.receivedAt,
        fromEmail: processedEmail.from.email,
        fromName: processedEmail.from.name,
        toEmail: processedEmail.to.map(recipient => recipient.email),
        ccEmail: processedEmail.cc.map(recipient => recipient.email),
        bccEmail: processedEmail.bcc.map(recipient => recipient.email),
        attachments: processedEmail.attachments,
        isRead: false,
        isStarred: false,
        isDeleted: false,
        folderPath: processedEmail.specialContent.gmailLabels || null,
        threadId: processedEmail.threadId,
        importance: processedEmail.importance,
        userId: processedEmail.userId,
        providerId: processedEmail.providerId
      }
    });
    
    return emailSync.id;
  } catch (error) {
    console.error('Failed to store processed email:', error);
    throw new Error(`Failed to store email: ${error.message}`);
  }
}
```

## Conclusion

This comprehensive MIME parsing strategy addresses the complexities of modern email formats. By implementing this approach, the CRM system will be able to correctly process emails with various content types, attachments, and structures, ensuring that the email timeline feature provides a complete and accurate representation of email communications.

The strategy is modular and extensible, allowing for future enhancements as email standards evolve or as new requirements emerge. It also includes robust error handling and performance optimizations to ensure reliable operation at scale.
