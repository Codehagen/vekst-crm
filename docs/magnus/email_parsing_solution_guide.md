# Email Parsing Solution for CRM Timeline

## Executive Summary

This document provides a comprehensive solution for parsing and processing emails in your CRM system. The solution addresses the key challenges of syncing emails from providers (Gmail, Microsoft), associating them with businesses and contacts, and displaying them in a timeline with proper threading and content extraction.

The solution is designed to be:
- **Robust**: Handles complex email formats, threading, and content extraction
- **Scalable**: Processes emails efficiently with background jobs and batch processing
- **Maintainable**: Organized into modular components with clear separation of concerns
- **Extensible**: Can be extended to support additional email providers or enhanced features

## Solution Components

The email parsing solution consists of the following key components:

1. **MIME Parsing**: Processes raw email content to extract headers, body, and attachments
2. **Thread Identification**: Groups related emails into conversations
3. **Content Extraction**: Separates new content from quoted text, signatures, and disclaimers
4. **Business Association**: Links emails to businesses and contacts in the CRM
5. **Timeline Management**: Displays emails in a chronological timeline with thread grouping
6. **Provider Integration**: Connects to email providers (Gmail, Microsoft) to fetch emails
7. **Background Processing**: Syncs emails periodically with scheduled jobs

## Implementation Guide

### 1. Database Schema

The solution is built around the `EmailSync` model in your Prisma schema:

```prisma
model EmailSync {
  id              String    @id @default(cuid())
  externalId      String    // Original email ID from the provider
  subject         String
  body            String    @db.Text
  htmlBody        String?   @db.Text
  sentAt          DateTime
  receivedAt      DateTime?
  fromEmail       String
  fromName        String?
  toEmail         String[]
  ccEmail         String[]
  bccEmail        String[]
  attachments     Json?     // Store metadata about attachments
  isRead          Boolean   @default(false)
  isStarred       Boolean   @default(false)
  isDeleted       Boolean   @default(false)  // For soft delete in CRM
  folderPath      String?   // Original folder/label in email provider
  threadId        String?   // For grouping emails in the same conversation
  importance      String?   // Priority/importance flag from email
  metadata        Json?     // Additional metadata (quoted content, signatures, etc.)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  businessId      String?
  business        Business? @relation(fields: [businessId], references: [id], onDelete: SetNull)
  
  contactId       String?
  contact         Contact?  @relation(fields: [contactId], references: [id], onDelete: SetNull)
  
  providerId      String
  emailProvider   EmailProvider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@unique([userId, externalId])
  @@index([userId, businessId])
  @@index([userId, sentAt])
  @@index([threadId])
  @@map("email_syncs")
}
```

### 2. Implementation Steps

#### Step 1: Set Up Dependencies

Install the required packages:

```bash
npm install mailparser node-ical jsdom sanitize-html html-to-text googleapis @microsoft/microsoft-graph-client @azure/identity date-fns node-cron
npm install --save-dev @types/mailparser @types/jsdom @types/sanitize-html @types/html-to-text
```

#### Step 2: Implement Core Services

1. **MIME Parser**: Implement the MIME parsing service to process raw emails
2. **Thread Identifier**: Implement the thread identification logic
3. **Content Extractor**: Implement the content extraction algorithms
4. **Email Processor**: Implement the main email processing pipeline
5. **Provider Integrations**: Implement Gmail and Outlook provider integrations
6. **Business Associator**: Implement the business association logic
7. **Timeline Service**: Implement the timeline management service

#### Step 3: Set Up API Routes

Create API routes for:
- Email syncing
- Timeline retrieval
- Thread expansion
- Email status updates
- Email deletion and restoration
- Business association

#### Step 4: Implement Background Jobs

Set up scheduled jobs for:
- Periodic email syncing
- Token refreshing
- Error monitoring and reporting

#### Step 5: Create Frontend Components

Develop frontend components for:
- Email timeline display
- Thread expansion
- Email provider connection
- Email status management

### 3. Integration with Existing CRM

To integrate the email parsing solution with your existing CRM:

1. **Update Prisma Schema**: Add the `EmailSync` model to your schema
2. **Run Migrations**: Apply database migrations to create the necessary tables
3. **Configure Environment Variables**: Set up API keys and secrets for email providers
4. **Implement API Routes**: Add the email API routes to your existing API
5. **Add Frontend Components**: Integrate the email timeline components into your UI
6. **Set Up Background Jobs**: Configure the scheduled jobs for email syncing

### 4. Email Provider Setup

#### Gmail Integration

1. Create a Google Cloud project
2. Enable the Gmail API
3. Configure OAuth consent screen
4. Create OAuth credentials (client ID and secret)
5. Set up redirect URI for authentication

#### Microsoft Outlook Integration

1. Register an application in the Azure portal
2. Configure API permissions for Microsoft Graph
3. Create client credentials (client ID and secret)
4. Set up redirect URI for authentication

### 5. Testing Strategy

Implement a comprehensive testing strategy:

1. **Unit Tests**: Test individual components (MIME parsing, thread identification, content extraction)
2. **Integration Tests**: Test the interaction between components
3. **End-to-End Tests**: Test the complete email processing pipeline
4. **Performance Tests**: Test the system with large volumes of emails

### 6. Deployment Considerations

When deploying the solution:

1. **Scalability**: Use a job queue system for processing emails asynchronously
2. **Security**: Encrypt sensitive data (tokens, email content) at rest
3. **Monitoring**: Set up monitoring for email sync jobs and API endpoints
4. **Error Handling**: Implement robust error handling and reporting
5. **Rate Limiting**: Respect API rate limits for email providers

## Technical Deep Dive

For detailed technical information, refer to the following documents:

1. [MIME Parsing Strategy](mime_parsing_strategy.md): Detailed approach to parsing email MIME structure
2. [Thread Identification Strategy](thread_identification_strategy.md): Methods for identifying and grouping email threads
3. [Content Extraction Strategy](content_extraction_strategy.md): Techniques for extracting meaningful content from emails
4. [Implementation Code](implementation_code.md): Complete code examples for all components

## Best Practices

### Email Processing

1. **Incremental Syncing**: Use provider-specific mechanisms (history ID, delta queries) to fetch only new or changed emails
2. **Batch Processing**: Process emails in batches to avoid memory issues
3. **Error Resilience**: Implement retry mechanisms for failed operations
4. **Idempotency**: Ensure email processing is idempotent to avoid duplicates

### Content Extraction

1. **Conservative Extraction**: When in doubt, preserve more content rather than less
2. **Format Preservation**: Maintain formatting when possible, especially in HTML emails
3. **Sanitization**: Always sanitize HTML content to prevent XSS attacks
4. **Fallback Mechanisms**: Use multiple strategies with fallbacks for content extraction

### Thread Management

1. **Multiple Identifiers**: Use multiple methods to identify threads (headers, subject, content)
2. **Confidence Levels**: Assign confidence levels to thread identifications
3. **Manual Override**: Allow users to manually associate emails with threads if needed

### User Experience

1. **Responsive UI**: Ensure the email timeline loads quickly, even with many emails
2. **Progressive Loading**: Load emails and threads progressively as needed
3. **Clear Indicators**: Provide clear indicators for thread status, attachments, etc.
4. **Contextual Actions**: Show relevant actions based on email context

## Conclusion

This email parsing solution provides a comprehensive approach to integrating email functionality into your CRM system. By implementing this solution, you will be able to:

1. Sync emails from various providers (Gmail, Microsoft)
2. Associate emails with businesses and contacts
3. Display emails in a timeline with proper threading
4. Extract meaningful content from complex email formats
5. Provide a seamless user experience for managing email communications

The solution is designed to be robust, scalable, and maintainable, with a focus on providing a high-quality user experience while handling the complexities of email processing behind the scenes.
