# Email Thread Identification Strategy

## Overview

Thread identification is a critical component of email processing in a CRM system. Properly identifying and grouping related emails into conversations enhances the user experience by providing context and making it easier to follow communication history with customers.

This document outlines a comprehensive approach to email thread identification, focusing on various techniques to accurately group related emails even when standard threading headers are missing or inconsistent.

## 1. Understanding Email Threading Mechanisms

### Standard Email Threading Headers

Email threading primarily relies on these headers:

1. **Message-ID**: A unique identifier for each email
   ```
   Message-ID: <CAGBx1kBUXU4aMmkVy7UyXSO_cYHRFxpv4-eojnNUBJ9G1WQT1A@mail.gmail.com>
   ```

2. **In-Reply-To**: References the Message-ID of the email being replied to
   ```
   In-Reply-To: <CAGBx1kBUXU4aMmkVy7UyXSO_cYHRFxpv4-eojnNUBJ9G1WQT1A@mail.gmail.com>
   ```

3. **References**: Contains a list of Message-IDs in the conversation chain
   ```
   References: <CAGBx1kBUXU4aMmkVy7UyXSO_cYHRFxpv4-eojnNUBJ9G1WQT1A@mail.gmail.com> <CAGBx1kC3=wK+P6n+jNkUyN_0xF82zcbA9QQs-4p6fwH23U0rZQ@mail.gmail.com>
   ```

### Provider-Specific Threading Mechanisms

Different email providers implement additional threading mechanisms:

1. **Gmail**: Uses `X-GM-THRID` header or embeds thread ID in Message-ID
2. **Microsoft Exchange/Outlook**: Uses `Thread-Index` header
3. **Apple Mail**: Uses `Thread-Topic` combined with References

## 2. Core Thread Identification Algorithm

```typescript
interface ThreadIdentificationResult {
  threadId: string;
  confidence: 'high' | 'medium' | 'low';
  method: 'headers' | 'subject' | 'content' | 'mixed';
  relatedMessageIds: string[];
}

/**
 * Main thread identification function
 */
function identifyEmailThread(parsedEmail: ParsedMail): ThreadIdentificationResult {
  // Try provider-specific thread IDs first (highest confidence)
  const providerThreadId = extractProviderThreadId(parsedEmail);
  if (providerThreadId) {
    return {
      threadId: providerThreadId,
      confidence: 'high',
      method: 'headers',
      relatedMessageIds: [parsedEmail.messageId]
    };
  }
  
  // Try standard threading headers next
  const headerBasedThreadId = extractThreadIdFromHeaders(parsedEmail);
  if (headerBasedThreadId) {
    return {
      threadId: headerBasedThreadId,
      confidence: 'high',
      method: 'headers',
      relatedMessageIds: [
        ...(parsedEmail.references || []),
        parsedEmail.inReplyTo,
        parsedEmail.messageId
      ].filter(Boolean)
    };
  }
  
  // Fall back to subject-based threading
  const subjectBasedThreadId = generateThreadIdFromSubject(parsedEmail);
  if (subjectBasedThreadId) {
    return {
      threadId: subjectBasedThreadId,
      confidence: 'medium',
      method: 'subject',
      relatedMessageIds: [parsedEmail.messageId]
    };
  }
  
  // Last resort: use message ID as thread ID
  return {
    threadId: parsedEmail.messageId,
    confidence: 'low',
    method: 'content',
    relatedMessageIds: [parsedEmail.messageId]
  };
}
```

## 3. Provider-Specific Thread Extraction

```typescript
/**
 * Extract provider-specific thread IDs
 */
function extractProviderThreadId(parsedEmail: ParsedMail): string | null {
  const headers = parsedEmail.headers;
  
  // Gmail thread ID
  if (headers.has('x-gm-thrid')) {
    return `gmail-${headers.get('x-gm-thrid')}`;
  }
  
  // Extract Gmail thread ID from Message-ID
  // Gmail Message-IDs often contain the thread ID
  const messageId = parsedEmail.messageId || '';
  const gmailThreadMatch = messageId.match(/([0-9a-f]{16})/);
  if (messageId.includes('mail.gmail.com') && gmailThreadMatch) {
    return `gmail-${gmailThreadMatch[1]}`;
  }
  
  // Microsoft Exchange/Outlook Thread-Index
  if (headers.has('thread-index')) {
    const threadIndex = headers.get('thread-index');
    // The first 22 characters of a Thread-Index represent the thread
    return `outlook-${threadIndex.substring(0, 22)}`;
  }
  
  // Apple Mail uses Thread-Topic combined with References
  if (headers.has('thread-topic')) {
    const threadTopic = headers.get('thread-topic');
    // Create a hash of the thread topic
    return `apple-${createHash(threadTopic)}`;
  }
  
  return null;
}

/**
 * Create a hash from a string
 */
function createHash(input: string): string {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(input).digest('hex');
}
```

## 4. Standard Header-Based Thread Identification

```typescript
/**
 * Extract thread ID from standard email headers
 */
function extractThreadIdFromHeaders(parsedEmail: ParsedMail): string | null {
  const references = parsedEmail.references || [];
  const inReplyTo = parsedEmail.inReplyTo;
  
  // If we have References, use the first one (original message in thread)
  if (references.length > 0) {
    return `ref-${createHash(references[0])}`;
  }
  
  // If we have In-Reply-To but no References
  if (inReplyTo) {
    return `reply-${createHash(inReplyTo)}`;
  }
  
  return null;
}
```

## 5. Subject-Based Thread Identification

```typescript
/**
 * Generate thread ID from email subject
 */
function generateThreadIdFromSubject(parsedEmail: ParsedMail): string | null {
  const subject = parsedEmail.subject || '';
  if (!subject) return null;
  
  // Normalize the subject by removing prefixes and whitespace
  const normalizedSubject = normalizeSubject(subject);
  if (normalizedSubject.length < 3) return null; // Too short to be meaningful
  
  // Create a composite key with sender and normalized subject
  const fromAddress = parsedEmail.from?.value?.[0]?.address || '';
  const subjectHash = createHash(`${normalizedSubject}|${fromAddress}`);
  
  return `subj-${subjectHash}`;
}

/**
 * Normalize email subject by removing prefixes and cleaning
 */
function normalizeSubject(subject: string): string {
  return subject
    // Remove Re:, Fwd:, etc. (with optional [n])
    .replace(/^(Re|Fwd|Fw|FW|RE|FWD)(\[\d+\])?:\s*/gi, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
}
```

## 6. Content-Based Thread Identification

For cases where headers and subject matching fail, we can use content analysis:

```typescript
/**
 * Identify thread based on email content analysis
 */
function identifyThreadFromContent(
  parsedEmail: ParsedMail,
  existingEmails: ParsedMail[]
): string | null {
  // Extract quoted content
  const { quotedContent } = extractQuotedContent(parsedEmail.text || '');
  if (!quotedContent) return null;
  
  // Look for matching content in existing emails
  for (const existingEmail of existingEmails) {
    const existingText = existingEmail.text || '';
    
    // Check if quoted content appears in existing email
    if (existingText.includes(quotedContent.substring(0, 100))) {
      return existingEmail.threadId;
    }
  }
  
  return null;
}

/**
 * Extract quoted content from email text
 */
function extractQuotedContent(emailText: string): { newContent: string, quotedContent: string } {
  // Common quote markers
  const quotePatterns = [
    /^>+\s.+$/gm,                                  // Basic '>' quotes
    /^On .+ wrote:$/m,                             // "On DATE, NAME wrote:"
    /^-{3,}Original Message-{3,}$/m,               // "---Original Message---"
    /^From:.*Sent:.*To:.*Subject:.*$/m,            // Outlook style headers
  ];
  
  // Find the first occurrence of any quote pattern
  let firstQuoteIndex = -1;
  
  for (const pattern of quotePatterns) {
    const match = pattern.exec(emailText);
    if (match && (firstQuoteIndex === -1 || match.index < firstQuoteIndex)) {
      firstQuoteIndex = match.index;
    }
  }
  
  // If a quote marker was found
  if (firstQuoteIndex !== -1) {
    return {
      newContent: emailText.substring(0, firstQuoteIndex).trim(),
      quotedContent: emailText.substring(firstQuoteIndex).trim()
    };
  }
  
  // No quote markers found
  return {
    newContent: emailText.trim(),
    quotedContent: ''
  };
}
```

## 7. Thread Reconstruction and Ordering

Once emails are grouped into threads, we need to reconstruct the conversation flow:

```typescript
interface EmailMessage {
  id: string;
  messageId: string;
  threadId: string;
  subject: string;
  sentAt: Date;
  fromEmail: string;
  fromName: string;
  toEmail: string[];
  body: string;
  // Other email properties
}

interface EmailThread {
  threadId: string;
  subject: string;
  messages: EmailMessage[];
  participants: string[];
  lastMessageDate: Date;
  messageCount: number;
}

/**
 * Reconstruct email thread from individual messages
 */
function reconstructThread(messages: EmailMessage[]): EmailThread {
  // Sort messages by date
  const sortedMessages = [...messages].sort((a, b) => 
    a.sentAt.getTime() - b.sentAt.getTime()
  );
  
  // Extract thread metadata
  const threadId = sortedMessages[0].threadId;
  const subject = normalizeSubject(sortedMessages[0].subject);
  
  // Collect unique participants
  const participantSet = new Set<string>();
  sortedMessages.forEach(message => {
    participantSet.add(message.fromEmail);
    message.toEmail.forEach(recipient => participantSet.add(recipient));
  });
  
  return {
    threadId,
    subject,
    messages: sortedMessages,
    participants: Array.from(participantSet),
    lastMessageDate: sortedMessages[sortedMessages.length - 1].sentAt,
    messageCount: sortedMessages.length
  };
}
```

## 8. Building a Thread Relationship Graph

For complex conversations, building a relationship graph can help visualize the thread structure:

```typescript
interface ThreadNode {
  messageId: string;
  parentId: string | null;
  children: ThreadNode[];
  message: EmailMessage;
  level: number;
}

/**
 * Build a thread relationship graph
 */
function buildThreadGraph(messages: EmailMessage[]): ThreadNode {
  // Create nodes for each message
  const nodes: Map<string, ThreadNode> = new Map();
  
  // First pass: create all nodes
  messages.forEach(message => {
    nodes.set(message.messageId, {
      messageId: message.messageId,
      parentId: null, // Will be set in second pass
      children: [],
      message,
      level: 0 // Will be calculated in third pass
    });
  });
  
  // Second pass: establish parent-child relationships
  messages.forEach(message => {
    const parsedEmail = message.parsedEmail; // Assuming we have access to parsed headers
    const inReplyTo = parsedEmail?.inReplyTo;
    
    if (inReplyTo && nodes.has(inReplyTo)) {
      // Set parent
      const node = nodes.get(message.messageId);
      node.parentId = inReplyTo;
      
      // Add as child to parent
      const parentNode = nodes.get(inReplyTo);
      parentNode.children.push(node);
    }
  });
  
  // Find the root node (no parent)
  let rootNode: ThreadNode = null;
  for (const node of nodes.values()) {
    if (!node.parentId) {
      rootNode = node;
      break;
    }
  }
  
  // If no clear root, use the oldest message
  if (!rootNode) {
    const oldestMessage = messages.reduce((oldest, current) => 
      oldest.sentAt <= current.sentAt ? oldest : current
    );
    rootNode = nodes.get(oldestMessage.messageId);
  }
  
  // Third pass: calculate levels (depth in thread)
  calculateNodeLevels(rootNode, 0);
  
  return rootNode;
}

/**
 * Recursively calculate node levels in thread graph
 */
function calculateNodeLevels(node: ThreadNode, level: number) {
  node.level = level;
  
  for (const child of node.children) {
    calculateNodeLevels(child, level + 1);
  }
}
```

## 9. Handling Missing or Inconsistent Threading Information

In real-world scenarios, threading information can be missing or inconsistent:

```typescript
/**
 * Resolve inconsistent threading information
 */
function resolveThreadingInconsistencies(
  messages: EmailMessage[],
  existingThreads: Map<string, EmailThread>
): Map<string, EmailThread> {
  // Group messages by normalized subject
  const subjectGroups = new Map<string, EmailMessage[]>();
  
  messages.forEach(message => {
    const normalizedSubject = normalizeSubject(message.subject);
    if (!subjectGroups.has(normalizedSubject)) {
      subjectGroups.set(normalizedSubject, []);
    }
    subjectGroups.get(normalizedSubject).push(message);
  });
  
  // For each subject group, check if messages should be in the same thread
  for (const [subject, subjectMessages] of subjectGroups.entries()) {
    if (subjectMessages.length <= 1) continue;
    
    // Check if messages have different thread IDs
    const threadIds = new Set(subjectMessages.map(m => m.threadId));
    if (threadIds.size <= 1) continue; // All in same thread already
    
    // Analyze content and timing to determine if they should be merged
    const shouldMerge = analyzeMessagesForMerging(subjectMessages);
    
    if (shouldMerge) {
      // Find the most appropriate thread ID to use
      const targetThreadId = findBestThreadId(subjectMessages, existingThreads);
      
      // Update all messages to use this thread ID
      subjectMessages.forEach(message => {
        message.threadId = targetThreadId;
      });
    }
  }
  
  // Rebuild threads with updated thread IDs
  const updatedThreads = new Map<string, EmailThread>();
  
  // Group messages by thread ID
  const threadGroups = new Map<string, EmailMessage[]>();
  messages.forEach(message => {
    if (!threadGroups.has(message.threadId)) {
      threadGroups.set(message.threadId, []);
    }
    threadGroups.get(message.threadId).push(message);
  });
  
  // Reconstruct each thread
  for (const [threadId, threadMessages] of threadGroups.entries()) {
    updatedThreads.set(threadId, reconstructThread(threadMessages));
  }
  
  return updatedThreads;
}

/**
 * Analyze messages to determine if they should be merged into one thread
 */
function analyzeMessagesForMerging(messages: EmailMessage[]): boolean {
  // Sort by date
  const sortedMessages = [...messages].sort((a, b) => 
    a.sentAt.getTime() - b.sentAt.getTime()
  );
  
  // Check time proximity
  const timeGaps = [];
  for (let i = 1; i < sortedMessages.length; i++) {
    const gap = sortedMessages[i].sentAt.getTime() - sortedMessages[i-1].sentAt.getTime();
    timeGaps.push(gap);
  }
  
  // Calculate average time gap
  const avgGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
  
  // If average gap is less than 24 hours, more likely to be same thread
  const likelyTimewise = avgGap < 24 * 60 * 60 * 1000;
  
  // Check participant overlap
  const participantSets = messages.map(message => {
    const participants = new Set<string>();
    participants.add(message.fromEmail);
    message.toEmail.forEach(recipient => participants.add(recipient));
    return participants;
  });
  
  // Calculate participant overlap ratio
  let totalOverlap = 0;
  for (let i = 0; i < participantSets.length; i++) {
    for (let j = i + 1; j < participantSets.length; j++) {
      const setA = participantSets[i];
      const setB = participantSets[j];
      
      // Count common participants
      let commonCount = 0;
      for (const participant of setA) {
        if (setB.has(participant)) commonCount++;
      }
      
      // Calculate Jaccard similarity
      const unionSize = setA.size + setB.size - commonCount;
      const similarity = commonCount / unionSize;
      
      totalOverlap += similarity;
    }
  }
  
  const pairCount = (participantSets.length * (participantSets.length - 1)) / 2;
  const avgOverlap = totalOverlap / pairCount;
  
  // If average overlap is high, more likely to be same thread
  const likelyParticipantwise = avgOverlap > 0.5;
  
  // Combined decision
  return likelyTimewise && likelyParticipantwise;
}

/**
 * Find the best thread ID to use when merging messages
 */
function findBestThreadId(
  messages: EmailMessage[],
  existingThreads: Map<string, EmailThread>
): string {
  // Collect all thread IDs from these messages
  const threadIds = messages.map(m => m.threadId);
  
  // Prioritize thread IDs that already exist in the system
  for (const threadId of threadIds) {
    if (existingThreads.has(threadId)) {
      return threadId;
    }
  }
  
  // If none exist, use the thread ID from the oldest message
  const oldestMessage = messages.reduce((oldest, current) => 
    oldest.sentAt <= current.sentAt ? oldest : current
  );
  
  return oldestMessage.threadId;
}
```

## 10. Database Integration

Integrating thread identification with the EmailSync model:

```typescript
/**
 * Store thread information in database
 */
async function storeThreadInformation(
  emailId: string,
  threadIdentification: ThreadIdentificationResult
): Promise<void> {
  try {
    // Update the email with thread information
    await prisma.emailSync.update({
      where: { id: emailId },
      data: {
        threadId: threadIdentification.threadId,
        // Store additional metadata if needed
        metadata: {
          threadConfidence: threadIdentification.confidence,
          threadMethod: threadIdentification.method,
          relatedMessageIds: threadIdentification.relatedMessageIds
        }
      }
    });
    
    // Optionally, create or update a separate Thread model if you have one
    if (threadIdentification.confidence !== 'low') {
      await prisma.emailThread.upsert({
        where: { threadId: threadIdentification.threadId },
        update: {
          lastUpdated: new Date(),
          // Increment message count
          messageCount: { increment: 1 }
        },
        create: {
          threadId: threadIdentification.threadId,
          subject: await getThreadSubject(threadIdentification.threadId, emailId),
          createdAt: new Date(),
          lastUpdated: new Date(),
          messageCount: 1
        }
      });
    }
  } catch (error) {
    console.error('Failed to store thread information:', error);
    throw new Error(`Failed to store thread: ${error.message}`);
  }
}

/**
 * Get thread subject from the first email or current email
 */
async function getThreadSubject(threadId: string, currentEmailId: string): Promise<string> {
  // Try to find the first email in the thread
  const firstEmail = await prisma.emailSync.findFirst({
    where: {
      threadId,
      NOT: { id: currentEmailId } // Exclude current email
    },
    orderBy: { sentAt: 'asc' }
  });
  
  if (firstEmail) {
    return normalizeSubject(firstEmail.subject);
  }
  
  // If no other emails in thread, use current email's subject
  const currentEmail = await prisma.emailSync.findUnique({
    where: { id: currentEmailId },
    select: { subject: true }
  });
  
  return normalizeSubject(currentEmail.subject);
}
```

## 11. Thread Visualization in Timeline

Visualizing threads in the timeline requires special consideration:

```typescript
/**
 * Prepare thread data for timeline visualization
 */
async function prepareThreadsForTimeline(
  userId: string,
  businessId?: string,
  options: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    groupThreads?: boolean;
  } = {}
): Promise<any> {
  const {
    limit = 50,
    offset = 0,
    startDate,
    endDate,
    groupThreads = true
  } = options;
  
  // Base query conditions
  const whereConditions: any = {
    userId,
    isDeleted: false
  };
  
  // Add business filter if provided
  if (businessId) {
    whereConditions.businessId = businessId;
  }
  
  // Add date range if provided
  if (startDate || endDate) {
    whereConditions.sentAt = {};
    if (startDate) whereConditions.sentAt.gte = startDate;
    if (endDate) whereConditions.sentAt.lte = endDate;
  }
  
  if (groupThreads) {
    // Group by threads - get the latest email from each thread
    const threadIds = await prisma.emailSync.groupBy({
      by: ['threadId'],
      where: whereConditions,
      orderBy: {
        sentAt: 'desc'
      },
      skip: offset,
      take: limit
    });
    
    // Get the latest email from each thread
    const latestThreadEmails = await Promise.all(
      threadIds.map(({ threadId }) => 
        prisma.emailSync.findFirst({
          where: { threadId },
          orderBy: { sentAt: 'desc' },
          include: {
            user: {
              select: { name: true, email: true }
            },
            business: {
              select: { id: true, name: true }
            }
          }
        })
      )
    );
    
    // Get thread message counts
    const threadCounts = await Promise.all(
      threadIds.map(({ threadId }) => 
        prisma.emailSync.count({
          where: { threadId, isDeleted: false }
        })
      )
    );
    
    // Combine data
    const threadData = latestThreadEmails.map((email, index) => ({
      ...email,
      messageCount: threadCounts[index],
      isThread: threadCounts[index] > 1
    }));
    
    // Sort by latest email date
    threadData.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
    
    return threadData;
  } else {
    // No grouping - return individual emails
    const emails = await prisma.emailSync.findMany({
      where: whereConditions,
      orderBy: { sentAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        user: {
          select: { name: true, email: true }
        },
        business: {
          select: { id: true, name: true }
        }
      }
    });
    
    return emails;
  }
}
```

## 12. Thread Expansion

When a user wants to view a complete thread:

```typescript
/**
 * Expand a thread to show all messages
 */
async function expandThread(threadId: string): Promise<EmailMessage[]> {
  // Get all emails in the thread
  const emails = await prisma.emailSync.findMany({
    where: {
      threadId,
      isDeleted: false
    },
    orderBy: { sentAt: 'asc' }, // Chronological order
    include: {
      user: {
        select: { name: true, email: true }
      },
      business: {
        select: { id: true, name: true }
      }
    }
  });
  
  // Build thread graph for visualization
  const threadGraph = buildThreadGraphFromEmails(emails);
  
  return {
    emails,
    threadStructure: threadGraph
  };
}

/**
 * Build thread graph from database emails
 */
function buildThreadGraphFromEmails(emails: any[]): any {
  // Create a map of message ID to email
  const emailMap = new Map();
  emails.forEach(email => {
    emailMap.set(email.externalId, email);
  });
  
  // Create nodes
  const nodes = emails.map(email => ({
    id: email.id,
    messageId: email.externalId,
    parentId: null, // Will be set below
    children: [],
    email,
    level: 0 // Will be calculated later
  }));
  
  // Create a map of message ID to node
  const nodeMap = new Map();
  nodes.forEach(node => {
    nodeMap.set(node.messageId, node);
  });
  
  // Establish parent-child relationships
  emails.forEach(email => {
    // This would require storing the In-Reply-To header in the database
    // For this example, we'll assume it's stored in a metadata field
    const inReplyTo = email.metadata?.inReplyTo;
    
    if (inReplyTo && nodeMap.has(inReplyTo)) {
      const node = nodeMap.get(email.externalId);
      const parentNode = nodeMap.get(inReplyTo);
      
      node.parentId = parentNode.id;
      parentNode.children.push(node);
    }
  });
  
  // Find root nodes (no parent)
  const rootNodes = nodes.filter(node => !node.parentId);
  
  // If multiple roots, sort by date and use earliest
  let rootNode;
  if (rootNodes.length > 0) {
    rootNodes.sort((a, b) => 
      a.email.sentAt.getTime() - b.email.sentAt.getTime()
    );
    rootNode = rootNodes[0];
  } else if (nodes.length > 0) {
    // If no clear root, use the oldest message
    nodes.sort((a, b) => 
      a.email.sentAt.getTime() - b.email.sentAt.getTime()
    );
    rootNode = nodes[0];
  } else {
    return null; // No emails in thread
  }
  
  // Calculate levels
  calculateNodeLevels(rootNode, 0);
  
  return rootNode;
}
```

## 13. Testing Thread Identification

Testing thread identification with various email patterns:

```typescript
/**
 * Test suite for thread identification
 */
describe('Thread Identification', () => {
  test('should identify thread from Gmail headers', async () => {
    const rawEmail = fs.readFileSync('./test/fixtures/gmail_thread.eml', 'utf8');
    const parsedEmail = await parseEmailContent(rawEmail);
    const result = identifyEmailThread(parsedEmail);
    
    expect(result.confidence).toBe('high');
    expect(result.method).toBe('headers');
    expect(result.threadId).toContain('gmail-');
  });
  
  test('should identify thread from standard headers', async () => {
    const rawEmail = fs.readFileSync('./test/fixtures/standard_reply.eml', 'utf8');
    const parsedEmail = await parseEmailContent(rawEmail);
    const result = identifyEmailThread(parsedEmail);
    
    expect(result.confidence).toBe('high');
    expect(result.method).toBe('headers');
    expect(result.relatedMessageIds.length).toBeGreaterThan(1);
  });
  
  test('should identify thread from subject when headers missing', async () => {
    const rawEmail = fs.readFileSync('./test/fixtures/no_threading_headers.eml', 'utf8');
    const parsedEmail = await parseEmailContent(rawEmail);
    const result = identifyEmailThread(parsedEmail);
    
    expect(result.confidence).toBe('medium');
    expect(result.method).toBe('subject');
  });
  
  test('should correctly normalize subjects with various prefixes', () => {
    const subjects = [
      'Original Subject',
      'Re: Original Subject',
      'RE: Original Subject',
      'Fwd: Original Subject',
      'FW: Original Subject',
      'Re[2]: Original Subject',
      'RE[23]: Original Subject',
      'Fwd: Fwd: Re: Original Subject'
    ];
    
    const normalized = subjects.map(normalizeSubject);
    
    // All should normalize to the same string
    expect(new Set(normalized).size).toBe(1);
    expect(normalized[0]).toBe('Original Subject');
  });
  
  test('should reconstruct thread in correct order', () => {
    const messages = [
      {
        id: '3',
        messageId: 'msg3',
        threadId: 'thread1',
        subject: 'Re: Test Thread',
        sentAt: new Date('2023-03-03'),
        fromEmail: 'alice@example.com',
        toEmail: ['bob@example.com'],
        body: 'Third message'
      },
      {
        id: '1',
        messageId: 'msg1',
        threadId: 'thread1',
        subject: 'Test Thread',
        sentAt: new Date('2023-03-01'),
        fromEmail: 'bob@example.com',
        toEmail: ['alice@example.com'],
        body: 'First message'
      },
      {
        id: '2',
        messageId: 'msg2',
        threadId: 'thread1',
        subject: 'Re: Test Thread',
        sentAt: new Date('2023-03-02'),
        fromEmail: 'alice@example.com',
        toEmail: ['bob@example.com'],
        body: 'Second message'
      }
    ];
    
    const thread = reconstructThread(messages);
    
    expect(thread.messages.length).toBe(3);
    expect(thread.messages[0].id).toBe('1'); // First chronologically
    expect(thread.messages[2].id).toBe('3'); // Last chronologically
    expect(thread.participants).toContain('alice@example.com');
    expect(thread.participants).toContain('bob@example.com');
    expect(thread.lastMessageDate).toEqual(new Date('2023-03-03'));
  });
});
```

## Conclusion

This comprehensive thread identification strategy addresses the complexities of organizing emails into conversations in a CRM system. By implementing multiple identification methods with fallbacks, the system can accurately group related emails even when standard threading information is missing or inconsistent.

The strategy includes:

1. Provider-specific thread identification for major email services
2. Standard header-based thread identification
3. Subject-based thread identification as a fallback
4. Content-based analysis for difficult cases
5. Thread reconstruction and visualization
6. Handling of inconsistencies and edge cases

This approach ensures that the email timeline feature provides a coherent view of customer communications, enhancing the user experience and making it easier to follow conversation history.
