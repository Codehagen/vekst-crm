"use server";

import { z } from "zod";

export interface AdMetric {
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  conversions: number;
  costPerConversion: number;
  roas: number;
}

export interface AdCreative {
  id: string;
  imageUrl: string;
  headline: string;
  description: string;
  callToAction: string;
}

export interface AdCampaign {
  id: string;
  name: string;
  platform: "google" | "facebook";
  status: "active" | "paused" | "ended";
  startDate: string;
  endDate: string | null;
  budget: number;
  spend: number;
  metrics: AdMetric;
  creatives: AdCreative[];
}

export interface AudienceInsight {
  type: "age" | "gender" | "location" | "device";
  data: Array<{ label: string; value: number }>;
}

export interface AdPerformance {
  campaigns: AdCampaign[];
  timeseriesData: Array<{
    date: string;
    google: { clicks: number; impressions: number; spend: number };
    facebook: { clicks: number; impressions: number; spend: number };
  }>;
  audienceInsights: {
    google: AudienceInsight[];
    facebook: AudienceInsight[];
  };
  totalMetrics: {
    google: AdMetric;
    facebook: AdMetric;
  };
}

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
  // This would be replaced with actual API calls to Google and Facebook APIs

  // Mock data generation
  const mockData: AdPerformance = {
    campaigns: [
      {
        id: "g-camp-1",
        name: "Google Search Campaign Q1",
        platform: "google",
        status: "active",
        startDate: "2023-01-01",
        endDate: null,
        budget: 5000,
        spend: 3450,
        metrics: {
          impressions: 145000,
          clicks: 4350,
          ctr: 3.0,
          spend: 3450,
          conversions: 87,
          costPerConversion: 39.65,
          roas: 3.2,
        },
        creatives: [
          {
            id: "g-ad-1",
            imageUrl: "/images/mock/google-ad-1.webp",
            headline: "Professional CRM Solutions",
            description: "Streamline your business with our powerful CRM.",
            callToAction: "Get Started",
          },
        ],
      },
      {
        id: "fb-camp-1",
        name: "Facebook Awareness Campaign",
        platform: "facebook",
        status: "active",
        startDate: "2023-01-15",
        endDate: null,
        budget: 3000,
        spend: 2100,
        metrics: {
          impressions: 210000,
          clicks: 6300,
          ctr: 3.0,
          spend: 2100,
          conversions: 42,
          costPerConversion: 50.0,
          roas: 2.8,
        },
        creatives: [
          {
            id: "fb-ad-1",
            imageUrl: "/images/mock/facebook-ad-1.webp",
            headline: "Transform Your Customer Relationships",
            description:
              "Our CRM helps businesses grow faster. Join thousands of satisfied customers.",
            callToAction: "Learn More",
          },
        ],
      },
    ],
    timeseriesData: generateMockTimeseriesData(
      dateRange.startDate,
      dateRange.endDate
    ),
    audienceInsights: {
      google: [
        {
          type: "age",
          data: [
            { label: "18-24", value: 15 },
            { label: "25-34", value: 32 },
            { label: "35-44", value: 28 },
            { label: "45-54", value: 18 },
            { label: "55+", value: 7 },
          ],
        },
        {
          type: "device",
          data: [
            { label: "Mobile", value: 62 },
            { label: "Desktop", value: 31 },
            { label: "Tablet", value: 7 },
          ],
        },
      ],
      facebook: [
        {
          type: "age",
          data: [
            { label: "18-24", value: 22 },
            { label: "25-34", value: 38 },
            { label: "35-44", value: 24 },
            { label: "45-54", value: 12 },
            { label: "55+", value: 4 },
          ],
        },
        {
          type: "device",
          data: [
            { label: "Mobile", value: 78 },
            { label: "Desktop", value: 18 },
            { label: "Tablet", value: 4 },
          ],
        },
      ],
    },
    totalMetrics: {
      google: {
        impressions: 145000,
        clicks: 4350,
        ctr: 3.0,
        spend: 3450,
        conversions: 87,
        costPerConversion: 39.65,
        roas: 3.2,
      },
      facebook: {
        impressions: 210000,
        clicks: 6300,
        ctr: 3.0,
        spend: 2100,
        conversions: 42,
        costPerConversion: 50.0,
        roas: 2.8,
      },
    },
  };

  // Filter by platform if needed
  if (platform !== "all") {
    mockData.campaigns = mockData.campaigns.filter(
      (campaign) => campaign.platform === platform
    );
  }

  // Simulate server delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return mockData;
}

// Helper function to generate mock timeseries data
function generateMockTimeseriesData(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 3600 * 24)
  );

  const result = [];
  const currentDate = new Date(start);

  for (let i = 0; i < daysDiff; i++) {
    result.push({
      date: currentDate.toISOString().split("T")[0],
      google: {
        clicks: Math.floor(Math.random() * 300) + 100,
        impressions: Math.floor(Math.random() * 10000) + 3000,
        spend: Math.floor(Math.random() * 300) + 100,
      },
      facebook: {
        clicks: Math.floor(Math.random() * 400) + 150,
        impressions: Math.floor(Math.random() * 12000) + 5000,
        spend: Math.floor(Math.random() * 250) + 80,
      },
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}
