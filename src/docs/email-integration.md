# Email Integration Guide

This guide explains how the email integration works in our CRM application, allowing users to connect their Gmail accounts and send emails directly from the application.

## Overview

The email system consists of several components:
- OAuth2 authentication with Google
- Email provider token storage and management
- Email composition interface
- Server actions for sending emails via Gmail API

## Architecture

### Components

1. **EmailProviderSetup**: UI component for connecting email providers (Gmail, Outlook)
2. **EmailComposer**: UI component for composing and sending emails
3. **Email Server Actions**: Server-side functions for sending emails and managing tokens

### Data Flow

1. User authenticates with Google via OAuth
2. Access and refresh tokens are stored in the database
3. Tokens are used to send emails via the Gmail API
4. Expired tokens are automatically refreshed

## Configuration

### Prerequisites

1. Google Cloud Console project with Gmail API enabled
2. OAuth 2.0 credentials configured with the correct scopes
3. Authorized redirect URIs set up correctly

### Required Environment Variables

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=your_app_url
```

### OAuth Scopes

The following scopes are required for Gmail integration:
- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/gmail.modify`

## Usage

### Connecting a Gmail Account

1. Navigate to the Email page in the dashboard
2. Click "Connect Gmail"
3. Complete the Google OAuth flow
4. The app will store the OAuth tokens securely

If the automatic connection fails:
1. Click the "Manual Connect" button
2. This will attempt to manually fetch and store the Google tokens

### Sending Emails

1. Navigate to the Email page
2. Use the Email Composer interface
3. Enter recipient, subject, and message
4. Click "Send Email"

## Implementation Details

### Email Provider Storage

The application stores email provider information in the `EmailProvider` table:
- User ID
- Provider type (google/microsoft)
- Email address
- Access token
- Refresh token
- Token expiration time

### Token Refresh Flow

1. Before sending an email, the system checks if the token is expired
2. If expired, it automatically refreshes the token using the refresh token
3. The new token is stored in the database
4. The email is sent using the fresh token

### Email Sending Process

1. Email is formatted in MIME format
2. Content is base64 encoded
3. Sent via the Gmail API using the stored access token

## Troubleshooting

### Common Issues

**OAuth Connection Fails**
- Check that your redirect URIs are set up correctly in Google Cloud Console
- Ensure you've requested the correct scopes
- Try the "Manual Connect" button

**Email Sending Fails**
- Check console logs for detailed error messages
- Verify that the token is not expired
- Ensure the user has connected their Gmail account

**OAuth Permissions**
- Users must accept all requested permissions
- The gmail.modify scope requires verification if your app is used by many users

### Debugging

The application includes extensive logging for debugging OAuth and email issues:
- Token refresh attempts are logged
- Email sending process is logged
- Manual connection attempts provide detailed feedback

## API Reference

### Server Actions

#### `sendEmail({ to, subject, body, cc, bcc })`
Sends an email using the connected provider.

#### `getEmailProviderStatus()`
Checks if a user has a connected email provider.

#### `fetchGoogleTokenInfo()`
Manually retrieves and stores Google token information.

#### `saveEmailProvider(data)`
Saves email provider information to the database.

## Security Considerations

- OAuth tokens are stored securely in the database
- No passwords are stored, only OAuth tokens
- Tokens can be revoked by the user in their Google account settings
- The application only requests the minimum required permissions 