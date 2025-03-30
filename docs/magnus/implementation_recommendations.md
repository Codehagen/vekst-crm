# Implementation Recommendations for Email Sync Integration

## Database Schema Updates

### 1. Update User Model
Add a relation to the User model to link to EmailSync records:

```prisma
model User {
  // existing fields...
  emailSyncs EmailSync[]
  // other existing relations...
}
```

### 2. Update Business Model
Add a relation to the Business model to link to EmailSync records:

```prisma
model Business {
  // existing fields...
  emailSyncs EmailSync[]
  // other existing relations...
}
```

### 3. Update EmailProvider Model
Add a relation to the EmailProvider model to link to EmailSync records:

```prisma
model EmailProvider {
  // existing fields...
  emailSyncs EmailSync[]
  // other existing relations...
}
```

### 4. Update Contact Model
Add a relation to the Contact model to link to EmailSync records:

```prisma
model Contact {
  // existing fields...
  emailSyncs EmailSync[]
  // other existing relations...
}
```

## Technical Implementation

### 1. Email Provider API Integration

#### Gmail API Integration
```typescript
import { google } from 'googleapis';

async function syncGmailEmails(userId: string, providerId: string) {
  // Get provider credentials from database
  const provider = await prisma.emailProvider.findUnique({
    where: { id: providerId }
  });
  
  // Set up OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  oauth2Client.setCredentials({
    access_token: provider.accessToken,
    refresh_token: provider.refreshToken,
    expiry_date: provider.expiresAt.getTime()
  });
  
  // Create Gmail client
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  // Get list of emails
  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 100,
    // Use historyId for incremental sync
  });
  
  // Process each email
  for (const message of response.data.messages || []) {
    await processGmailMessage(gmail, message.id, userId, providerId);
  }
  
  // Update tokens if refreshed
  const tokens = oauth2Client.credentials;
  if (tokens.access_token !== provider.accessToken) {
    await prisma.emailProvider.update({
      where: { id: providerId },
      data: {
        accessToken: tokens.access_token,
        expiresAt: new Date(tokens.expiry_date)
      }
    });
  }
}

async function processGmailMessage(gmail, messageId, userId, providerId) {
  // Get full message details
  const message = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full'
  });
  
  // Extract email details (headers, body, etc.)
  const headers = message.data.payload.headers;
  const subject = headers.find(h => h.name === 'Subject')?.value || '';
  const from = headers.find(h => h.name === 'From')?.value || '';
  const to = headers.find(h => h.name === 'To')?.value || '';
  const date = headers.find(h => h.name === 'Date')?.value || '';
  
  // Extract email body
  const body = extractBody(message.data.payload);
  
  // Check if email already exists
  const existingEmail = await prisma.emailSync.findUnique({
    where: {
      userId_externalId: {
        userId,
        externalId: messageId
      }
    }
  });
  
  if (existingEmail) {
    // Update existing record if needed
    await prisma.emailSync.update({
      where: { id: existingEmail.id },
      data: {
        isRead: !message.data.labelIds.includes('UNREAD'),
        // Update other fields as needed
      }
    });
  } else {
    // Create new record
    await prisma.emailSync.create({
      data: {
        externalId: messageId,
        subject,
        body: body.textPlain || '',
        htmlBody: body.textHtml || null,
        sentAt: new Date(date),
        fromEmail: extractEmail(from),
        fromName: extractName(from),
        toEmail: [extractEmail(to)],
        ccEmail: [],
        bccEmail: [],
        threadId: message.data.threadId,
        isRead: !message.data.labelIds.includes('UNREAD'),
        folderPath: message.data.labelIds.join(','),
        userId,
        providerId,
        // Business association will be done separately
      }
    });
  }
}
```

#### Microsoft Graph API Integration
```typescript
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/tokenCredentialAuthProvider';
import { ClientSecretCredential } from '@azure/identity';

async function syncMicrosoftEmails(userId: string, providerId: string) {
  // Get provider credentials from database
  const provider = await prisma.emailProvider.findUnique({
    where: { id: providerId }
  });
  
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
  
  // Get list of emails
  const response = await client.api('/me/messages')
    .top(100)
    .select('id,subject,bodyPreview,receivedDateTime,from,toRecipients,ccRecipients,body,isRead')
    .get();
  
  // Process each email
  for (const message of response.value) {
    await processMicrosoftMessage(message, userId, providerId);
  }
}

async function processMicrosoftMessage(message, userId, providerId) {
  // Check if email already exists
  const existingEmail = await prisma.emailSync.findUnique({
    where: {
      userId_externalId: {
        userId,
        externalId: message.id
      }
    }
  });
  
  if (existingEmail) {
    // Update existing record if needed
    await prisma.emailSync.update({
      where: { id: existingEmail.id },
      data: {
        isRead: message.isRead,
        // Update other fields as needed
      }
    });
  } else {
    // Create new record
    await prisma.emailSync.create({
      data: {
        externalId: message.id,
        subject: message.subject,
        body: message.body.content,
        htmlBody: message.body.contentType === 'html' ? message.body.content : null,
        sentAt: new Date(message.receivedDateTime),
        fromEmail: message.from.emailAddress.address,
        fromName: message.from.emailAddress.name,
        toEmail: message.toRecipients.map(r => r.emailAddress.address),
        ccEmail: message.ccRecipients.map(r => r.emailAddress.address),
        bccEmail: [],
        isRead: message.isRead,
        userId,
        providerId,
        // Business association will be done separately
      }
    });
  }
}
```

### 2. Business Association Logic

```typescript
async function associateEmailWithBusiness(emailId: string) {
  const email = await prisma.emailSync.findUnique({
    where: { id: emailId },
    include: { user: true }
  });
  
  if (!email) return null;
  
  // Try to match by domain
  const fromDomain = email.fromEmail.split('@')[1];
  
  // Find businesses with matching domain in email or website
  const businesses = await prisma.business.findMany({
    where: {
      OR: [
        { email: { contains: fromDomain } },
        { website: { contains: fromDomain } }
      ]
    }
  });
  
  if (businesses.length === 1) {
    // Single match found
    await prisma.emailSync.update({
      where: { id: emailId },
      data: { businessId: businesses[0].id }
    });
    return businesses[0].id;
  } else if (businesses.length > 1) {
    // Multiple matches, try to narrow down
    // This could be enhanced with more sophisticated matching
    return null; // Require manual association
  }
  
  // Try to match by contact email
  const contacts = await prisma.contact.findMany({
    where: { email: email.fromEmail }
  });
  
  if (contacts.length === 1) {
    await prisma.emailSync.update({
      where: { id: emailId },
      data: { 
        businessId: contacts[0].businessId,
        contactId: contacts[0].id
      }
    });
    return contacts[0].businessId;
  }
  
  // No match found, require manual association
  return null;
}
```

### 3. Timeline API Endpoints

```typescript
// Get email timeline for a business
app.get('/api/businesses/:businessId/timeline', async (req, res) => {
  const { businessId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const skip = (page - 1) * limit;
  
  const emails = await prisma.emailSync.findMany({
    where: {
      businessId,
      isDeleted: false
    },
    orderBy: { sentAt: 'desc' },
    skip,
    take: limit,
    include: {
      user: {
        select: { name: true, email: true }
      }
    }
  });
  
  const total = await prisma.emailSync.count({
    where: {
      businessId,
      isDeleted: false
    }
  });
  
  res.json({
    data: emails,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Delete email from timeline (soft delete)
app.delete('/api/emails/:emailId', async (req, res) => {
  const { emailId } = req.params;
  
  await prisma.emailSync.update({
    where: { id: emailId },
    data: { isDeleted: true }
  });
  
  res.json({ success: true });
});

// Restore deleted email
app.post('/api/emails/:emailId/restore', async (req, res) => {
  const { emailId } = req.params;
  
  await prisma.emailSync.update({
    where: { id: emailId },
    data: { isDeleted: false }
  });
  
  res.json({ success: true });
});
```

## Background Jobs

### 1. Scheduled Email Sync

Using a job scheduler like Bull or node-cron:

```typescript
// Set up recurring job to sync emails every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  // Get all email providers
  const providers = await prisma.emailProvider.findMany();
  
  // Process each provider
  for (const provider of providers) {
    try {
      if (provider.provider === 'google') {
        await syncGmailEmails(provider.userId, provider.id);
      } else if (provider.provider === 'microsoft') {
        await syncMicrosoftEmails(provider.userId, provider.id);
      }
    } catch (error) {
      console.error(`Error syncing emails for provider ${provider.id}:`, error);
      // Log error and continue with next provider
    }
  }
});
```

### 2. Token Refresh Job

```typescript
// Set up job to refresh tokens before they expire
cron.schedule('0 */6 * * *', async () => {
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
      console.error(`Error refreshing token for provider ${provider.id}:`, error);
    }
  }
});
```

## Frontend Components

### 1. Email Timeline Component

```tsx
// React component for email timeline
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EmailTimeline = ({ businessId }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  
  useEffect(() => {
    fetchEmails();
  }, [businessId, page]);
  
  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/businesses/${businessId}/timeline?page=${page}`);
      setEmails(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (emailId) => {
    try {
      await axios.delete(`/api/emails/${emailId}`);
      // Remove from list or refresh
      setEmails(emails.filter(email => email.id !== emailId));
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  };
  
  return (
    <div className="email-timeline">
      <h2>Email Timeline</h2>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {emails.length === 0 ? (
            <div>No emails found</div>
          ) : (
            <div className="email-list">
              {emails.map(email => (
                <div key={email.id} className="email-item">
                  <div className="email-header">
                    <div className="email-subject">{email.subject}</div>
                    <div className="email-date">{new Date(email.sentAt).toLocaleString()}</div>
                  </div>
                  <div className="email-sender">
                    From: {email.fromName || email.fromEmail}
                  </div>
                  <div className="email-preview">
                    {email.body.substring(0, 150)}...
                  </div>
                  <div className="email-actions">
                    <button onClick={() => handleViewDetails(email.id)}>View</button>
                    <button onClick={() => handleDelete(email.id)}>Delete</button>
                  </div>
                </div>
              ))}
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
            <span>Page {page} of {pagination.pages}</span>
            <button 
              disabled={page === pagination.pages} 
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

### 2. Email Provider Connection Component

```tsx
import React, { useState } from 'react';
import axios from 'axios';

const EmailProviderConnection = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  
  useEffect(() => {
    // Check if user already has a connected provider
    const checkProvider = async () => {
      try {
        const response = await axios.get(`/api/users/${userId}/email-provider`);
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
      await axios.delete(`/api/users/${userId}/email-provider/${provider.id}`);
      setProvider(null);
    } catch (error) {
      console.error('Error disconnecting provider:', error);
    } finally {
      setLoading(false);
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
          <button 
            onClick={disconnectProvider}
            disabled={loading}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="provider-options">
          <p>Connect an email provider to sync emails with your CRM:</p>
          
          <div className="provider-buttons">
            <button 
              onClick={connectGmail}
              disabled={loading}
            >
              Connect Gmail
            </button>
            
            <button 
              onClick={connectOutlook}
              disabled={loading}
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

## Security Considerations

1. **OAuth Token Storage**
   - Store access and refresh tokens securely
   - Encrypt sensitive data at rest
   - Use environment variables for API keys and secrets

2. **Email Content Security**
   - Consider encryption for sensitive email content
   - Implement proper access controls to restrict who can view emails
   - Add audit logging for email access and deletion

3. **Rate Limiting**
   - Implement rate limiting for API endpoints
   - Respect provider API rate limits during sync
   - Add exponential backoff for retries

4. **Error Handling**
   - Gracefully handle API errors
   - Implement proper logging for debugging
   - Set up monitoring and alerts for sync failures
