import { PageHeader } from "@/components/page-header";
import { AdOverview } from "@/components/ads/ad-overview";
import { AdPerformanceCharts } from "@/components/ads/ad-performance-charts";
import { AdGallery } from "@/components/ads/ad-gallery";
import { AudienceInsights } from "@/components/ads/audience-insights";
import { DateRangePicker } from "@/components/date-range-picker";
import { PlatformTabs } from "@/components/ads/platform-tabs";
import { Suspense } from "react";
import { AdsPageSkeleton } from "@/components/ads/ads-page-skeleton";
import { getAdPerformance } from "../actions/ads/ad-actions";

export default async function Ads() {
  // Default to last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const startDate = thirtyDaysAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  // Fetch initial data with default params
  const adData = await getAdPerformance({
    startDate,
    endDate,
  });

  return (
    <>
      <PageHeader
        items={[
          { label: "Annonsering", href: "#" },
          { label: "Kampanjeoversikt", isCurrentPage: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <PlatformTabs />
          <DateRangePicker
            defaultStartDate={startDate}
            defaultEndDate={endDate}
          />
        </div>

        <Suspense fallback={<AdsPageSkeleton />}>
          <AdOverview data={adData.totalMetrics} />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <AdPerformanceCharts data={adData.timeseriesData} />
            </div>
            <div>
              <AudienceInsights data={adData.audienceInsights} />
            </div>
          </div>

          <AdGallery campaigns={adData.campaigns} />
        </Suspense>
      </div>
    </>
  );
}
