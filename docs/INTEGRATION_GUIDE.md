# Advertising Data Integration Guide

This guide explains how to integrate real Google Ads and Facebook Ads data into the CRM system.

## Overview

The current implementation uses mock data to demonstrate the UI. To integrate with real advertising APIs, you'll need to:

1. Set up API authentication
2. Replace the mock data fetching with real API calls
3. Transform the API responses to match our data structure
4. Implement proper error handling and caching

## API Setup

### Google Ads API

1. Create a Google Cloud Project
2. Enable the Google Ads API
3. Set up OAuth2 authentication
4. Generate refresh tokens for API access

```bash
# Install Google Ads API client
npm install google-ads-api
```

### Facebook Marketing API

1. Create a Facebook Developer account
2. Register your app
3. Request access to the Marketing API
4. Generate access tokens

```bash
# Install Facebook Marketing API client
npm install facebook-nodejs-business-sdk
```

## Implementation Steps

### 1. Update the Server Action

Replace the mock data in `src/lib/actions/ad-actions.ts` with real API calls:

```typescript
"use server";

import { GoogleAdsApi } from 'google-ads-api';
import { AdAccount } from 'facebook-nodejs-business-sdk';
import { z } from "zod";
import { AdPerformance } from "@/types/ads";

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

const platformFilterSchema = z.enum(["all", "google", "facebook"]);

export async function getAdPerformance(
  dateRange: z.infer<typeof dateRangeSchema>,
  platform: z.infer<typeof platformFilterSchema> = "all"
): Promise<AdPerformance> {
  try {
    // Determine which platforms to fetch data for
    const fetchGoogle = platform === "all" || platform === "google";
    const fetchFacebook = platform === "all" || platform === "facebook";
    
    // Parallel data fetching
    const [googleData, facebookData] = await Promise.all([
      fetchGoogle ? fetchGoogleAdsData(dateRange) : Promise.resolve(null),
      fetchFacebook ? fetchFacebookAdsData(dateRange) : Promise.resolve(null),
    ]);
    
    // Combine and transform the data
    return transformApiResponsesToAdPerformance(googleData, facebookData);
  } catch (error) {
    console.error("Error fetching ad performance data:", error);
    throw new Error("Failed to fetch advertising data");
  }
}

async function fetchGoogleAdsData(dateRange: z.infer<typeof dateRangeSchema>) {
  // TODO: Replace with actual Google Ads API call
  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!
  });
  
  const customer = client.Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!
  });
  
  // Fetch campaign data, metrics, etc.
  // Transform into the expected format
  
  return { /* Google Ads API response */ };
}

async function fetchFacebookAdsData(dateRange: z.infer<typeof dateRangeSchema>) {
  // TODO: Replace with actual Facebook Marketing API call
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN!;
  const adAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID!;
  
  const adAccount = new AdAccount(adAccountId);
  adAccount.api_key = accessToken;
  
  // Fetch campaign data, metrics, etc.
  // Transform into the expected format
  
  return { /* Facebook API response */ };
}

function transformApiResponsesToAdPerformance(googleData: any, facebookData: any): AdPerformance {
  // Transform API responses into the AdPerformance shape
  // This will be specific to the structure of your API responses
  
  return {
    campaigns: [],
    timeseriesData: [],
    audienceInsights: {
      google: [],
      facebook: []
    },
    totalMetrics: {
      google: {/* metrics */},
      facebook: {/* metrics */}
    }
  };
}
```

### 2. Environment Configuration

Add the necessary environment variables to your `.env.local` file:

```
# Google Ads API
GOOGLE_ADS_CLIENT_ID=your-client-id
GOOGLE_ADS_CLIENT_SECRET=your-client-secret
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_CUSTOMER_ID=your-customer-id
GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token

# Facebook Marketing API
FACEBOOK_ACCESS_TOKEN=your-access-token
FACEBOOK_AD_ACCOUNT_ID=your-ad-account-id
```

### 3. Implement Data Caching

To improve performance, implement data caching using Next.js's built-in caching mechanisms:

```typescript
import { cache } from 'react';

// Create a cached version of the getAdPerformance function
export const getCachedAdPerformance = cache(async (
  dateRange: z.infer<typeof dateRangeSchema>,
  platform: z.infer<typeof platformFilterSchema> = "all"
) => {
  return getAdPerformance(dateRange, platform);
});
```

### 4. Implement Server-Side Filtering and Pagination

For large datasets, implement server-side filtering and pagination:

```typescript
const campaignFilterSchema = z.object({
  status: z.enum(["active", "paused", "ended"]).optional(),
  platform: platformFilterSchema.optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(10)
});

export async function getFilteredCampaigns(
  filters: z.infer<typeof campaignFilterSchema>
) {
  // Implement filtering logic here
}
```

### 5. Real-time Data Updates

For real-time updates, implement a polling mechanism or webhook receiver:

```typescript
// In a client component
"use client";

import { useEffect, useState } from 'react';
import { useAdData } from '@/hooks/useAdData';

export function RealtimeAdDashboard() {
  const { data, refresh } = useAdData();

  // Poll for updates every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refresh]);

  // Render dashboard with data
}
```

## Best Practices

1. **Rate Limiting**: Both Google and Facebook APIs have rate limits. Implement proper throttling and caching.

2. **Error Handling**: Implement robust error handling and display appropriate feedback to users.

3. **Credentials Security**: Never expose API credentials on the client side; always use server-side actions.

4. **Data Transformation**: Keep transformation logic separate from fetching logic for better maintainability.

5. **Incremental Adoption**: Start by integrating one platform first, then add the second platform.

6. **Testing**: Create mock responses for testing UI components without hitting actual APIs.

## Chart Integration

The current implementation uses a custom mock chart. For production, integrate a proper charting library:

1. Install a charting library like Tremor, Recharts, or Nivo:

```bash
npm install @tremor/react
```

2. Update the `AdPerformanceCharts` component to use the real charts.

## Deployment Considerations

1. **Environment Variables**: Ensure all necessary API credentials are set in your production environment.

2. **API Quotas**: Monitor API usage to avoid hitting quotas in production.

3. **Webhook Verification**: If using webhooks for real-time updates, implement proper verification. 