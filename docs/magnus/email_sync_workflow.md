# Email Sync Workflow for CRM Timeline

## Overview
This document outlines the workflow for syncing emails from email providers (Google, Microsoft) to the CRM system, associating them with users and businesses, and displaying them in a timeline.

## Email Sync Process

### 1. Authentication and Setup
1. User connects their email account (Gmail, Outlook) via OAuth
2. System stores access/refresh tokens in the `EmailProvider` model
3. User configures sync settings (frequency, folders to sync, etc.)

### 2. Initial Sync
1. Fetch emails from provider API using stored credentials
   - For Gmail: Use Gmail API
   - For Microsoft: Use Microsoft Graph API
2. For each email:
   - Check if already exists in `EmailSync` table (using externalId + userId)
   - If new, create new `EmailSync` record
   - If exists, update if needed (e.g., read status changed)

### 3. Business Association
1. Analyze email content to determine relevant business:
   - Match email domains against business email domains
   - Match email addresses against contact email addresses
   - Use NLP/pattern matching on email content (optional)
2. Allow manual association by users when automatic matching fails
3. Update `EmailSync` record with appropriate `businessId` and/or `contactId`

### 4. Incremental Sync
1. Run periodic sync jobs (e.g., every 15-30 minutes)
2. Use provider-specific mechanisms to fetch only new/changed emails:
   - Gmail: Use history ID or push notifications
   - Microsoft: Use delta queries or webhooks
3. Process new emails as in steps 2-3

## Timeline Management

### 1. Timeline Display
1. Query `EmailSync` records filtered by:
   - User ID (for user-specific timeline)
   - Business ID (for business-specific timeline)
   - Date range (for time-specific views)
2. Sort by `sentAt` date (descending) for chronological display
3. Group by `threadId` to show conversations together (optional)

### 2. Email Management
1. View email details:
   - Display full email content, attachments, and metadata
   - Show relationship to business/contact
2. Update email status:
   - Mark as read/unread
   - Star/flag important emails
3. Delete from timeline:
   - Set `isDeleted = true` (soft delete)
   - Email remains in original provider but is hidden in CRM

### 3. Deletion Handling
1. Soft delete:
   - When user deletes an email from timeline, set `isDeleted = true`
   - Email no longer appears in timeline but remains in database
   - Original email in provider (Gmail, Outlook) is unaffected
2. Hard delete (optional admin function):
   - Permanently remove `EmailSync` record from database
   - Original email in provider remains unaffected

## Data Synchronization Considerations

### 1. Handling Email Changes
1. If email is modified in provider (e.g., marked as read):
   - Update corresponding `EmailSync` record during next sync
2. If email is deleted in provider:
   - Option 1: Mark as deleted in CRM
   - Option 2: Keep in CRM with flag indicating "deleted in provider"

### 2. Attachment Handling
1. Store attachment metadata in `attachments` JSON field:
   ```json
   {
     "attachments": [
       {
         "filename": "proposal.pdf",
         "mimeType": "application/pdf",
         "size": 1024000,
         "url": "https://storage.example.com/attachments/abc123"
       }
     ]
   }
   ```
2. Options for attachment storage:
   - Store in cloud storage (S3, GCS) and reference URL
   - Store in database as binary data (not recommended for large files)
   - Fetch on-demand from email provider when needed

### 3. Error Handling
1. Track sync status and errors
2. Implement retry mechanism for failed syncs
3. Notify users of authentication issues (e.g., expired tokens)
