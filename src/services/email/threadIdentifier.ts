import { ParsedMail } from "mailparser";

export interface ThreadIdentificationResult {
  threadId: string;
  relatedMessageIds: string[];
  confidence: number; // 0-1 indicating confidence level
  method: string; // Method used to identify the thread
}

/**
 * Identify email thread based on email headers
 */
export function identifyEmailThread(
  parsedEmail: ParsedMail
): ThreadIdentificationResult {
  // Try different methods of thread identification in order of reliability

  // Method 1: Gmail Thread ID (Most reliable if available)
  const gmailThreadId = extractGmailThreadId(parsedEmail);
  if (gmailThreadId) {
    return {
      threadId: `gmail-${gmailThreadId}`,
      relatedMessageIds: [parsedEmail.messageId || ""],
      confidence: 1.0,
      method: "gmail_thread_id",
    };
  }

  // Method 2: References/In-Reply-To headers
  const threadByReferences = identifyThreadByReferences(parsedEmail);
  if (threadByReferences.confidence > 0.7) {
    return threadByReferences;
  }

  // Method 3: Subject-based grouping (least reliable)
  const threadBySubject = identifyThreadBySubject(parsedEmail);
  if (threadBySubject.confidence > 0.5) {
    return threadBySubject;
  }

  // Fallback: Create a new thread ID based on the message ID
  return {
    threadId: `msg-${normalizeMessageId(
      parsedEmail.messageId || `unknown-${Date.now()}`
    )}`,
    relatedMessageIds: [parsedEmail.messageId || ""],
    confidence: 1.0,
    method: "message_id_fallback",
  };
}

/**
 * Extract Gmail thread ID from headers
 */
function extractGmailThreadId(parsedEmail: ParsedMail): string | null {
  // Check for Gmail-specific X-GM-THRID header
  const headers = parsedEmail.headers;
  const threadIdHeader =
    headers.get("x-gm-thrid") || headers.get("x-gmail-thread-id");

  if (threadIdHeader) {
    return String(threadIdHeader);
  }

  return null;
}

/**
 * Identify thread based on References and In-Reply-To headers
 */
function identifyThreadByReferences(
  parsedEmail: ParsedMail
): ThreadIdentificationResult {
  const messageId = parsedEmail.messageId || "";
  const references = parsedEmail.references || [];
  const inReplyTo = parsedEmail.inReplyTo || [];

  // Combine References and In-Reply-To for a complete picture
  const allReferences = [...new Set([...references, ...inReplyTo])];

  if (allReferences.length === 0) {
    return {
      threadId: `msg-${normalizeMessageId(messageId)}`,
      relatedMessageIds: [messageId],
      confidence: 0.5,
      method: "single_message",
    };
  }

  // Use the oldest message ID (typically the first one in the chain) as the thread ID
  const oldestReference = allReferences[0];
  const threadId = `ref-${normalizeMessageId(oldestReference)}`;

  return {
    threadId,
    relatedMessageIds: [...allReferences, messageId],
    confidence: 0.9,
    method: "reference_headers",
  };
}

/**
 * Identify thread based on subject line matching
 */
function identifyThreadBySubject(
  parsedEmail: ParsedMail
): ThreadIdentificationResult {
  const subject = parsedEmail.subject || "";
  const messageId = parsedEmail.messageId || "";

  // Clean the subject by removing Re:, Fwd:, etc.
  const cleanSubject = cleanSubjectLine(subject);

  if (!cleanSubject) {
    return {
      threadId: `msg-${normalizeMessageId(messageId)}`,
      relatedMessageIds: [messageId],
      confidence: 0.3,
      method: "fallback",
    };
  }

  // Use a hash of the cleaned subject as the thread ID
  const threadId = `subj-${hashString(cleanSubject)}`;

  return {
    threadId,
    relatedMessageIds: [messageId],
    confidence: 0.6,
    method: "subject_match",
  };
}

/**
 * Clean subject line by removing prefixes like Re:, Fwd:, etc.
 */
function cleanSubjectLine(subject: string): string {
  if (!subject) return "";

  // Remove common prefixes (case insensitive)
  let cleanSubject = subject.replace(
    /^(re|fwd|fw|aw|antw|vs|sv)(\[\d+\])?:\s*/i,
    ""
  );

  // Remove square brackets often used in mailing lists
  cleanSubject = cleanSubject.replace(/\[[\w\s-]+\]\s*/g, "");

  return cleanSubject.trim();
}

/**
 * Normalize message ID to create a consistent format
 */
function normalizeMessageId(messageId: string): string {
  // Remove angle brackets and clean up the message ID
  const cleaned = messageId.replace(/[<>]/g, "");

  // Create a hash to shorten long message IDs
  if (cleaned.length > 32) {
    return hashString(cleaned);
  }

  return cleaned;
}

/**
 * Create a simple hash of a string
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to positive hex string
  return Math.abs(hash).toString(16);
}
