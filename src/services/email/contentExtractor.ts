import { ParsedMail } from "mailparser";

export interface ContentExtractionOptions {
  includeQuotedContent?: boolean;
  includeSignature?: boolean;
  includeDisclaimer?: boolean;
}

export interface ContentExtractionResult {
  textContent: string;
  htmlContent: string | null;
  quotedContent?: string;
  quotedHtmlContent?: string | null;
  signature?: string;
  disclaimer?: string;
  replyStyle?: "top" | "bottom" | "inline" | "unknown";
}

/**
 * Extract meaningful content from an email, separating new content from quoted text
 */
export function extractMeaningfulContent(
  parsedEmail: ParsedMail,
  options: ContentExtractionOptions = {}
): ContentExtractionResult {
  const {
    includeQuotedContent = false,
    includeSignature = false,
    includeDisclaimer = false,
  } = options;

  // Extract from text content
  const textResult = extractFromTextContent(parsedEmail.text || "");

  // Extract from HTML content if available
  const htmlResult = {
    newContent: null as string | null,
    quotedContent: null as string | null,
    signature: null as string | null,
    disclaimer: null as string | null,
  };

  if (parsedEmail.html) {
    const extracted = extractFromHtmlContent(parsedEmail.html);
    htmlResult.newContent = extracted.newContent;
    htmlResult.quotedContent = extracted.quotedContent;
    htmlResult.signature = extracted.signature;
    htmlResult.disclaimer = extracted.disclaimer;
  }

  // Build the result object
  const result: ContentExtractionResult = {
    textContent: textResult.newContent,
    htmlContent: htmlResult.newContent,
    replyStyle: textResult.replyStyle,
  };

  // Add quoted content if requested
  if (includeQuotedContent) {
    result.quotedContent = textResult.quotedContent;
    result.quotedHtmlContent = htmlResult.quotedContent;
  }

  // Add signature if requested
  if (includeSignature && (textResult.signature || htmlResult.signature)) {
    result.signature =
      textResult.signature || htmlResult.signature || undefined;
  }

  // Add disclaimer if requested
  if (includeDisclaimer && (textResult.disclaimer || htmlResult.disclaimer)) {
    result.disclaimer =
      textResult.disclaimer || htmlResult.disclaimer || undefined;
  }

  return result;
}

/**
 * Extract content from plain text email
 */
function extractFromTextContent(text: string): {
  newContent: string;
  quotedContent: string;
  signature: string | null;
  disclaimer: string | null;
  replyStyle: "top" | "bottom" | "inline" | "unknown";
} {
  if (!text) {
    return {
      newContent: "",
      quotedContent: "",
      signature: null,
      disclaimer: null,
      replyStyle: "unknown",
    };
  }

  // Extract signature
  const { textWithoutSignature, signature } = extractSignature(text);

  // Extract disclaimer
  const { textWithoutDisclaimer, disclaimer } =
    extractDisclaimer(textWithoutSignature);

  // Separate quoted content
  const { newContent, quotedContent, replyStyle } = separateQuotedContent(
    textWithoutDisclaimer
  );

  return {
    newContent,
    quotedContent,
    signature,
    disclaimer,
    replyStyle,
  };
}

/**
 * Extract content from HTML email
 */
function extractFromHtmlContent(html: string): {
  newContent: string | null;
  quotedContent: string | null;
  signature: string | null;
  disclaimer: string | null;
} {
  if (!html) {
    return {
      newContent: null,
      quotedContent: null,
      signature: null,
      disclaimer: null,
    };
  }

  // Simple implementation - in a real-world scenario, you'd use a DOM parser like JSDOM
  // to properly traverse and analyze the HTML structure

  // Check for common quote selectors
  const quotePatterns = [
    /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
    /<div class=['"]gmail_quote['"][^>]*>([\s\S]*?)<\/div>/gi,
    /<div class=['"]ms-outlook-quote['"][^>]*>([\s\S]*?)<\/div>/gi,
    /<div class=['"]yahoo_quoted['"][^>]*>([\s\S]*?)<\/div>/gi,
    /<div style=['"]border:none;border-top:solid #[a-zA-Z0-9]{6} 1.0pt[^>]*>([\s\S]*?)(<\/div>){1,2}/gi,
  ];

  // Extract quoted content
  let newContent = html;
  let quotedContent = "";

  for (const pattern of quotePatterns) {
    const matches = html.match(pattern);
    if (matches) {
      // Collect all quoted content
      quotedContent = matches.join("\n");

      // Remove quoted content from the original HTML
      newContent = newContent.replace(pattern, "");
    }
  }

  // Extract signature (simple implementation)
  const signaturePatterns = [
    /<div class=['"]signature['"][^>]*>([\s\S]*?)<\/div>/gi,
    /<div id=['"]signature['"][^>]*>([\s\S]*?)<\/div>/gi,
    /--<br>[\s\S]*?$/i,
  ];

  let signature = null;

  for (const pattern of signaturePatterns) {
    const matches = newContent.match(pattern);
    if (matches) {
      signature = matches[0];
      newContent = newContent.replace(pattern, "");
      break;
    }
  }

  // Extract disclaimer (simple implementation)
  const disclaimerPatterns = [
    /<div class=['"]disclaimer['"][^>]*>([\s\S]*?)<\/div>/gi,
    /<div id=['"]disclaimer['"][^>]*>([\s\S]*?)<\/div>/gi,
    /<div class=['"]confidentiality['"][^>]*>([\s\S]*?)<\/div>/gi,
  ];

  let disclaimer = null;

  for (const pattern of disclaimerPatterns) {
    const matches = newContent.match(pattern);
    if (matches) {
      disclaimer = matches[0];
      newContent = newContent.replace(pattern, "");
      break;
    }
  }

  return {
    newContent: newContent.trim() ? newContent : null,
    quotedContent: quotedContent.trim() ? quotedContent : null,
    signature,
    disclaimer,
  };
}

/**
 * Extract signature from email text
 */
function extractSignature(text: string): {
  textWithoutSignature: string;
  signature: string | null;
} {
  if (!text) {
    return { textWithoutSignature: "", signature: null };
  }

  // Common signature markers
  const signatureMarkers = [
    /^--\s*$/m, // -- (standard signature marker)
    /^-+\s*$/m, // ---- (multiple hyphens)
    /^_+\s*$/m, // ____ (multiple underscores)
    /^(?:regards|sincerely|cheers|best|thanks|thank you)[,.]?\s+[-a-z0-9\s\.]+$/im, // Common closings
    /^sent from my (?:iphone|ipad|android|mobile device|phone)$/im, // Mobile signatures
  ];

  for (const marker of signatureMarkers) {
    const match = marker.exec(text);
    if (match && match.index > 0) {
      // Found a signature marker - everything after it is signature
      const textWithoutSignature = text.substring(0, match.index).trim();
      const signature = text.substring(match.index).trim();

      return { textWithoutSignature, signature };
    }
  }

  return { textWithoutSignature: text, signature: null };
}

/**
 * Extract legal disclaimer from email text
 */
function extractDisclaimer(text: string): {
  textWithoutDisclaimer: string;
  disclaimer: string | null;
} {
  if (!text) {
    return { textWithoutDisclaimer: "", disclaimer: null };
  }

  // Common disclaimer markers
  const disclaimerMarkers = [
    /CONFIDENTIALITY NOTICE[:\s]/i,
    /DISCLAIMER[:\s]/i,
    /LEGAL NOTICE[:\s]/i,
    /This (?:e-?mail|message) (?:and any attachments )?(?:is|are) confidential/i,
    /This message contains confidential information/i,
    /Privileged\s*\/\s*Confidential Information/i,
  ];

  for (const marker of disclaimerMarkers) {
    const match = marker.exec(text);
    if (match) {
      // Found a disclaimer marker - everything after it is the disclaimer
      const textWithoutDisclaimer = text.substring(0, match.index).trim();
      const disclaimer = text.substring(match.index).trim();

      return { textWithoutDisclaimer, disclaimer };
    }
  }

  return { textWithoutDisclaimer: text, disclaimer: null };
}

/**
 * Separate new content from quoted content in plain text
 */
function separateQuotedContent(text: string): {
  newContent: string;
  quotedContent: string;
  replyStyle: "top" | "bottom" | "inline" | "unknown";
} {
  if (!text) {
    return { newContent: "", quotedContent: "", replyStyle: "unknown" };
  }

  // Common quote markers
  const quotePatterns = [
    /^>+\s.+$/gm, // Basic '>' quotes
    /^On .+ wrote:$/m, // "On DATE, NAME wrote:"
    /^-{3,}Original Message-{3,}$/m, // "---Original Message---"
    /^From:.*Sent:.*To:.*Subject:.*$/m, // Outlook style headers
  ];

  // Try to find the first quote marker
  let firstQuoteIndex = -1;
  let matchedPattern = null;

  for (const pattern of quotePatterns) {
    const match = pattern.exec(text);
    if (match && (firstQuoteIndex === -1 || match.index < firstQuoteIndex)) {
      firstQuoteIndex = match.index;
      matchedPattern = pattern;
    }
  }

  // If a quote marker was found
  if (firstQuoteIndex !== -1) {
    const newContent = text.substring(0, firstQuoteIndex).trim();
    const quotedContent = text.substring(firstQuoteIndex).trim();

    return {
      newContent,
      quotedContent,
      replyStyle: "top", // Top posting is most common in quoted emails
    };
  }

  // Check for bottom-posted replies (less common)
  if (isLikelyBottomPosted(text)) {
    const { originalContent, newContent } = extractBottomPostedContent(text);

    return {
      newContent,
      quotedContent: originalContent,
      replyStyle: "bottom",
    };
  }

  // No quote patterns found, assume all content is new
  return {
    newContent: text,
    quotedContent: "",
    replyStyle: "unknown",
  };
}

/**
 * Check if an email appears to be bottom-posted (reply at bottom)
 */
function isLikelyBottomPosted(text: string): boolean {
  // Common patterns in original messages that might indicate bottom posting
  const headerLineCount = (
    text.match(/^(From|Sent|To|Subject|Date|Cc):/gim) || []
  ).length;

  // If we found multiple header-like lines in the first 10 lines, it's likely bottom-posted
  const firstFewLines = text.split("\n").slice(0, 10).join("\n");
  return (
    headerLineCount >= 3 &&
    firstFewLines.includes("From:") &&
    firstFewLines.includes("To:")
  );
}

/**
 * Extract content from a bottom-posted email
 */
function extractBottomPostedContent(text: string): {
  originalContent: string;
  newContent: string;
} {
  const lines = text.split("\n");

  // Look for a significant gap between text blocks
  let gapIndex = -1;
  let maxGapLines = 0;
  let currentGapLines = 0;

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) {
      currentGapLines++;
    } else {
      if (currentGapLines > maxGapLines && i > 10) {
        // Skip gaps at the very top
        maxGapLines = currentGapLines;
        gapIndex = i - currentGapLines;
      }
      currentGapLines = 0;
    }
  }

  // If we found a significant gap (more than 2 blank lines)
  if (maxGapLines > 2 && gapIndex > 0) {
    const originalContent = lines.slice(0, gapIndex).join("\n").trim();
    const newContent = lines
      .slice(gapIndex + maxGapLines)
      .join("\n")
      .trim();

    // Verify this looks reasonable - new content should be substantial
    if (newContent.length > 20) {
      return { originalContent, newContent };
    }
  }

  // Default: assume first half is original, second half is new
  const midpoint = Math.floor(lines.length / 2);
  return {
    originalContent: lines.slice(0, midpoint).join("\n").trim(),
    newContent: lines.slice(midpoint).join("\n").trim(),
  };
}
