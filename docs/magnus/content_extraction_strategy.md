# Email Content Extraction Strategy

## Overview

Effective email content extraction is crucial for presenting clear and relevant information in a CRM timeline. This document outlines a comprehensive approach to extracting meaningful content from emails by separating new content from quoted text, identifying and handling signatures, and processing different reply styles.

The goal is to present users with clean, relevant content while preserving the context of conversations and maintaining the integrity of the original messages.

## 1. Understanding Email Content Structure

Modern emails typically contain several distinct components:

1. **New Content**: The fresh text added by the sender
2. **Quoted Content**: Text from previous messages in the conversation
3. **Signatures**: The sender's signature block
4. **Disclaimers**: Legal text often added automatically
5. **Attachments**: Files attached to the email
6. **Inline Images**: Images embedded within the email body

Different email clients format these components in various ways, requiring a robust approach to content extraction.

## 2. Separating New Content from Quoted Content

### Text-Based Emails

```typescript
/**
 * Separate new content from quoted content in plain text emails
 */
function separateQuotedContent(emailText: string): { 
  newContent: string, 
  quotedContent: string 
} {
  // If empty or undefined, return empty strings
  if (!emailText) {
    return { newContent: '', quotedContent: '' };
  }
  
  // Common quote markers
  const quotePatterns = [
    // Basic quote markers
    /^>+\s.+$/gm,                                  // Basic '>' quotes
    /^On .+ wrote:$/m,                             // "On DATE, NAME wrote:"
    /^-{3,}Original Message-{3,}$/m,               // "---Original Message---"
    /^From:.*Sent:.*To:.*Subject:.*$/m,            // Outlook style headers
    
    // Language-specific patterns
    /^Le\s+.*\s+a\s+écrit\s+:$/m,                  // French: "Le DATE, NAME a écrit :"
    /^Am\s+.*\s+schrieb\s+.*:$/m,                  // German: "Am DATE schrieb NAME:"
    /^El\s+.*,\s+.*\s+escribió:$/m,                // Spanish: "El DATE, NAME escribió:"
    /^Em\s+.*,\s+.*\s+escreveu:$/m,                // Portuguese: "Em DATE, NAME escreveu:"
    
    // Common separators
    /^________________________________$/m,         // Underscores separator
    /^-{2,}$/m,                                    // -- separator
    /^={2,}$/m,                                    // == separator
    /^[*]{2,}$/m,                                  // ** separator
    /^[.]{2,}$/m                                   // .. separator
  ];
  
  // Find the first occurrence of any quote pattern
  let firstQuoteIndex = -1;
  let matchedPattern = null;
  
  for (const pattern of quotePatterns) {
    // Reset lastIndex to ensure we start from the beginning
    pattern.lastIndex = 0;
    
    const match = pattern.exec(emailText);
    if (match && (firstQuoteIndex === -1 || match.index < firstQuoteIndex)) {
      firstQuoteIndex = match.index;
      matchedPattern = pattern;
    }
  }
  
  // If a quote marker or separator was found
  if (firstQuoteIndex !== -1) {
    // Get the line containing the quote marker
    const textBeforeQuote = emailText.substring(0, firstQuoteIndex).trim();
    const quotedText = emailText.substring(firstQuoteIndex).trim();
    
    return {
      newContent: textBeforeQuote,
      quotedContent: quotedText
    };
  }
  
  // Special case: check for bottom-posted replies
  // These often don't have clear markers but have original message at the top
  if (isLikelyBottomPosted(emailText)) {
    const { originalContent, newContent } = extractBottomPostedContent(emailText);
    return {
      newContent: newContent,
      quotedContent: originalContent
    };
  }
  
  // No quote markers found, assume all content is new
  return {
    newContent: emailText.trim(),
    quotedContent: ''
  };
}

/**
 * Check if an email is likely bottom-posted (reply at bottom)
 */
function isLikelyBottomPosted(emailText: string): boolean {
  // Common patterns in original messages that might indicate bottom posting
  const originalMessagePatterns = [
    /^From:.*$/m,
    /^Sent:.*$/m,
    /^To:.*$/m,
    /^Subject:.*$/m,
    /^Date:.*$/m
  ];
  
  // Check if multiple header-like lines appear near the top of the message
  let headerLikeCount = 0;
  const firstFewLines = emailText.split('\n').slice(0, 10).join('\n');
  
  for (const pattern of originalMessagePatterns) {
    if (pattern.test(firstFewLines)) {
      headerLikeCount++;
    }
  }
  
  // If we found multiple header-like lines at the top, it's likely bottom-posted
  return headerLikeCount >= 3;
}

/**
 * Extract content from a bottom-posted email
 */
function extractBottomPostedContent(emailText: string): {
  originalContent: string,
  newContent: string
} {
  const lines = emailText.split('\n');
  
  // Look for a significant gap between text blocks
  let gapIndex = -1;
  let maxGapLines = 0;
  let currentGapLines = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) {
      currentGapLines++;
    } else {
      if (currentGapLines > maxGapLines && i > 10) { // Skip gaps at the very top
        maxGapLines = currentGapLines;
        gapIndex = i - currentGapLines;
      }
      currentGapLines = 0;
    }
  }
  
  // If we found a significant gap (more than 2 blank lines)
  if (maxGapLines > 2 && gapIndex > 0) {
    const originalContent = lines.slice(0, gapIndex).join('\n').trim();
    const newContent = lines.slice(gapIndex + maxGapLines).join('\n').trim();
    
    // Verify this looks reasonable - new content should be substantial
    if (newContent.length > 20) {
      return { originalContent, newContent };
    }
  }
  
  // Default: assume first half is original, second half is new
  const midpoint = Math.floor(lines.length / 2);
  return {
    originalContent: lines.slice(0, midpoint).join('\n').trim(),
    newContent: lines.slice(midpoint).join('\n').trim()
  };
}
```

### HTML-Based Emails

```typescript
/**
 * Separate new content from quoted content in HTML emails
 */
function separateHtmlQuotedContent(htmlContent: string): {
  newContent: string,
  quotedContent: string
} {
  if (!htmlContent) {
    return { newContent: '', quotedContent: '' };
  }
  
  // Use a DOM parser to analyze the HTML
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;
  
  // Common quote selectors used by email clients
  const quoteSelectors = [
    'blockquote',                                // Standard HTML blockquote
    '.gmail_quote',                              // Gmail
    '.yahoo_quoted',                             // Yahoo
    '.ms-outlook-quote',                         // Outlook
    '.AppleMailSignature',                       // Apple Mail signature
    'div[style*="border-left: 1px solid"]',      // Common quote styling
    'div[style*="border-left:1px solid"]',       // Variant of above
    'div[style*="padding-left: 1em"]',           // Another common style
    'div.OutlookMessageHeader',                  // Outlook message header
    'div[data-marker="__QUOTED_TEXT__"]'         // Generic marker
  ];
  
  // Find the first quote element
  let quoteElement = null;
  for (const selector of quoteSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      quoteElement = element;
      break;
    }
  }
  
  // If we found a quote element
  if (quoteElement) {
    // Clone the document for the non-quoted version
    const nonQuotedDom = new JSDOM(htmlContent);
    const nonQuotedDoc = nonQuotedDom.window.document;
    
    // Find and remove the quote in the cloned document
    const quoteToRemove = nonQuotedDoc.querySelector(
      quoteElement.tagName + (quoteElement.className ? '.' + quoteElement.className.replace(/\s+/g, '.') : '')
    );
    
    if (quoteToRemove && quoteToRemove.parentNode) {
      quoteToRemove.parentNode.removeChild(quoteToRemove);
    }
    
    return {
      newContent: nonQuotedDoc.body.innerHTML,
      quotedContent: quoteElement.outerHTML
    };
  }
  
  // If no standard quote elements found, try to identify by common patterns
  
  // Look for horizontal rules which often separate new and quoted content
  const horizontalRules = document.querySelectorAll('hr');
  for (const hr of horizontalRules) {
    // Check if there's quoted-looking content after the HR
    const nextElement = hr.nextElementSibling;
    if (nextElement) {
      const textAfterHr = nextElement.textContent || '';
      
      // Check if text after HR contains common quoted content markers
      if (
        textAfterHr.includes('From:') && 
        (textAfterHr.includes('Sent:') || textAfterHr.includes('Date:')) && 
        textAfterHr.includes('To:')
      ) {
        // This looks like quoted content
        const newContentElements = [];
        let currentElement = document.body.firstChild;
        
        // Collect all elements before the HR
        while (currentElement && currentElement !== hr) {
          newContentElements.push(currentElement.cloneNode(true));
          currentElement = currentElement.nextSibling;
        }
        
        // Create containers for new and quoted content
        const newContentContainer = document.createElement('div');
        newContentElements.forEach(el => newContentContainer.appendChild(el));
        
        const quotedContentContainer = document.createElement('div');
        quotedContentContainer.appendChild(hr.cloneNode(true));
        
        // Add everything after the HR to quoted content
        currentElement = hr.nextSibling;
        while (currentElement) {
          quotedContentContainer.appendChild(currentElement.cloneNode(true));
          currentElement = currentElement.nextSibling;
        }
        
        return {
          newContent: newContentContainer.innerHTML,
          quotedContent: quotedContentContainer.innerHTML
        };
      }
    }
  }
  
  // If all else fails, look for color or style changes that might indicate quoted content
  const allElements = document.querySelectorAll('*');
  let colorChangeElement = null;
  
  for (const element of allElements) {
    const style = dom.window.getComputedStyle(element);
    const color = style.color;
    const backgroundColor = style.backgroundColor;
    
    // Check for elements with gray text or different background color
    if (
      (color && (color.includes('rgb(102, 102, 102)') || color.includes('rgb(119, 119, 119)'))) ||
      (backgroundColor && backgroundColor !== 'transparent' && backgroundColor !== 'rgb(255, 255, 255)')
    ) {
      // This might be quoted content
      const text = element.textContent || '';
      
      // Verify it looks like quoted content
      if (
        text.length > 50 && // Not too short
        (text.includes('wrote:') || text.includes('From:') || text.includes('Sent:'))
      ) {
        colorChangeElement = element;
        break;
      }
    }
  }
  
  if (colorChangeElement) {
    // Similar to HR approach, separate content before and after this element
    const newContentElements = [];
    let currentElement = document.body.firstChild;
    
    // Collect all elements before the color change element
    while (currentElement && currentElement !== colorChangeElement) {
      newContentElements.push(currentElement.cloneNode(true));
      currentElement = currentElement.nextSibling;
    }
    
    // Create containers for new and quoted content
    const newContentContainer = document.createElement('div');
    newContentElements.forEach(el => newContentContainer.appendChild(el));
    
    const quotedContentContainer = document.createElement('div');
    quotedContentContainer.appendChild(colorChangeElement.cloneNode(true));
    
    // Add everything after the color change element to quoted content
    currentElement = colorChangeElement.nextSibling;
    while (currentElement) {
      quotedContentContainer.appendChild(currentElement.cloneNode(true));
      currentElement = currentElement.nextSibling;
    }
    
    return {
      newContent: newContentContainer.innerHTML,
      quotedContent: quotedContentContainer.innerHTML
    };
  }
  
  // No quote elements found
  return {
    newContent: htmlContent,
    quotedContent: ''
  };
}
```

## 3. Identifying and Removing Signatures

### Text-Based Signatures

```typescript
/**
 * Identify and remove signature from email text
 */
function removeSignature(emailText: string): {
  contentWithoutSignature: string,
  signature: string
} {
  if (!emailText) {
    return { contentWithoutSignature: '', signature: '' };
  }
  
  // Common signature markers
  const signaturePatterns = [
    /^--\s*$/m,                                    // -- on its own line
    /^__\s*$/m,                                    // __ on its own line
    /^-{2,}$/m,                                    // Multiple dashes
    /^_{2,}$/m,                                    // Multiple underscores
    /^Regards,\s*$/mi,                             // "Regards,"
    /^Best regards,\s*$/mi,                        // "Best regards,"
    /^Thanks,\s*$/mi,                              // "Thanks,"
    /^Thank you,\s*$/mi,                           // "Thank you,"
    /^Cheers,\s*$/mi,                              // "Cheers,"
    /^Sincerely,\s*$/mi,                           // "Sincerely,"
    /^Best,\s*$/mi,                                // "Best,"
    /^Kind regards,\s*$/mi,                        // "Kind regards,"
    /^Warm regards,\s*$/mi,                        // "Warm regards,"
    /^Yours truly,\s*$/mi,                         // "Yours truly,"
    /^Sent from my (?:iPhone|iPad|Android|mobile device).*$/m // Mobile signatures
  ];
  
  // Find the first occurrence of any signature pattern
  let signatureIndex = -1;
  let matchedPattern = null;
  
  for (const pattern of signaturePatterns) {
    // Reset lastIndex to ensure we start from the beginning
    pattern.lastIndex = 0;
    
    const match = pattern.exec(emailText);
    if (match && (signatureIndex === -1 || match.index < signatureIndex)) {
      // Make sure this isn't in the first few lines (likely not a signature)
      const precedingText = emailText.substring(0, match.index);
      const lineCount = (precedingText.match(/\n/g) || []).length;
      
      if (lineCount > 2) { // Require at least a few lines before signature
        signatureIndex = match.index;
        matchedPattern = pattern;
      }
    }
  }
  
  // If a signature marker was found
  if (signatureIndex !== -1) {
    const contentWithoutSignature = emailText.substring(0, signatureIndex).trim();
    const signature = emailText.substring(signatureIndex).trim();
    
    return { contentWithoutSignature, signature };
  }
  
  // Try heuristic approach if no clear marker
  const lines = emailText.split('\n');
  
  // Check the last few lines for signature-like content
  if (lines.length > 4) {
    const lastFewLines = lines.slice(-4).join('\n');
    
    // Check for common signature patterns without clear markers
    const hasName = /^[A-Z][a-z]+ [A-Z][a-z]+$/m.test(lastFewLines); // Full name format
    const hasPhone = /(?:\+\d{1,3}[-\.\s]?)?\(?\d{3}\)?[-\.\s]?\d{3}[-\.\s]?\d{4}/.test(lastFewLines); // Phone number
    const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(lastFewLines); // Email address
    const hasUrl = /https?:\/\/[^\s]+/.test(lastFewLines); // URL
    
    // If multiple signature indicators are found
    if ([hasName, hasPhone, hasEmail, hasUrl].filter(Boolean).length >= 2) {
      // Find the start of the signature block
      let sigStart = lines.length - 4;
      
      // Look for a blank line before the signature
      for (let i = lines.length - 5; i >= 0; i--) {
        if (!lines[i].trim()) {
          sigStart = i + 1;
          break;
        }
      }
      
      const contentWithoutSignature = lines.slice(0, sigStart).join('\n').trim();
      const signature = lines.slice(sigStart).join('\n').trim();
      
      return { contentWithoutSignature, signature };
    }
  }
  
  // No signature markers found
  return {
    contentWithoutSignature: emailText,
    signature: ''
  };
}
```

### HTML-Based Signatures

```typescript
/**
 * Identify and remove signature from HTML email
 */
function removeHtmlSignature(htmlContent: string): {
  contentWithoutSignature: string,
  signature: string
} {
  if (!htmlContent) {
    return { contentWithoutSignature: '', signature: '' };
  }
  
  // Use a DOM parser to analyze the HTML
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;
  
  // Common signature selectors
  const signatureSelectors = [
    '.gmail_signature',                          // Gmail signature
    '.AppleMailSignature',                       // Apple Mail signature
    '.ms-outlook-signature',                     // Outlook signature
    '.yahoo-signature',                          // Yahoo signature
    'div[data-smartmail="gmail_signature"]',     // Another Gmail signature format
    'div[data-marker="__SIGNATURE__"]',          // Generic signature marker
    'div[class*="signature"]',                   // Any class containing "signature"
    'div[id*="signature"]'                       // Any ID containing "signature"
  ];
  
  // Find the first signature element
  let signatureElement = null;
  for (const selector of signatureSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      signatureElement = element;
      break;
    }
  }
  
  // If we found a signature element
  if (signatureElement) {
    // Clone the document for the non-signature version
    const nonSigDom = new JSDOM(htmlContent);
    const nonSigDoc = nonSigDom.window.document;
    
    // Find and remove the signature in the cloned document
    const sigToRemove = nonSigDoc.querySelector(
      signatureElement.tagName + (signatureElement.className ? '.' + signatureElement.className.replace(/\s+/g, '.') : '')
    );
    
    if (sigToRemove && sigToRemove.parentNode) {
      sigToRemove.parentNode.removeChild(sigToRemove);
    }
    
    return {
      contentWithoutSignature: nonSigDoc.body.innerHTML,
      signature: signatureElement.outerHTML
    };
  }
  
  // If no explicit signature element, look for common signature patterns
  
  // Look for "Sent from my..." text
  const allElements = document.querySelectorAll('*');
  for (const element of allElements) {
    const text = element.textContent || '';
    if (text.match(/Sent from my (iPhone|iPad|Android|mobile device)/i)) {
      // This is likely a signature
      
      // Clone the document for the non-signature version
      const nonSigDom = new JSDOM(htmlContent);
      const nonSigDoc = nonSigDom.window.document;
      
      // Find the same element in the clone
      const elementPath = getElementPath(element, document.body);
      const sigToRemove = getElementByPath(elementPath, nonSigDoc.body);
      
      if (sigToRemove && sigToRemove.parentNode) {
        // Get the parent div if this is just a text node
        const parentToRemove = 
          sigToRemove.nodeType === 3 && sigToRemove.parentNode.nodeName !== 'BODY' 
            ? sigToRemove.parentNode 
            : sigToRemove;
            
        if (parentToRemove.parentNode) {
          parentToRemove.parentNode.removeChild(parentToRemove);
          
          return {
            contentWithoutSignature: nonSigDoc.body.innerHTML,
            signature: parentToRemove.outerHTML || text
          };
        }
      }
    }
  }
  
  // Look for horizontal rule followed by contact info
  const horizontalRules = document.querySelectorAll('hr');
  for (const hr of horizontalRules) {
    // Check content after the HR
    let contentAfterHr = '';
    let currentNode = hr.nextSibling;
    
    while (currentNode) {
      if (currentNode.nodeType === 3) { // Text node
        contentAfterHr += currentNode.textContent;
      } else if (currentNode.nodeType === 1) { // Element node
        contentAfterHr += currentNode.textContent;
      }
      currentNode = currentNode.nextSibling;
    }
    
    // Check if content after HR looks like contact info
    const hasPhone = /(?:\+\d{1,3}[-\.\s]?)?\(?\d{3}\)?[-\.\s]?\d{3}[-\.\s]?\d{4}/.test(contentAfterHr);
    const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(contentAfterHr);
    const hasUrl = /https?:\/\/[^\s]+/.test(contentAfterHr);
    
    if (hasPhone || hasEmail || hasUrl) {
      // This looks like a signature
      
      // Clone the document for the non-signature version
      const nonSigDom = new JSDOM(htmlContent);
      const nonSigDoc = nonSigDom.window.document;
      
      // Find the HR in the clone
      const elementPath = getElementPath(hr, document.body);
      const hrToRemove = getElementByPath(elementPath, nonSigDoc.body);
      
      if (hrToRemove) {
        // Create a container for the signature
        const signatureContainer = document.createElement('div');
        signatureContainer.appendChild(hr.cloneNode(true));
        
        // Add everything after the HR to the signature
        let currentElement = hr.nextSibling;
        while (currentElement) {
          signatureContainer.appendChild(currentElement.cloneNode(true));
          currentElement = currentElement.nextSibling;
        }
        
        // Remove HR and everything after it from the non-signature version
        currentElement = hrToRemove;
        while (currentElement) {
          const nextElement = currentElement.nextSibling;
          if (currentElement.parentNode) {
            currentElement.parentNode.removeChild(currentElement);
          }
          currentElement = nextElement;
        }
        
        return {
          contentWithoutSignature: nonSigDoc.body.innerHTML,
          signature: signatureContainer.innerHTML
        };
      }
    }
  }
  
  // No signature found
  return {
    contentWithoutSignature: htmlContent,
    signature: ''
  };
}

/**
 * Get the path to an element from a parent element
 */
function getElementPath(element, rootElement) {
  const path = [];
  let currentElement = element;
  
  while (currentElement !== rootElement && currentElement.parentNode) {
    const parent = currentElement.parentNode;
    const siblings = Array.from(parent.childNodes);
    const index = siblings.indexOf(currentElement);
    
    path.unshift(index);
    currentElement = parent;
  }
  
  return path;
}

/**
 * Get an element by following a path from a parent element
 */
function getElementByPath(path, rootElement) {
  let currentElement = rootElement;
  
  for (const index of path) {
    if (currentElement.childNodes && index < currentElement.childNodes.length) {
      currentElement = currentElement.childNodes[index];
    } else {
      return null;
    }
  }
  
  return currentElement;
}
```

## 4. Handling Different Reply Styles

### Top Posting vs. Bottom Posting

```typescript
/**
 * Determine email reply style and process accordingly
 */
function processReplyStyle(
  emailContent: string, 
  quotedContent: string, 
  isHtml: boolean
): {
  processedContent: string,
  replyStyle: 'top' | 'bottom' | 'inline' | 'unknown'
} {
  if (!emailContent) {
    return { processedContent: '', replyStyle: 'unknown' };
  }
  
  if (!quotedContent) {
    // No quoted content, can't determine style
    return { processedContent: emailContent, replyStyle: 'unknown' };
  }
  
  if (isHtml) {
    return processHtmlReplyStyle(emailContent, quotedContent);
  } else {
    return processTextReplyStyle(emailContent, quotedContent);
  }
}

/**
 * Process text-based email reply style
 */
function processTextReplyStyle(
  emailContent: string, 
  quotedContent: string
): {
  processedContent: string,
  replyStyle: 'top' | 'bottom' | 'inline' | 'unknown'
} {
  // Check if this is a top posting (new content first, then quoted)
  // or bottom posting (quoted first, then new content)
  
  // If the email starts with quoted content, it's likely bottom posting
  if (emailContent.trimStart().startsWith(quotedContent.trimStart()) && quotedContent) {
    // Extract the new content (after the quoted content)
    const newContentStart = emailContent.indexOf(quotedContent) + quotedContent.length;
    const newContent = emailContent.substring(newContentStart).trim();
    
    // If there's substantial new content after the quote, it's bottom posting
    if (newContent.length > 20) { // Arbitrary threshold to avoid signature-only content
      return {
        processedContent: `[QUOTED CONTENT]\n\n${newContent}`,
        replyStyle: 'bottom'
      };
    }
  }
  
  // Check for inline replies (quoted content with responses interspersed)
  const quotedLines = quotedContent.split('\n');
  const fullLines = emailContent.split('\n');
  
  // Count how many quoted lines have non-quoted content immediately after them
  let inlineReplyCount = 0;
  
  for (let i = 0; i < fullLines.length - 1; i++) {
    const currentLine = fullLines[i];
    const nextLine = fullLines[i + 1];
    
    // If current line starts with '>' and next line doesn't
    if (
      currentLine.trimStart().startsWith('>') && 
      !nextLine.trimStart().startsWith('>') &&
      nextLine.trim().length > 0
    ) {
      inlineReplyCount++;
    }
  }
  
  // If we found multiple inline replies, it's likely inline style
  if (inlineReplyCount >= 2) {
    // For inline replies, we want to preserve the structure but highlight the new content
    const processedLines = fullLines.map(line => {
      if (line.trimStart().startsWith('>')) {
        return `<quoted>${line}</quoted>`;
      } else {
        return `<reply>${line}</reply>`;
      }
    });
    
    return {
      processedContent: processedLines.join('\n'),
      replyStyle: 'inline'
    };
  }
  
  // Default to top posting (most common in modern emails)
  // Remove the quoted content from the end if it exists
  if (emailContent.endsWith(quotedContent)) {
    return {
      processedContent: emailContent.substring(0, emailContent.length - quotedContent.length).trim(),
      replyStyle: 'top'
    };
  }
  
  // If we can't clearly determine the style, return the original content
  return {
    processedContent: emailContent,
    replyStyle: 'unknown'
  };
}

/**
 * Process HTML-based email reply style
 */
function processHtmlReplyStyle(
  htmlContent: string, 
  quotedHtml: string
): {
  processedContent: string,
  replyStyle: 'top' | 'bottom' | 'inline' | 'unknown'
} {
  // Use a DOM parser to analyze the HTML
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;
  
  // Create a DOM for the quoted content
  const quotedDom = new JSDOM(quotedHtml);
  const quotedDoc = quotedDom.window.document;
  
  // Check if quoted content appears at the beginning or end
  const bodyHtml = document.body.innerHTML;
  const quotedElement = quotedDoc.body.firstElementChild;
  
  if (!quotedElement) {
    return {
      processedContent: htmlContent,
      replyStyle: 'unknown'
    };
  }
  
  const quotedHtmlString = quotedElement.outerHTML;
  
  // Check for bottom posting (quoted content at top)
  if (bodyHtml.trimStart().startsWith(quotedHtmlString)) {
    // Extract content after the quoted part
    const newContentStart = bodyHtml.indexOf(quotedHtmlString) + quotedHtmlString.length;
    const newContent = bodyHtml.substring(newContentStart).trim();
    
    // If there's substantial new content after the quote, it's bottom posting
    if (newContent.length > 50) { // Higher threshold for HTML
      return {
        processedContent: `<div class="quoted-content" style="color: #777; border-left: 2px solid #ccc; padding-left: 10px; margin: 10px 0;">
          [QUOTED CONTENT]
        </div>
        <div class="new-content">
          ${newContent}
        </div>`,
        replyStyle: 'bottom'
      };
    }
  }
  
  // Check for top posting (quoted content at bottom)
  if (bodyHtml.trimEnd().endsWith(quotedHtmlString)) {
    // Extract content before the quoted part
    const newContent = bodyHtml.substring(0, bodyHtml.indexOf(quotedHtmlString)).trim();
    
    return {
      processedContent: newContent,
      replyStyle: 'top'
    };
  }
  
  // Check for inline replies
  // This is complex in HTML, but we can look for alternating quoted/non-quoted blocks
  const blockElements = document.querySelectorAll('div, p, blockquote');
  let alternatingCount = 0;
  let lastWasQuoted = false;
  
  for (let i = 0; i < blockElements.length; i++) {
    const element = blockElements[i];
    const isQuoted = 
      element.tagName === 'BLOCKQUOTE' || 
      element.className.includes('quote') ||
      element.style.borderLeft !== '';
    
    if (i > 0 && isQuoted !== lastWasQuoted) {
      alternatingCount++;
    }
    
    lastWasQuoted = isQuoted;
  }
  
  if (alternatingCount >= 3) { // Multiple alternations suggest inline replies
    // For inline replies in HTML, we can add styling to differentiate
    const processedDom = new JSDOM(htmlContent);
    const processedDoc = processedDom.window.document;
    
    const blocks = processedDoc.querySelectorAll('div, p, blockquote');
    for (const block of blocks) {
      const isQuoted = 
        block.tagName === 'BLOCKQUOTE' || 
        block.className.includes('quote') ||
        block.style.borderLeft !== '';
      
      if (isQuoted) {
        block.style.color = '#777777';
        block.style.borderLeft = '2px solid #cccccc';
        block.style.paddingLeft = '10px';
        block.style.margin = '10px 0';
      } else {
        block.style.color = '#000000';
        block.style.fontWeight = 'normal';
      }
    }
    
    return {
      processedContent: processedDoc.body.innerHTML,
      replyStyle: 'inline'
    };
  }
  
  // If we can't clearly determine the style, return the original content
  return {
    processedContent: htmlContent,
    replyStyle: 'unknown'
  };
}
```

## 5. Handling Legal Disclaimers

```typescript
/**
 * Identify and separate legal disclaimers from email content
 */
function extractLegalDisclaimer(emailText: string): {
  contentWithoutDisclaimer: string,
  disclaimer: string
} {
  if (!emailText) {
    return { contentWithoutDisclaimer: '', disclaimer: '' };
  }
  
  // Common disclaimer markers
  const disclaimerPatterns = [
    /CONFIDENTIALITY NOTICE:?/i,
    /DISCLAIMER:?/i,
    /LEGAL DISCLAIMER:?/i,
    /PRIVILEGED AND CONFIDENTIAL:?/i,
    /This (email|e-mail|message) (and any attachments )?contains confidential information/i,
    /This (email|e-mail|message) is intended only for the use of the individual/i,
    /This (email|e-mail|message) is confidential and may be privileged/i,
    /This (email|e-mail|message) is for the intended recipient only/i,
    /The information (contained|in this email) is (confidential|proprietary)/i,
    /The information transmitted is intended only for the person or entity to which it is addressed/i
  ];
  
  // Find the first occurrence of any disclaimer pattern
  let disclaimerIndex = -1;
  let matchedPattern = null;
  
  for (const pattern of disclaimerPatterns) {
    const match = pattern.exec(emailText);
    if (match && (disclaimerIndex === -1 || match.index < disclaimerIndex)) {
      // Make sure this isn't in the first paragraph (likely not a disclaimer)
      const precedingText = emailText.substring(0, match.index);
      const paragraphCount = (precedingText.match(/\n\s*\n/g) || []).length;
      
      if (paragraphCount > 0) { // Require at least one paragraph before disclaimer
        disclaimerIndex = match.index;
        matchedPattern = pattern;
      }
    }
  }
  
  // If a disclaimer marker was found
  if (disclaimerIndex !== -1) {
    const contentWithoutDisclaimer = emailText.substring(0, disclaimerIndex).trim();
    const disclaimer = emailText.substring(disclaimerIndex).trim();
    
    return { contentWithoutDisclaimer, disclaimer };
  }
  
  // No disclaimer found
  return {
    contentWithoutDisclaimer: emailText,
    disclaimer: ''
  };
}
```

## 6. Extracting Meaningful Content from Complex Emails

```typescript
/**
 * Extract meaningful content from a complex email
 */
function extractMeaningfulContent(
  parsedEmail: any,
  options: {
    includeQuotedContent?: boolean;
    includeSignature?: boolean;
    includeDisclaimer?: boolean;
    preferHtml?: boolean;
  } = {}
): {
  textContent: string;
  htmlContent: string | null;
  quotedContent: string;
  signature: string;
  disclaimer: string;
  replyStyle: 'top' | 'bottom' | 'inline' | 'unknown';
} {
  const {
    includeQuotedContent = false,
    includeSignature = false,
    includeDisclaimer = false,
    preferHtml = true
  } = options;
  
  // Get text and HTML content from parsed email
  const rawTextContent = parsedEmail.text || '';
  const rawHtmlContent = parsedEmail.html || null;
  
  // Process text content
  const { newContent: textWithoutQuotes, quotedContent: textQuotedContent } = 
    separateQuotedContent(rawTextContent);
  
  const { contentWithoutSignature: textWithoutSignature, signature: textSignature } = 
    removeSignature(textWithoutQuotes);
  
  const { contentWithoutDisclaimer: cleanTextContent, disclaimer: textDisclaimer } = 
    extractLegalDisclaimer(textWithoutSignature);
  
  const { processedContent: processedTextContent, replyStyle: textReplyStyle } = 
    processReplyStyle(rawTextContent, textQuotedContent, false);
  
  // Process HTML content if available
  let htmlWithoutQuotes = '';
  let htmlQuotedContent = '';
  let htmlWithoutSignature = '';
  let htmlSignature = '';
  let cleanHtmlContent = '';
  let processedHtmlContent = '';
  let htmlReplyStyle: 'top' | 'bottom' | 'inline' | 'unknown' = 'unknown';
  
  if (rawHtmlContent) {
    const htmlResult = separateHtmlQuotedContent(rawHtmlContent);
    htmlWithoutQuotes = htmlResult.newContent;
    htmlQuotedContent = htmlResult.quotedContent;
    
    const sigResult = removeHtmlSignature(htmlWithoutQuotes);
    htmlWithoutSignature = sigResult.contentWithoutSignature;
    htmlSignature = sigResult.signature;
    
    // HTML disclaimer extraction is complex and would require a separate implementation
    cleanHtmlContent = htmlWithoutSignature;
    
    const styleResult = processHtmlReplyStyle(rawHtmlContent, htmlQuotedContent);
    processedHtmlContent = styleResult.processedContent;
    htmlReplyStyle = styleResult.replyStyle;
  }
  
  // Determine which content to use based on preferences
  let finalTextContent = cleanTextContent;
  if (includeQuotedContent) finalTextContent += '\n\n' + textQuotedContent;
  if (includeSignature) finalTextContent += '\n\n' + textSignature;
  if (includeDisclaimer) finalTextContent += '\n\n' + textDisclaimer;
  
  let finalHtmlContent = null;
  if (rawHtmlContent) {
    finalHtmlContent = cleanHtmlContent;
    
    if (includeQuotedContent && htmlQuotedContent) {
      finalHtmlContent += `
        <div class="quoted-content" style="margin-top: 20px; color: #777; border-left: 2px solid #ccc; padding-left: 10px;">
          ${htmlQuotedContent}
        </div>
      `;
    }
    
    if (includeSignature && htmlSignature) {
      finalHtmlContent += `
        <div class="signature" style="margin-top: 20px; color: #777; font-size: 0.9em;">
          ${htmlSignature}
        </div>
      `;
    }
    
    // Disclaimer would be added here if HTML disclaimer extraction was implemented
  }
  
  // Choose the best content based on preference
  const bestHtmlContent = preferHtml && finalHtmlContent ? finalHtmlContent : null;
  const bestTextContent = finalTextContent;
  const bestReplyStyle = preferHtml && rawHtmlContent ? htmlReplyStyle : textReplyStyle;
  
  return {
    textContent: bestTextContent,
    htmlContent: bestHtmlContent,
    quotedContent: textQuotedContent,
    signature: textSignature,
    disclaimer: textDisclaimer,
    replyStyle: bestReplyStyle
  };
}
```

## 7. Handling Special Cases

### Forwarded Messages

```typescript
/**
 * Extract forwarded message content
 */
function extractForwardedMessage(emailText: string): {
  introText: string;
  forwardedHeaders: Record<string, string>;
  forwardedContent: string;
} {
  if (!emailText) {
    return { introText: '', forwardedHeaders: {}, forwardedContent: '' };
  }
  
  // Common forwarded message markers
  const forwardPatterns = [
    /^-{3,}[\s]*Forwarded message[\s]*-{3,}$/m,
    /^_{3,}[\s]*Forwarded message[\s]*_{3,}$/m,
    /^={3,}[\s]*Forwarded message[\s]*={3,}$/m,
    /^Begin forwarded message:$/m,
    /^Forwarded: /m
  ];
  
  // Find the first occurrence of any forward pattern
  let forwardIndex = -1;
  let matchedPattern = null;
  
  for (const pattern of forwardPatterns) {
    const match = pattern.exec(emailText);
    if (match && (forwardIndex === -1 || match.index < forwardIndex)) {
      forwardIndex = match.index;
      matchedPattern = pattern;
    }
  }
  
  // If a forward marker was found
  if (forwardIndex !== -1) {
    const introText = emailText.substring(0, forwardIndex).trim();
    const forwardedPart = emailText.substring(forwardIndex).trim();
    
    // Extract forwarded headers
    const headerPatterns = {
      from: /^From:[\s]*(.+)$/m,
      date: /^Date:[\s]*(.+)$/m,
      subject: /^Subject:[\s]*(.+)$/m,
      to: /^To:[\s]*(.+)$/m,
      cc: /^Cc:[\s]*(.+)$/m
    };
    
    const forwardedHeaders: Record<string, string> = {};
    
    for (const [key, pattern] of Object.entries(headerPatterns)) {
      const match = pattern.exec(forwardedPart);
      if (match && match[1]) {
        forwardedHeaders[key] = match[1].trim();
      }
    }
    
    // Find where the headers end and the actual content begins
    let contentStart = forwardedPart.length;
    
    // Look for a blank line after the headers
    const headerEndPattern = /^(From|Date|Subject|To|Cc):[\s]*.*\n\s*\n/m;
    const headerEndMatch = headerEndPattern.exec(forwardedPart);
    
    if (headerEndMatch) {
      contentStart = headerEndMatch.index + headerEndMatch[0].length;
    } else {
      // If no clear end to headers, look for the last header and skip to next line
      const lastHeaderPositions = Object.values(headerPatterns)
        .map(pattern => {
          const match = pattern.exec(forwardedPart);
          return match ? match.index + match[0].length : -1;
        })
        .filter(pos => pos !== -1);
      
      if (lastHeaderPositions.length > 0) {
        const lastHeaderEnd = Math.max(...lastHeaderPositions);
        const nextLineMatch = /\n/.exec(forwardedPart.substring(lastHeaderEnd));
        
        if (nextLineMatch) {
          contentStart = lastHeaderEnd + nextLineMatch.index + 1;
        }
      }
    }
    
    const forwardedContent = forwardedPart.substring(contentStart).trim();
    
    return {
      introText,
      forwardedHeaders,
      forwardedContent
    };
  }
  
  // No forwarded message found
  return {
    introText: emailText,
    forwardedHeaders: {},
    forwardedContent: ''
  };
}
```

### Calendar Invites

```typescript
/**
 * Extract calendar invite details from email
 */
function extractCalendarInvite(parsedEmail: any): {
  isCalendarInvite: boolean;
  eventDetails: {
    summary?: string;
    description?: string;
    location?: string;
    start?: Date;
    end?: Date;
    organizer?: string;
    attendees?: string[];
  };
} {
  // Check if this is a calendar invite
  const isCalendarInvite = 
    parsedEmail.attachments?.some(att => 
      att.contentType === 'text/calendar' || 
      att.contentType === 'application/ics'
    ) ||
    parsedEmail.headers?.has('content-class') && 
    parsedEmail.headers?.get('content-class') === 'urn:content-classes:calendarmessage';
  
  if (!isCalendarInvite) {
    return { isCalendarInvite: false, eventDetails: {} };
  }
  
  // Find the calendar attachment
  const calendarAttachment = parsedEmail.attachments?.find(att => 
    att.contentType === 'text/calendar' || 
    att.contentType === 'application/ics'
  );
  
  if (calendarAttachment) {
    try {
      // Parse the iCalendar data
      const ical = require('node-ical');
      const calendarData = ical.parseICS(calendarAttachment.content.toString());
      
      // Extract the event (there's typically only one)
      const event = Object.values(calendarData).find(item => item.type === 'VEVENT');
      
      if (event) {
        return {
          isCalendarInvite: true,
          eventDetails: {
            summary: event.summary,
            description: event.description,
            location: event.location,
            start: event.start,
            end: event.end,
            organizer: event.organizer?.val,
            attendees: event.attendee ? 
              (Array.isArray(event.attendee) ? 
                event.attendee.map(a => a.val) : 
                [event.attendee.val]
              ) : []
          }
        };
      }
    } catch (error) {
      console.error('Failed to parse calendar data:', error);
    }
  }
  
  // Fallback: try to extract calendar info from email content
  const subject = parsedEmail.subject || '';
  const text = parsedEmail.text || '';
  
  // Look for common calendar invite patterns in the text
  const dateTimePattern = /(?:Date|When):\s*([^,\n]+)/i;
  const locationPattern = /(?:Location|Where):\s*([^\n]+)/i;
  const organizerPattern = /(?:Organizer|Organized by):\s*([^\n]+)/i;
  
  const dateTimeMatch = dateTimePattern.exec(text);
  const locationMatch = locationPattern.exec(text);
  const organizerMatch = organizerPattern.exec(text);
  
  return {
    isCalendarInvite: true,
    eventDetails: {
      summary: subject,
      description: text,
      location: locationMatch ? locationMatch[1].trim() : undefined,
      organizer: organizerMatch ? organizerMatch[1].trim() : undefined,
      // Parsing dates from text is complex and error-prone
      // A more sophisticated implementation would be needed for accurate date extraction
    }
  };
}
```

## 8. Integration with EmailSync Model

```typescript
/**
 * Process email content for storage in EmailSync model
 */
async function processEmailForStorage(
  parsedEmail: any,
  options: {
    extractQuotedContent?: boolean;
    extractSignature?: boolean;
    extractDisclaimer?: boolean;
    detectReplyStyle?: boolean;
    handleForwarded?: boolean;
    handleCalendarInvites?: boolean;
  } = {}
): Promise<{
  body: string;
  htmlBody: string | null;
  metadata: Record<string, any>;
}> {
  const {
    extractQuotedContent = true,
    extractSignature = true,
    extractDisclaimer = true,
    detectReplyStyle = true,
    handleForwarded = true,
    handleCalendarInvites = true
  } = options;
  
  // Extract meaningful content
  const extractedContent = extractMeaningfulContent(parsedEmail, {
    includeQuotedContent: false,
    includeSignature: false,
    includeDisclaimer: false,
    preferHtml: true
  });
  
  // Process forwarded messages if needed
  let forwardedData = null;
  if (handleForwarded) {
    forwardedData = extractForwardedMessage(parsedEmail.text || '');
  }
  
  // Process calendar invites if needed
  let calendarData = null;
  if (handleCalendarInvites) {
    calendarData = extractCalendarInvite(parsedEmail);
  }
  
  // Compile metadata
  const metadata: Record<string, any> = {};
  
  if (extractQuotedContent && extractedContent.quotedContent) {
    metadata.quotedContent = extractedContent.quotedContent;
  }
  
  if (extractSignature && extractedContent.signature) {
    metadata.signature = extractedContent.signature;
  }
  
  if (extractDisclaimer && extractedContent.disclaimer) {
    metadata.disclaimer = extractedContent.disclaimer;
  }
  
  if (detectReplyStyle) {
    metadata.replyStyle = extractedContent.replyStyle;
  }
  
  if (forwardedData && forwardedData.forwardedContent) {
    metadata.forwarded = {
      introText: forwardedData.introText,
      headers: forwardedData.forwardedHeaders,
      content: forwardedData.forwardedContent
    };
  }
  
  if (calendarData && calendarData.isCalendarInvite) {
    metadata.calendarEvent = calendarData.eventDetails;
  }
  
  return {
    body: extractedContent.textContent,
    htmlBody: extractedContent.htmlContent,
    metadata
  };
}
```

## 9. Handling Email Threads in Content Extraction

```typescript
/**
 * Process a complete email thread for display
 */
function processEmailThread(
  emails: any[],
  options: {
    includeQuotedContent?: boolean;
    collapseQuotes?: boolean;
    highlightNewContent?: boolean;
  } = {}
): {
  threadContent: string;
  threadHtmlContent: string | null;
  messageCount: number;
} {
  const {
    includeQuotedContent = false,
    collapseQuotes = true,
    highlightNewContent = true
  } = options;
  
  // Sort emails by date (oldest first)
  const sortedEmails = [...emails].sort((a, b) => 
    new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  );
  
  // Process each email
  const processedEmails = sortedEmails.map(email => {
    const extractedContent = extractMeaningfulContent(email, {
      includeQuotedContent: includeQuotedContent && !collapseQuotes,
      includeSignature: false,
      includeDisclaimer: false,
      preferHtml: true
    });
    
    return {
      id: email.id,
      from: email.from,
      sentAt: email.sentAt,
      textContent: extractedContent.textContent,
      htmlContent: extractedContent.htmlContent,
      quotedContent: extractedContent.quotedContent,
      replyStyle: extractedContent.replyStyle
    };
  });
  
  // Build text thread content
  let threadContent = '';
  
  processedEmails.forEach((email, index) => {
    // Add separator between messages
    if (index > 0) {
      threadContent += '\n\n' + '-'.repeat(40) + '\n\n';
    }
    
    // Add header
    threadContent += `From: ${email.from.name || email.from.email}\n`;
    threadContent += `Date: ${new Date(email.sentAt).toLocaleString()}\n\n`;
    
    // Add content
    threadContent += email.textContent;
    
    // Add quoted content if needed
    if (includeQuotedContent && !collapseQuotes && email.quotedContent) {
      threadContent += '\n\n> ' + email.quotedContent.replace(/\n/g, '\n> ');
    }
  });
  
  // Build HTML thread content
  let threadHtmlContent = '';
  
  if (processedEmails.some(email => email.htmlContent)) {
    threadHtmlContent = '<div class="email-thread">';
    
    processedEmails.forEach((email, index) => {
      // Add separator between messages
      if (index > 0) {
        threadHtmlContent += '<hr style="border: 1px solid #eee; margin: 20px 0;">';
      }
      
      // Add header
      threadHtmlContent += `
        <div class="email-header" style="margin-bottom: 10px; color: #555;">
          <div><strong>From:</strong> ${email.from.name || email.from.email}</div>
          <div><strong>Date:</strong> ${new Date(email.sentAt).toLocaleString()}</div>
        </div>
      `;
      
      // Add content
      if (email.htmlContent) {
        threadHtmlContent += `
          <div class="email-content" ${highlightNewContent ? 'style="background-color: #f9f9f9; padding: 10px; border-radius: 5px;"' : ''}>
            ${email.htmlContent}
          </div>
        `;
      } else {
        threadHtmlContent += `
          <div class="email-content" ${highlightNewContent ? 'style="background-color: #f9f9f9; padding: 10px; border-radius: 5px;"' : ''}>
            <pre style="white-space: pre-wrap; font-family: inherit;">${email.textContent}</pre>
          </div>
        `;
      }
      
      // Add quoted content if needed
      if (includeQuotedContent && !collapseQuotes && email.quotedContent) {
        threadHtmlContent += `
          <div class="quoted-content" style="margin-top: 10px; color: #777; border-left: 2px solid #ccc; padding-left: 10px;">
            <pre style="white-space: pre-wrap; font-family: inherit;">${email.quotedContent}</pre>
          </div>
        `;
      }
    });
    
    threadHtmlContent += '</div>';
  }
  
  return {
    threadContent,
    threadHtmlContent,
    messageCount: processedEmails.length
  };
}
```

## 10. Testing Content Extraction

```typescript
/**
 * Test suite for content extraction
 */
describe('Email Content Extraction', () => {
  test('should separate quoted content in text email', () => {
    const emailText = 'This is my reply.\n\nOn Wed, Jan 1, 2023, John Doe <john@example.com> wrote:\n> This is the original message.\n> It spans multiple lines.';
    const { newContent, quotedContent } = separateQuotedContent(emailText);
    
    expect(newContent).toBe('This is my reply.');
    expect(quotedContent).toContain('On Wed, Jan 1, 2023');
    expect(quotedContent).toContain('This is the original message.');
  });
  
  test('should identify and remove signature', () => {
    const emailText = 'Hello,\n\nThis is the main content of the email.\n\n--\nJohn Doe\nSenior Developer\nExample Corp\nPhone: 555-1234';
    const { contentWithoutSignature, signature } = removeSignature(emailText);
    
    expect(contentWithoutSignature).toBe('Hello,\n\nThis is the main content of the email.');
    expect(signature).toContain('John Doe');
    expect(signature).toContain('Senior Developer');
  });
  
  test('should identify top posting style', () => {
    const emailText = 'This is my reply.\n\nOn Wed, Jan 1, 2023, John Doe <john@example.com> wrote:\n> This is the original message.\n> It spans multiple lines.';
    const quotedContent = 'On Wed, Jan 1, 2023, John Doe <john@example.com> wrote:\n> This is the original message.\n> It spans multiple lines.';
    
    const { processedContent, replyStyle } = processReplyStyle(emailText, quotedContent, false);
    
    expect(replyStyle).toBe('top');
    expect(processedContent).toBe('This is my reply.');
  });
  
  test('should identify bottom posting style', () => {
    const emailText = 'On Wed, Jan 1, 2023, John Doe <john@example.com> wrote:\n> This is the original message.\n> It spans multiple lines.\n\nThis is my reply at the bottom.';
    const quotedContent = 'On Wed, Jan 1, 2023, John Doe <john@example.com> wrote:\n> This is the original message.\n> It spans multiple lines.';
    
    const { processedContent, replyStyle } = processReplyStyle(emailText, quotedContent, false);
    
    expect(replyStyle).toBe('bottom');
    expect(processedContent).toContain('[QUOTED CONTENT]');
    expect(processedContent).toContain('This is my reply at the bottom.');
  });
  
  test('should extract forwarded message', () => {
    const emailText = 'FYI, see below.\n\n---------- Forwarded message ----------\nFrom: John Doe <john@example.com>\nDate: Wed, Jan 1, 2023\nSubject: Important Information\nTo: recipient@example.com\n\nThis is the forwarded content.';
    
    const { introText, forwardedHeaders, forwardedContent } = extractForwardedMessage(emailText);
    
    expect(introText).toBe('FYI, see below.');
    expect(forwardedHeaders.from).toContain('John Doe');
    expect(forwardedHeaders.subject).toBe('Important Information');
    expect(forwardedContent).toBe('This is the forwarded content.');
  });
  
  test('should extract legal disclaimer', () => {
    const emailText = 'Hello,\n\nThis is the main content.\n\nRegards,\nJohn\n\nCONFIDENTIALITY NOTICE: This email contains confidential information and is intended only for the named recipient. If you have received this email in error, please notify the sender immediately.';
    
    const { contentWithoutDisclaimer, disclaimer } = extractLegalDisclaimer(emailText);
    
    expect(contentWithoutDisclaimer).toContain('Hello,');
    expect(contentWithoutDisclaimer).toContain('Regards,');
    expect(disclaimer).toContain('CONFIDENTIALITY NOTICE');
  });
});
```

## Conclusion

This comprehensive content extraction strategy addresses the complexities of processing email content for a CRM system. By implementing these techniques, the system will be able to:

1. Separate new content from quoted text
2. Identify and handle email signatures
3. Process different reply styles (top posting, bottom posting, inline replies)
4. Extract and manage legal disclaimers
5. Handle special cases like forwarded messages and calendar invites
6. Present clean, relevant content in the email timeline

The strategy is designed to work with both plain text and HTML emails, and includes robust error handling and testing approaches. By properly extracting and organizing email content, the CRM system can provide users with a clear and efficient view of their email communications with customers.
