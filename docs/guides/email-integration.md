# Email Integration Guide

This guide explains how to integrate email functionality into the CRM system using Node.js and Next.js server actions.

## Overview

The email integration will allow the system to:
- Send automated notifications about ad performance
- Deliver campaign reports
- Send alerts for important metrics
- Handle user notifications

## Technology Stack

- **Email Service**: [Resend](https://resend.com) - Modern email API with high deliverability
- **Email Templates**: [React Email](https://react.email) - Build and preview email templates using React
- **Type Safety**: TypeScript interfaces for email templates and configurations

## Setup Instructions

### 1. Install Dependencies

```bash
npm install resend @react-email/components @react-email/render
```

### 2. Environment Configuration

Add the following to your `.env.local`:

```env
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your-verified-domain@resend.dev
```

### 3. Create Email Service

Create a new file at `src/lib/email/email-service.ts`:

```typescript
import { Resend } from 'resend';
import { renderAsync } from '@react-email/render';

interface EmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail({ to, subject, react }: EmailOptions) {
    try {
      const html = await renderAsync(react);
      
      const data = await this.resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to,
        subject,
        html,
      });

      return { success: true, data };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error };
    }
  }
}

export const emailService = new EmailService();
```

### 4. Create Email Templates

Create a new directory at `src/components/emails` for your email templates:

```typescript
// src/components/emails/campaign-report.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';

interface CampaignReportEmailProps {
  campaignName: string;
  metrics: {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
  };
}

export function CampaignReportEmail({ campaignName, metrics }: CampaignReportEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Kampanjerapport: {campaignName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Kampanjerapport: {campaignName}</Heading>
          
          <Text style={text}>Her er resultatene for din kampanje:</Text>
          
          <Text style={metrics}>
            • Visninger: {metrics.impressions.toLocaleString('nb-NO')}<br />
            • Klikk: {metrics.clicks.toLocaleString('nb-NO')}<br />
            • Forbruk: {metrics.spend.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}<br />
            • Konverteringer: {metrics.conversions}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'Inter, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.5',
};

const metrics = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.75',
};
```

### 5. Create Server Actions

Create email-related server actions in `src/lib/actions/email-actions.ts`:

```typescript
'use server'

import { emailService } from '../email/email-service';
import { CampaignReportEmail } from '@/components/emails/campaign-report';

export async function sendCampaignReport(
  email: string,
  campaignName: string,
  metrics: {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
  }
) {
  return emailService.sendEmail({
    to: email,
    subject: `Kampanjerapport: ${campaignName}`,
    react: CampaignReportEmail({ campaignName, metrics }),
  });
}
```

### 6. Usage Example

Here's how to use the email functionality in your components:

```typescript
'use client'

import { sendCampaignReport } from '@/lib/actions/email-actions';

export function SendReportButton({ campaign }) {
  const handleSendReport = async () => {
    const result = await sendCampaignReport(
      'recipient@example.com',
      campaign.name,
      {
        impressions: campaign.metrics.impressions,
        clicks: campaign.metrics.clicks,
        spend: campaign.metrics.spend,
        conversions: campaign.metrics.conversions,
      }
    );

    if (result.success) {
      // Show success notification
    } else {
      // Handle error
    }
  };

  return (
    <Button onClick={handleSendReport}>
      Send Rapport
    </Button>
  );
}
```

## Best Practices

1. **Email Templates**
   - Use React Email components for consistent rendering
   - Test templates across different email clients
   - Include both HTML and plain text versions
   - Use responsive design patterns

2. **Error Handling**
   - Implement proper error handling and logging
   - Set up retry mechanisms for failed emails
   - Monitor email delivery rates and bounces

3. **Security**
   - Never expose API keys in client-side code
   - Validate email addresses before sending
   - Implement rate limiting for email sending
   - Use environment variables for sensitive data

4. **Performance**
   - Queue emails for bulk sending
   - Use background jobs for non-urgent emails
   - Implement caching for template rendering

## Testing

1. Set up a test environment:
```typescript
// src/lib/email/__tests__/email-service.test.ts
import { emailService } from '../email-service';

describe('EmailService', () => {
  it('should send email successfully', async () => {
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      react: <div>Test content</div>,
    });

    expect(result.success).toBe(true);
  });
});
```

2. Use test API keys for development
3. Implement email preview functionality
4. Set up email delivery monitoring

## Monitoring and Analytics

1. Track email metrics:
   - Delivery rates
   - Open rates
   - Click-through rates
   - Bounce rates

2. Set up logging:
   - Email sending attempts
   - Delivery status
   - Error tracking

3. Implement alerting for:
   - High bounce rates
   - Failed deliveries
   - API quota limits

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
- [Email Testing Tools](https://www.emailtestingtools.com/) 