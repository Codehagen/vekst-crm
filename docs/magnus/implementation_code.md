# Email Parsing Implementation Code

## Overview

This document provides the implementation code that integrates all components of the email parsing solution for the CRM system. The code brings together MIME parsing, thread identification, and content extraction into a cohesive system that can process emails from various providers and prepare them for storage in the EmailSync model.

## 1. Main Email Processing Pipeline

```typescript
// src/services/email/emailProcessor.ts

import { ParsedMail } from 'mailparser';
import { PrismaClient } from '@prisma/client';
import { parseMimeStructure } from './mimeParser';
import { identifyEmailThread } from './threadIdentifier';
import { extractMeaningfulContent } from './contentExtractor';
import { processAttachments } from './attachmentProcessor';
import { associateEmailWithBusiness } from './businessAssociator';

const prisma = new PrismaClient();

/**
 * Main email processing pipeline
 */
export async function processEmail(
  rawEmail: string,
  userId: string,
  providerId: string
): Promise<string> {
  try {
    // Step 1: Parse MIME structure
    const parsedEmail = await parseMimeStructure(rawEmail);
    
    // Step 2: Identify thread
    const threadInfo = identifyEmailThread(parsedEmail);
    
    // Step 3: Extract meaningful content
    const extractedContent = extractMeaningfulContent(parsedEmail, {
      includeQuotedContent: false,
      includeSignature: false,
      includeDisclaimer: false
    });
    
    // Step 4: Process attachments
    const attachmentMetadata = await processAttachments(
      parsedEmail.attachments,
      parsedEmail.messageId,
      'cloud'
    );
    
    // Step 5: Create EmailSync record
    const emailSync = await createEmailSyncRecord(
      parsedEmail,
      extractedContent,
      threadInfo,
      attachmentMetadata,
      userId,
      providerId
    );
    
    // Step 6: Associate with business
    await associateEmailWithBusiness(emailSync.id);
    
    return emailSync.id;
  } catch (error) {
    console.error('Email processing failed:', error);
    throw new Error(`Failed to process email: ${error.message}`);
  }
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
): Promise<any> {
  // Extract basic email data
  const messageId = parsedEmail.messageId || '';
  const subject = parsedEmail.subject || '';
  const sentDate = parsedEmail.date || new Date();
  const fromEmail = parsedEmail.from?.value?.[0]?.address || '';
  const fromName = parsedEmail.from?.value?.[0]?.name || '';
  
  // Extract recipients
  const toEmails = (parsedEmail.to?.value || []).map(addr => addr.address);
  const ccEmails = (parsedEmail.cc?.value || []).map(addr => addr.address);
  const bccEmails = (parsedEmail.bcc?.value || []).map(addr => addr.address);
  
  // Compile metadata
  const metadata = {
    headers: Object.fromEntries(parsedEmail.headers.entries()),
    threadInfo: {
      confidence: threadInfo.confidence,
      method: threadInfo.method,
      relatedMessageIds: threadInfo.relatedMessageIds
    },
    contentInfo: {
      replyStyle: extractedContent.replyStyle,
      hasQuotedContent: !!extractedContent.quotedContent,
      hasSignature: !!extractedContent.signature,
      hasDisclaimer: !!extractedContent.disclaimer
    }
  };
  
  // Create EmailSync record
  const emailSync = await prisma.emailSync.create({
    data: {
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
      attachments: attachmentMetadata,
      isRead: false,
      isStarred: false,
      isDeleted: false,
      threadId: threadInfo.threadId,
      importance: parsedEmail.headers.get('importance') || 'normal',
      metadata,
      userId,
      providerId
    }
  });
  
  return emailSync;
}
```

## 2. Email Sync Service

```typescript
// src/services/email/emailSyncService.ts

import { PrismaClient } from '@prisma/client';
import { processEmail } from './emailProcessor';
import { fetchEmailsFromGmail } from './providers/gmailProvider';
import { fetchEmailsFromOutlook } from './providers/outlookProvider';

const prisma = new PrismaClient();

/**
 * Sync emails for a specific user and provider
 */
export async function syncUserEmails(
  userId: string,
  providerId: string,
  options: {
    maxEmails?: number;
    syncFrom?: Date;
    labelFilter?: string[];
  } = {}
): Promise<{
  success: boolean;
  totalProcessed: number;
  newEmails: number;
  updatedEmails: number;
  errors: number;
  errorDetails: any[];
}> {
  try {
    // Get provider details
    const provider = await prisma.emailProvider.findUnique({
      where: { id: providerId }
    });
    
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }
    
    // Fetch raw emails from provider
    let rawEmails: any[] = [];
    
    if (provider.provider === 'google') {
      rawEmails = await fetchEmailsFromGmail(provider, options);
    } else if (provider.provider === 'microsoft') {
      rawEmails = await fetchEmailsFromOutlook(provider, options);
    } else {
      throw new Error(`Unsupported provider: ${provider.provider}`);
    }
    
    // Process each email
    const results = {
      totalProcessed: rawEmails.length,
      newEmails: 0,
      updatedEmails: 0,
      errors: 0,
      errorDetails: []
    };
    
    for (const rawEmail of rawEmails) {
      try {
        // Check if email already exists
        const existingEmail = await prisma.emailSync.findUnique({
          where: {
            userId_externalId: {
              userId,
              externalId: rawEmail.id
            }
          }
        });
        
        if (existingEmail) {
          // Update existing email if needed
          // This would typically check for changes in read status, labels, etc.
          await updateExistingEmail(existingEmail.id, rawEmail);
          results.updatedEmails++;
        } else {
          // Process new email
          await processEmail(rawEmail.raw, userId, providerId);
          results.newEmails++;
        }
      } catch (error) {
        console.error(`Error processing email ${rawEmail.id}:`, error);
        results.errors++;
        results.errorDetails.push({
          emailId: rawEmail.id,
          error: error.message
        });
      }
    }
    
    return {
      success: true,
      ...results
    };
  } catch (error) {
    console.error(`Email sync failed for user ${userId}, provider ${providerId}:`, error);
    return {
      success: false,
      totalProcessed: 0,
      newEmails: 0,
      updatedEmails: 0,
      errors: 1,
      errorDetails: [{ error: error.message }]
    };
  }
}

/**
 * Update existing email with new information
 */
async function updateExistingEmail(emailId: string, rawEmail: any): Promise<void> {
  // Update read status, labels, etc.
  await prisma.emailSync.update({
    where: { id: emailId },
    data: {
      isRead: rawEmail.isRead,
      folderPath: rawEmail.labelIds?.join(',') || null,
      // Other fields that might change
    }
  });
}

/**
 * Schedule email sync for all users
 */
export async function scheduleAllUserEmailSync(
  options: {
    maxEmailsPerUser?: number;
    syncFromHoursAgo?: number;
  } = {}
): Promise<void> {
  // Get all email providers
  const providers = await prisma.emailProvider.findMany();
  
  // Calculate sync from date if specified
  const syncFrom = options.syncFromHoursAgo 
    ? new Date(Date.now() - options.syncFromHoursAgo * 60 * 60 * 1000)
    : undefined;
  
  // Process each provider
  for (const provider of providers) {
    try {
      await syncUserEmails(provider.userId, provider.id, {
        maxEmails: options.maxEmailsPerUser,
        syncFrom
      });
    } catch (error) {
      console.error(`Failed to sync emails for provider ${provider.id}:`, error);
      // Continue with next provider
    }
  }
}
```

## 3. Gmail Provider Integration

```typescript
// src/services/email/providers/gmailProvider.ts

import { google } from 'googleapis';

/**
 * Fetch emails from Gmail
 */
export async function fetchEmailsFromGmail(
  provider: any,
  options: {
    maxEmails?: number;
    syncFrom?: Date;
    labelFilter?: string[];
  } = {}
): Promise<any[]> {
  // Set up OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  oauth2Client.setCredentials({
    access_token: provider.accessToken,
    refresh_token: provider.refreshToken,
    expiry_date: provider.expiresAt?.getTime()
  });
  
  // Create Gmail client
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  // Build query
  let query = '';
  
  if (options.syncFrom) {
    const afterDate = options.syncFrom.toISOString().split('T')[0]; // YYYY-MM-DD
    query += `after:${afterDate} `;
  }
  
  if (options.labelFilter && options.labelFilter.length > 0) {
    query += options.labelFilter.map(label => `label:${label}`).join(' ');
  }
  
  // Get list of emails
  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: options.maxEmails || 100,
    q: query || undefined
  });
  
  const messageIds = response.data.messages || [];
  const emails = [];
  
  // Fetch full content for each email
  for (const message of messageIds) {
    try {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'raw'
      });
      
      // Decode the raw message
      const rawEmail = Buffer.from(fullMessage.data.raw, 'base64').toString('utf-8');
      
      emails.push({
        id: message.id,
        threadId: fullMessage.data.threadId,
        labelIds: fullMessage.data.labelIds,
        isRead: !fullMessage.data.labelIds?.includes('UNREAD'),
        raw: rawEmail
      });
    } catch (error) {
      console.error(`Failed to fetch Gmail message ${message.id}:`, error);
      // Continue with next message
    }
  }
  
  // Check if tokens were refreshed
  const tokens = oauth2Client.credentials;
  if (tokens.access_token !== provider.accessToken) {
    // Update tokens in database
    await updateProviderTokens(provider.id, tokens);
  }
  
  return emails;
}

/**
 * Update provider tokens in database
 */
async function updateProviderTokens(providerId: string, tokens: any): Promise<void> {
  const prisma = new PrismaClient();
  
  await prisma.emailProvider.update({
    where: { id: providerId },
    data: {
      accessToken: tokens.access_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null
    }
  });
}
```

## 4. Microsoft Outlook Provider Integration

```typescript
// src/services/email/providers/outlookProvider.ts

import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/tokenCredentialAuthProvider';
import { ClientSecretCredential } from '@azure/identity';

/**
 * Fetch emails from Microsoft Outlook
 */
export async function fetchEmailsFromOutlook(
  provider: any,
  options: {
    maxEmails?: number;
    syncFrom?: Date;
    labelFilter?: string[];
  } = {}
): Promise<any[]> {
  // Set up authentication
  const credential = new ClientSecretCredential(
    process.env.AZURE_TENANT_ID,
    process.env.AZURE_CLIENT_ID,
    process.env.AZURE_CLIENT_SECRET
  );
  
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default']
  });
  
  // Create Microsoft Graph client
  const client = Client.initWithMiddleware({
    authProvider
  });
  
  // Build query
  let filter = '';
  
  if (options.syncFrom) {
    const afterDate = options.syncFrom.toISOString();
    filter = `receivedDateTime ge ${afterDate}`;
  }
  
  // Get list of emails
  let query = client.api('/me/messages')
    .top(options.maxEmails || 100)
    .select('id,conversationId,subject,bodyPreview,receivedDateTime,from,toRecipients,ccRecipients,isRead');
  
  if (filter) {
    query = query.filter(filter);
  }
  
  const response = await query.get();
  const messages = response.value || [];
  const emails = [];
  
  // Fetch full content for each email
  for (const message of messages) {
    try {
      // Get MIME content
      const mimeResponse = await client.api(`/me/messages/${message.id}/$value`)
        .header('Prefer', 'outlook.body-content-type="text"')
        .get();
      
      emails.push({
        id: message.id,
        threadId: message.conversationId,
        isRead: message.isRead,
        raw: mimeResponse
      });
    } catch (error) {
      console.error(`Failed to fetch Outlook message ${message.id}:`, error);
      // Continue with next message
    }
  }
  
  return emails;
}
```

## 5. Business Association Service

```typescript
// src/services/email/businessAssociator.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Associate email with business based on email addresses
 */
export async function associateEmailWithBusiness(emailId: string): Promise<string | null> {
  const email = await prisma.emailSync.findUnique({
    where: { id: emailId }
  });
  
  if (!email) {
    throw new Error(`Email not found: ${emailId}`);
  }
  
  // Collect all email addresses from the email
  const emailAddresses = [
    email.fromEmail,
    ...email.toEmail,
    ...email.ccEmail
  ].filter(Boolean);
  
  // Extract domains from email addresses
  const domains = emailAddresses.map(address => {
    const parts = address.split('@');
    return parts.length === 2 ? parts[1].toLowerCase() : null;
  }).filter(Boolean);
  
  // Try to match by exact email address first
  const contactMatch = await prisma.contact.findFirst({
    where: {
      email: { in: emailAddresses }
    }
  });
  
  if (contactMatch) {
    // Update email with business and contact info
    await prisma.emailSync.update({
      where: { id: emailId },
      data: {
        businessId: contactMatch.businessId,
        contactId: contactMatch.id
      }
    });
    
    return contactMatch.businessId;
  }
  
  // Try to match by domain
  const businessMatches = await prisma.business.findMany({
    where: {
      OR: [
        { email: { in: emailAddresses } },
        ...domains.map(domain => ({
          OR: [
            { email: { contains: domain } },
            { website: { contains: domain } }
          ]
        }))
      ]
    }
  });
  
  if (businessMatches.length === 1) {
    // Single business match
    await prisma.emailSync.update({
      where: { id: emailId },
      data: {
        businessId: businessMatches[0].id
      }
    });
    
    return businessMatches[0].id;
  } else if (businessMatches.length > 1) {
    // Multiple matches - use heuristics to determine best match
    const bestMatch = findBestBusinessMatch(businessMatches, email);
    
    if (bestMatch) {
      await prisma.emailSync.update({
        where: { id: emailId },
        data: {
          businessId: bestMatch.id
        }
      });
      
      return bestMatch.id;
    }
  }
  
  // No match found - will require manual association
  return null;
}

/**
 * Find best business match using heuristics
 */
function findBestBusinessMatch(businesses: any[], email: any): any | null {
  // Implement heuristics to find best match
  // For example:
  // 1. Prefer businesses with recent activity
  // 2. Prefer businesses with matching industry keywords in email
  // 3. Prefer businesses with higher interaction count
  
  // This is a simplified example - real implementation would be more sophisticated
  return businesses[0]; // Default to first match
}

/**
 * Manually associate email with business
 */
export async function manuallyAssociateEmail(
  emailId: string,
  businessId: string,
  contactId?: string
): Promise<void> {
  await prisma.emailSync.update({
    where: { id: emailId },
    data: {
      businessId,
      contactId: contactId || null
    }
  });
}
```

## 6. Email Timeline Service

```typescript
// src/services/email/timelineService.ts

import { PrismaClient } from '@prisma/client';
import { processEmailThread } from './contentExtractor';

const prisma = new PrismaClient();

/**
 * Get email timeline for a business
 */
export async function getBusinessEmailTimeline(
  businessId: string,
  options: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    groupThreads?: boolean;
  } = {}
): Promise<any> {
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate,
    groupThreads = true
  } = options;
  
  const skip = (page - 1) * limit;
  
  // Base query conditions
  const whereConditions: any = {
    businessId,
    isDeleted: false
  };
  
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
      skip,
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
            },
            contact: {
              select: { id: true, name: true, email: true }
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
    
    // Get total count for pagination
    const total = await prisma.emailSync.groupBy({
      by: ['threadId'],
      where: whereConditions,
      _count: true
    });
    
    return {
      data: threadData,
      pagination: {
        page,
        limit,
        total: total.length,
        pages: Math.ceil(total.length / limit)
      }
    };
  } else {
    // No grouping - return individual emails
    const emails = await prisma.emailSync.findMany({
      where: whereConditions,
      orderBy: { sentAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: { name: true, email: true }
        },
        business: {
          select: { id: true, name: true }
        },
        contact: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    // Get total count for pagination
    const total = await prisma.emailSync.count({
      where: whereConditions
    });
    
    return {
      data: emails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

/**
 * Get complete email thread
 */
export async function getEmailThread(
  threadId: string,
  options: {
    includeQuotedContent?: boolean;
    collapseQuotes?: boolean;
    highlightNewContent?: boolean;
  } = {}
): Promise<any> {
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
      },
      contact: {
        select: { id: true, name: true, email: true }
      }
    }
  });
  
  // Process thread for display
  const processedThread = processEmailThread(emails, options);
  
  return {
    threadId,
    emails,
    messageCount: emails.length,
    threadContent: processedThread.threadContent,
    threadHtmlContent: processedThread.threadHtmlContent
  };
}

/**
 * Delete email from timeline (soft delete)
 */
export async function deleteEmailFromTimeline(emailId: string): Promise<void> {
  await prisma.emailSync.update({
    where: { id: emailId },
    data: { isDeleted: true }
  });
}

/**
 * Restore deleted email
 */
export async function restoreEmail(emailId: string): Promise<void> {
  await prisma.emailSync.update({
    where: { id: emailId },
    data: { isDeleted: false }
  });
}

/**
 * Update email status (read, starred)
 */
export async function updateEmailStatus(
  emailId: string,
  status: {
    isRead?: boolean;
    isStarred?: boolean;
  }
): Promise<void> {
  await prisma.emailSync.update({
    where: { id: emailId },
    data: status
  });
}
```

## 7. API Routes

```typescript
// src/api/routes/emailRoutes.ts

import express from 'express';
import { syncUserEmails } from '../../services/email/emailSyncService';
import { 
  getBusinessEmailTimeline, 
  getEmailThread,
  deleteEmailFromTimeline,
  restoreEmail,
  updateEmailStatus
} from '../../services/email/timelineService';
import { manuallyAssociateEmail } from '../../services/email/businessAssociator';

const router = express.Router();

// Sync emails for a user
router.post('/sync', async (req, res) => {
  try {
    const { userId, providerId, options } = req.body;
    
    if (!userId || !providerId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const result = await syncUserEmails(userId, providerId, options);
    res.json(result);
  } catch (error) {
    console.error('Email sync API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get business email timeline
router.get('/business/:businessId/timeline', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { page, limit, startDate, endDate, groupThreads } = req.query;
    
    const options = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupThreads: groupThreads === 'true'
    };
    
    const timeline = await getBusinessEmailTimeline(businessId, options);
    res.json(timeline);
  } catch (error) {
    console.error('Timeline API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get email thread
router.get('/thread/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { includeQuotedContent, collapseQuotes, highlightNewContent } = req.query;
    
    const options = {
      includeQuotedContent: includeQuotedContent === 'true',
      collapseQuotes: collapseQuotes !== 'false',
      highlightNewContent: highlightNewContent !== 'false'
    };
    
    const thread = await getEmailThread(threadId, options);
    res.json(thread);
  } catch (error) {
    console.error('Thread API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete email from timeline
router.delete('/email/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    await deleteEmailFromTimeline(emailId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete email API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Restore deleted email
router.post('/email/:emailId/restore', async (req, res) => {
  try {
    const { emailId } = req.params;
    await restoreEmail(emailId);
    res.json({ success: true });
  } catch (error) {
    console.error('Restore email API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update email status
router.patch('/email/:emailId/status', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { isRead, isStarred } = req.body;
    
    await updateEmailStatus(emailId, { isRead, isStarred });
    res.json({ success: true });
  } catch (error) {
    console.error('Update email status API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Associate email with business
router.post('/email/:emailId/associate', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { businessId, contactId } = req.body;
    
    if (!businessId) {
      return res.status(400).json({ error: 'Missing businessId parameter' });
    }
    
    await manuallyAssociateEmail(emailId, businessId, contactId);
    res.json({ success: true });
  } catch (error) {
    console.error('Associate email API error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

## 8. Background Jobs

```typescript
// src/jobs/emailSyncJob.ts

import { scheduleAllUserEmailSync } from '../services/email/emailSyncService';

/**
 * Schedule recurring email sync job
 */
export function scheduleEmailSyncJob(cron: any): void {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('Running scheduled email sync job');
    
    try {
      await scheduleAllUserEmailSync({
        maxEmailsPerUser: 100,
        syncFromHoursAgo: 24 // Sync last 24 hours of emails
      });
      
      console.log('Email sync job completed successfully');
    } catch (error) {
      console.error('Email sync job failed:', error);
    }
  });
  
  // Run a more comprehensive sync once per day (during off-hours)
  cron.schedule('0 3 * * *', async () => {
    console.log('Running daily comprehensive email sync job');
    
    try {
      await scheduleAllUserEmailSync({
        maxEmailsPerUser: 500,
        syncFromHoursAgo: 168 // Sync last 7 days of emails
      });
      
      console.log('Comprehensive email sync job completed successfully');
    } catch (error) {
      console.error('Comprehensive email sync job failed:', error);
    }
  });
}

/**
 * Schedule token refresh job
 */
export function scheduleTokenRefreshJob(cron: any): void {
  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('Running token refresh job');
    
    try {
      await refreshAllProviderTokens();
      console.log('Token refresh job completed successfully');
    } catch (error) {
      console.error('Token refresh job failed:', error);
    }
  });
}

/**
 * Refresh all provider tokens
 */
async function refreshAllProviderTokens(): Promise<void> {
  const prisma = new PrismaClient();
  
  // Get providers with tokens expiring soon
  const providers = await prisma.emailProvider.findMany({
    where: {
      expiresAt: {
        lt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in less than 24 hours
      }
    }
  });
  
  for (const provider of providers) {
    try {
      if (provider.provider === 'google') {
        await refreshGoogleToken(provider);
      } else if (provider.provider === 'microsoft') {
        await refreshMicrosoftToken(provider);
      }
    } catch (error) {
      console.error(`Failed to refresh token for provider ${provider.id}:`, error);
    }
  }
}

/**
 * Refresh Google OAuth token
 */
async function refreshGoogleToken(provider: any): Promise<void> {
  const { google } = require('googleapis');
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  oauth2Client.setCredentials({
    refresh_token: provider.refreshToken
  });
  
  const { tokens } = await oauth2Client.refreshAccessToken();
  
  const prisma = new PrismaClient();
  await prisma.emailProvider.update({
    where: { id: provider.id },
    data: {
      accessToken: tokens.access_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
    }
  });
}

/**
 * Refresh Microsoft OAuth token
 */
async function refreshMicrosoftToken(provider: any): Promise<void> {
  const axios = require('axios');
  
  const params = new URLSearchParams();
  params.append('client_id', process.env.AZURE_CLIENT_ID);
  params.append('client_secret', process.env.AZURE_CLIENT_SECRET);
  params.append('refresh_token', provider.refreshToken);
  params.append('grant_type', 'refresh_token');
  
  const response = await axios.post(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    params.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  
  const prisma = new PrismaClient();
  await prisma.emailProvider.update({
    where: { id: provider.id },
    data: {
      accessToken: response.data.access_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000)
    }
  });
}
```

## 9. Frontend Components

### Email Timeline Component

```tsx
// src/components/EmailTimeline.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

interface EmailTimelineProps {
  businessId: string;
}

const EmailTimeline: React.FC<EmailTimelineProps> = ({ businessId }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [expandedThreadId, setExpandedThreadId] = useState(null);
  const [threadDetails, setThreadDetails] = useState(null);
  
  useEffect(() => {
    fetchEmails();
  }, [businessId, page]);
  
  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/email/business/${businessId}/timeline?page=${page}&groupThreads=true`
      );
      setEmails(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleExpandThread = async (threadId) => {
    if (expandedThreadId === threadId) {
      // Collapse if already expanded
      setExpandedThreadId(null);
      setThreadDetails(null);
      return;
    }
    
    try {
      const response = await axios.get(`/api/email/thread/${threadId}`);
      setExpandedThreadId(threadId);
      setThreadDetails(response.data);
    } catch (error) {
      console.error('Error fetching thread details:', error);
    }
  };
  
  const handleDeleteEmail = async (emailId, event) => {
    event.stopPropagation(); // Prevent expanding thread
    
    if (!confirm('Are you sure you want to delete this email from the timeline?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/email/email/${emailId}`);
      // Refresh emails
      fetchEmails();
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  };
  
  const handleUpdateStatus = async (emailId, status, event) => {
    event.stopPropagation(); // Prevent expanding thread
    
    try {
      await axios.patch(`/api/email/email/${emailId}/status`, status);
      // Update local state
      setEmails(emails.map(email => 
        email.id === emailId ? { ...email, ...status } : email
      ));
    } catch (error) {
      console.error('Error updating email status:', error);
    }
  };
  
  const renderEmailItem = (email) => {
    const isExpanded = expandedThreadId === email.threadId;
    
    return (
      <div 
        key={email.id} 
        className={`email-item ${isExpanded ? 'expanded' : ''} ${email.isRead ? 'read' : 'unread'}`}
        onClick={() => handleExpandThread(email.threadId)}
      >
        <div className="email-header">
          <div className="sender-info">
            <span className="sender-name">{email.fromName || email.fromEmail}</span>
            {email.messageCount > 1 && (
              <span className="thread-count">{email.messageCount}</span>
            )}
          </div>
          <div className="email-meta">
            <span className="email-date">{format(new Date(email.sentAt), 'MMM d, yyyy h:mm a')}</span>
            {email.attachments?.length > 0 && <span className="attachment-indicator">📎</span>}
          </div>
        </div>
        
        <div className="email-subject">{email.subject}</div>
        
        {!isExpanded ? (
          <div className="email-preview">{email.body?.substring(0, 150)}...</div>
        ) : (
          <div className="thread-details">
            {threadDetails ? (
              <div 
                className="thread-content"
                dangerouslySetInnerHTML={{ __html: threadDetails.threadHtmlContent || threadDetails.threadContent }}
              />
            ) : (
              <div className="loading">Loading thread...</div>
            )}
          </div>
        )}
        
        <div className="email-actions">
          <button 
            onClick={(e) => handleUpdateStatus(email.id, { isRead: !email.isRead }, e)}
            className={email.isRead ? 'read-button' : 'unread-button'}
          >
            {email.isRead ? 'Mark as Unread' : 'Mark as Read'}
          </button>
          
          <button 
            onClick={(e) => handleUpdateStatus(email.id, { isStarred: !email.isStarred }, e)}
            className={email.isStarred ? 'starred-button' : 'unstarred-button'}
          >
            {email.isStarred ? 'Unstar' : 'Star'}
          </button>
          
          <button 
            onClick={(e) => handleDeleteEmail(email.id, e)}
            className="delete-button"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="email-timeline">
      <h2>Email Timeline</h2>
      
      {loading ? (
        <div className="loading">Loading emails...</div>
      ) : (
        <>
          {emails.length === 0 ? (
            <div className="no-emails">No emails found</div>
          ) : (
            <div className="email-list">
              {emails.map(renderEmailItem)}
            </div>
          )}
          
          {/* Pagination controls */}
          <div className="pagination">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span>Page {page} of {pagination.pages || 1}</span>
            <button 
              disabled={page === pagination.pages || !pagination.pages} 
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EmailTimeline;
```

### Email Provider Connection Component

```tsx
// src/components/EmailProviderConnection.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface EmailProviderConnectionProps {
  userId: string;
  onConnect?: () => void;
}

const EmailProviderConnection: React.FC<EmailProviderConnectionProps> = ({ 
  userId,
  onConnect
}) => {
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  
  useEffect(() => {
    // Check if user already has a connected provider
    const checkProvider = async () => {
      try {
        const response = await axios.get(`/api/email/provider/${userId}`);
        if (response.data) {
          setProvider(response.data);
        }
      } catch (error) {
        console.error('Error checking provider:', error);
      }
    };
    
    checkProvider();
  }, [userId]);
  
  const connectGmail = async () => {
    setLoading(true);
    try {
      // Redirect to Google OAuth flow
      window.location.href = `/api/auth/gmail?userId=${userId}`;
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      setLoading(false);
    }
  };
  
  const connectOutlook = async () => {
    setLoading(true);
    try {
      // Redirect to Microsoft OAuth flow
      window.location.href = `/api/auth/outlook?userId=${userId}`;
    } catch (error) {
      console.error('Error connecting Outlook:', error);
      setLoading(false);
    }
  };
  
  const disconnectProvider = async () => {
    if (!provider) return;
    
    if (!confirm('Are you sure you want to disconnect this email provider?')) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`/api/email/provider/${provider.id}`);
      setProvider(null);
    } catch (error) {
      console.error('Error disconnecting provider:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const syncEmails = async () => {
    if (!provider) return;
    
    setSyncLoading(true);
    setSyncStatus({ status: 'syncing', message: 'Syncing emails...' });
    
    try {
      const response = await axios.post('/api/email/sync', {
        userId,
        providerId: provider.id,
        options: {
          maxEmails: 100
        }
      });
      
      setSyncStatus({
        status: 'success',
        message: `Sync completed: ${response.data.newEmails} new emails, ${response.data.updatedEmails} updated`
      });
      
      if (onConnect) {
        onConnect();
      }
    } catch (error) {
      console.error('Error syncing emails:', error);
      setSyncStatus({
        status: 'error',
        message: `Sync failed: ${error.message}`
      });
    } finally {
      setSyncLoading(false);
    }
  };
  
  return (
    <div className="email-provider-connection">
      <h2>Email Connection</h2>
      
      {provider ? (
        <div className="connected-provider">
          <div>
            <strong>Connected Account:</strong> {provider.email}
          </div>
          <div>
            <strong>Provider:</strong> {provider.provider === 'google' ? 'Gmail' : 'Outlook'}
          </div>
          <div>
            <strong>Connected Since:</strong> {new Date(provider.createdAt).toLocaleDateString()}
          </div>
          
          <div className="provider-actions">
            <button 
              onClick={syncEmails}
              disabled={syncLoading}
              className="sync-button"
            >
              {syncLoading ? 'Syncing...' : 'Sync Emails Now'}
            </button>
            
            <button 
              onClick={disconnectProvider}
              disabled={loading}
              className="disconnect-button"
            >
              Disconnect
            </button>
          </div>
          
          {syncStatus && (
            <div className={`sync-status ${syncStatus.status}`}>
              {syncStatus.message}
            </div>
          )}
        </div>
      ) : (
        <div className="provider-options">
          <p>Connect an email provider to sync emails with your CRM:</p>
          
          <div className="provider-buttons">
            <button 
              onClick={connectGmail}
              disabled={loading}
              className="gmail-button"
            >
              Connect Gmail
            </button>
            
            <button 
              onClick={connectOutlook}
              disabled={loading}
              className="outlook-button"
            >
              Connect Outlook
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailProviderConnection;
```

## 10. Main Application Integration

```typescript
// src/app.ts

import express from 'express';
import cron from 'node-cron';
import emailRoutes from './api/routes/emailRoutes';
import { scheduleEmailSyncJob, scheduleTokenRefreshJob } from './jobs/emailSyncJob';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/email', emailRoutes);

// Schedule background jobs
scheduleEmailSyncJob(cron);
scheduleTokenRefreshJob(cron);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

## Conclusion

This implementation code provides a complete solution for integrating email parsing into the CRM system. The code is organized into modular components that handle different aspects of the email processing pipeline:

1. **Email Processing Pipeline**: Parses raw emails, identifies threads, extracts content, and stores in the database
2. **Email Sync Service**: Fetches emails from providers and manages the sync process
3. **Provider Integrations**: Connects to Gmail and Outlook to retrieve emails
4. **Business Association**: Links emails to businesses and contacts
5. **Timeline Service**: Manages the display and interaction with emails in the timeline
6. **API Routes**: Exposes endpoints for frontend integration
7. **Background Jobs**: Handles scheduled email syncing and token refreshing
8. **Frontend Components**: Provides user interface for email timeline and provider connection

The implementation is designed to be modular, maintainable, and scalable, with proper error handling and logging throughout. It can be extended to support additional email providers or enhanced with more sophisticated content analysis as needed.
