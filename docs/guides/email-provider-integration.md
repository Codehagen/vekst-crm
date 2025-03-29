# Email Provider Integration Guide

This guide explains how to integrate users' own email providers (Gmail, Outlook, etc.) into the CRM system, allowing them to send emails from their own email addresses.

## Overview

The integration will allow users to:
- Connect their email provider (Gmail, Outlook, etc.) using OAuth2
- Send emails directly from their email address
- Manage email templates
- Track email history and status

## Technology Stack

- **Email Integration**: [NodeMailer](https://nodemailer.com) - For SMTP email sending
- **OAuth2**: [Better Auth](https://www.better-auth.com) - For email provider authentication
- **Database**: Prisma schema for storing email settings and templates
- **Security**: OAuth2 token encryption and secure credential storage

## Implementation Steps

### 1. Install Dependencies

```bash
npm install nodemailer better-auth @prisma/client googleapis
```

### 2. Configure OAuth2 Providers

Add provider configurations to your `.env.local`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# Better Auth configuration
BETTER_AUTH_SECRET=your_better_auth_secret
```

### 3. Update Prisma Schema

Add email provider settings to `prisma/schema.prisma`:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  emailProvider EmailProvider?
}

model EmailProvider {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  provider      String    // "google" | "outlook"
  email         String
  accessToken   String    @db.Text
  refreshToken  String?   @db.Text
  expiresAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model EmailTemplate {
  id          String    @id @default(cuid())
  userId      String
  name        String
  subject     String
  content     String    @db.Text
  variables   Json      // Store template variables
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### 4. Configure Better Auth

Create `src/lib/auth.ts`:

```typescript
import { betterAuth } from "better-auth";
import { PrismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: { 
      clientId: process.env.GOOGLE_CLIENT_ID as string, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
      // Add proper scopes for email sending
      scopes: ["openid", "email", "profile", "https://mail.google.com/"]
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      scopes: ["openid", "email", "profile", "https://outlook.office.com/Mail.Send"]
    }
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account && user) {
        // Store tokens in EmailProvider table for email sending
        await prisma.emailProvider.upsert({
          where: {
            userId: user.id,
          },
          update: {
            accessToken: account.accessToken,
            refreshToken: account.refreshToken,
            expiresAt: account.expiresAt ? new Date(account.expiresAt * 1000) : null,
          },
          create: {
            userId: user.id,
            provider: account.provider,
            email: user.email!,
            accessToken: account.accessToken,
            refreshToken: account.refreshToken,
            expiresAt: account.expiresAt ? new Date(account.expiresAt * 1000) : null,
          },
        });
      }
      return true;
    }
  }
});

export const getSession = auth.getSession;
```

### 5. Create Email Service

Create `src/lib/email/email-service.ts`:

```typescript
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

export class EmailService {
  private async getTransporter(userId: string) {
    const emailProvider = await prisma.emailProvider.findUnique({
      where: { userId },
    });

    if (!emailProvider) {
      throw new Error('No email provider configured');
    }

    // Check if token needs refresh (Better Auth may already handle this for you)
    if (emailProvider.expiresAt && new Date() > emailProvider.expiresAt) {
      // You may handle token refresh here if needed
      // Better Auth often handles token refresh automatically
    }

    if (emailProvider.provider === 'google') {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: emailProvider.accessToken,
        refresh_token: emailProvider.refreshToken || undefined,
      });

      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: emailProvider.email,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          accessToken: emailProvider.accessToken,
          refreshToken: emailProvider.refreshToken || undefined,
        },
      });
    }

    if (emailProvider.provider === 'microsoft') {
      // For Outlook/Office365
      return nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
          type: 'OAuth2',
          user: emailProvider.email,
          accessToken: emailProvider.accessToken,
        },
      });
    }

    throw new Error('Unsupported email provider');
  }

  async sendEmail(userId: string, options: {
    to: string;
    subject: string;
    html: string;
    templateId?: string;
    variables?: Record<string, string>;
  }) {
    try {
      const transporter = await this.getTransporter(userId);
      
      let html = options.html;
      
      // If using a template
      if (options.templateId) {
        const template = await prisma.emailTemplate.findUnique({
          where: { id: options.templateId },
        });
        
        if (!template) {
          throw new Error('Template not found');
        }
        
        html = template.content;
        
        // Replace variables in template
        if (options.variables) {
          Object.entries(options.variables).forEach(([key, value]) => {
            html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
          });
        }
      }

      const result = await transporter.sendMail({
        from: (await prisma.emailProvider.findUnique({ where: { userId } }))?.email,
        to: options.to,
        subject: options.subject,
        html,
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }
  }
}

export const emailService = new EmailService();
```

### 6. Create Server Actions

Create `src/lib/actions/email-actions.ts`:

```typescript
'use server'

import { emailService } from '../email/email-service';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function sendCustomerEmail(data: {
  to: string;
  subject: string;
  content: string;
  templateId?: string;
  variables?: Record<string, string>;
}) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  return emailService.sendEmail(session.user.id, {
    to: data.to,
    subject: data.subject,
    html: data.content,
    templateId: data.templateId,
    variables: data.variables,
  });
}

export async function saveEmailTemplate(data: {
  name: string;
  subject: string;
  content: string;
  variables: Record<string, string>;
}) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  return prisma.emailTemplate.create({
    data: {
      userId: session.user.id,
      name: data.name,
      subject: data.subject,
      content: data.content,
      variables: data.variables,
    },
  });
}
```

### 7. Create Email Provider Setup Component

Create `src/components/email/email-provider-setup.tsx`:

```typescript
'use client';

import { createAuthClient } from "better-auth/client";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function EmailProviderSetup() {
  const authClient = createAuthClient();
  
  const connectGmail = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackUrl: "/dashboard"
    });
  };
  
  const connectOutlook = async () => {
    await authClient.signIn.social({
      provider: "microsoft",
      callbackUrl: "/dashboard"
    });
  };
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Koble til e-postleverandør
      </h2>
      <div className="space-y-4">
        <Button
          onClick={connectGmail}
          className="w-full"
        >
          Koble til Gmail
        </Button>
        <Button
          onClick={connectOutlook}
          className="w-full"
        >
          Koble til Outlook
        </Button>
      </div>
    </Card>
  );
}
```

### 8. Create Email Composer Component

Create `src/components/email/email-composer.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { sendCustomerEmail } from '@/lib/actions/email-actions';
import { toast } from '@/components/ui/toast';

interface EmailFormData {
  to: string;
  subject: string;
  content: string;
}

export function EmailComposer() {
  const [isSending, setIsSending] = useState(false);
  const { register, handleSubmit, reset } = useForm<EmailFormData>();

  const onSubmit = async (data: EmailFormData) => {
    setIsSending(true);
    try {
      const result = await sendCustomerEmail(data);
      if (result.success) {
        reset();
        toast({
          title: "E-post sendt",
          description: "E-posten ble sendt vellykket.",
          variant: "success",
        });
      } else {
        toast({
          title: "Feil ved sending",
          description: "Det oppstod en feil ved sending av e-post.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register('to')}
        type="email"
        placeholder="Mottakers e-post"
        required
      />
      <Input
        {...register('subject')}
        type="text"
        placeholder="Emne"
        required
      />
      <Textarea
        {...register('content')}
        placeholder="Skriv din melding her..."
        rows={10}
        required
      />
      <Button type="submit" disabled={isSending}>
        {isSending ? 'Sender...' : 'Send e-post'}
      </Button>
    </form>
  );
}
```

## Usage

1. Users first need to connect their email provider:
   - Navigate to email settings
   - Click "Connect Gmail" or "Connect Outlook"
   - Authorize the application

2. Send emails using the connected provider:
   ```typescript
   import { sendCustomerEmail } from '@/lib/actions/email-actions';

   // In a server action or component
   const result = await sendCustomerEmail({
     to: 'customer@example.com',
     subject: 'Kampanjeoppdatering',
     content: 'Her er din kampanjeoppdatering...',
   });
   ```

## Better Auth Integration Benefits

1. **Simpler Authentication Setup**:
   - Streamlined configuration process
   - Reduced boilerplate compared to NextAuth

2. **Social Provider Integration**:
   - Direct support for Google, Microsoft, and other providers
   - Built-in token management

3. **Client-Side Integration**:
   - Clean API for initiating social login
   - Support for direct ID token authentication

4. **Token Management**:
   - Automatic token refresh handling
   - Secure token storage

## Security Considerations

1. **Token Storage**
   - Store OAuth tokens securely in the database
   - Encrypt sensitive data at rest
   - Better Auth handles token refresh automatically

2. **Rate Limiting**
   - Implement rate limiting for email sending
   - Monitor for abuse patterns
   - Set daily sending limits

3. **Access Control**
   - Verify user permissions before sending
   - Log all email activities
   - Implement IP-based restrictions

## Error Handling

1. Handle common errors:
   - Invalid credentials
   - Rate limiting
   - Network issues
   - Template rendering errors

2. Implement retry logic:
   ```typescript
   async function sendWithRetry(options: EmailOptions, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await sendCustomerEmail(options);
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
       }
     }
   }
   ```

## Testing

1. Set up test accounts for each provider
2. Implement integration tests
3. Test token refresh flows
4. Verify template rendering
5. Test error scenarios

## Monitoring

1. Track key metrics:
   - Sending success rate
   - Token refresh status
   - Error rates
   - Usage patterns

2. Set up alerts for:
   - Authentication failures
   - High error rates
   - Token expiration
   - Rate limit approaches

## Additional Resources

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/api/resources/mail-api-overview)
- [NodeMailer Documentation](https://nodemailer.com/about/) 