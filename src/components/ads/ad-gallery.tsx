"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { GoogleCircleFilled, Facebook } from "@/components/icons";
import { AdCampaign } from "@/lib/actions/ad-actions";
import { InfoIcon, ExternalLinkIcon } from "lucide-react";

interface AdGalleryProps {
  campaigns: AdCampaign[];
}

export function AdGallery({ campaigns }: AdGalleryProps) {
  const [platform, setPlatform] = useState<"all" | "google" | "facebook">(
    "all"
  );

  // Filter campaigns by selected platform
  const filteredCampaigns =
    platform === "all"
      ? campaigns
      : campaigns.filter((campaign) => campaign.platform === platform);

  // Flatten all creatives from filtered campaigns
  const allCreatives = filteredCampaigns.flatMap((campaign) =>
    campaign.creatives.map((creative) => ({
      ...creative,
      campaignName: campaign.name,
      platform: campaign.platform,
      status: campaign.status,
      metrics: campaign.metrics,
    }))
  );

  // Norwegian translations for status
  const statusLabels = {
    active: "Aktiv",
    paused: "Pauset",
    ended: "Avsluttet",
  };

  // Norwegian platform names
  const platformLabels = {
    google: "Google",
    facebook: "Facebook",
  };

  // Function to get platform-specific styles
  const getPlatformStyles = (platform: "google" | "facebook") => {
    return {
      bgColor:
        platform === "google"
          ? "bg-[hsl(var(--chart-1)_/_0.1)]"
          : "bg-[hsl(var(--chart-2)_/_0.1)]",
      textColor:
        platform === "google"
          ? "text-[hsl(var(--chart-1))]"
          : "text-[hsl(var(--chart-2))]",
      borderColor:
        platform === "google"
          ? "border-[hsl(var(--chart-1)_/_0.2)]"
          : "border-[hsl(var(--chart-2)_/_0.2)]",
      icon:
        platform === "google" ? (
          <GoogleCircleFilled className="h-4 w-4 text-[hsl(var(--chart-1))]" />
        ) : (
          <Facebook className="h-4 w-4 text-[hsl(var(--chart-2))]" />
        ),
    };
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <CardTitle>Annonsemateriell</CardTitle>
            <CardDescription>
              {platform === "all"
                ? "Alle"
                : platform === "google"
                ? "Google"
                : "Facebook"}{" "}
              annonser fra kampanjene dine
            </CardDescription>
          </div>
          <Tabs
            value={platform}
            onValueChange={(value) => setPlatform(value as any)}
            className="w-fit"
          >
            <TabsList>
              <TabsTrigger value="all">Alle</TabsTrigger>
              <TabsTrigger value="google" className="flex items-center gap-1">
                <GoogleCircleFilled className="h-3 w-3 text-[hsl(var(--chart-1))]" />
                Google
              </TabsTrigger>
              <TabsTrigger value="facebook" className="flex items-center gap-1">
                <Facebook className="h-3 w-3 text-[hsl(var(--chart-2))]" />
                Facebook
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allCreatives.map((creative) => {
            const { bgColor, textColor, borderColor, icon } = getPlatformStyles(
              creative.platform
            );

            return (
              <div
                key={creative.id}
                className={`overflow-hidden rounded-lg border ${borderColor} ${bgColor} bg-opacity-30`}
              >
                {/* Mock creative image */}
                <div className="aspect-video w-full bg-gray-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-muted-foreground">
                      Forhåndsvisning av annonse
                    </span>
                  </div>
                  <div className="absolute left-2 top-2">
                    <Badge
                      variant="outline"
                      className={`${textColor} ${bgColor} border-0`}
                    >
                      {icon}
                      <span className="ml-1">
                        {platformLabels[creative.platform]}
                      </span>
                    </Badge>
                  </div>
                  <div className="absolute right-2 top-2">
                    <Badge
                      variant={
                        creative.status === "active" ? "default" : "secondary"
                      }
                    >
                      {statusLabels[creative.status]}
                    </Badge>
                  </div>
                </div>

                {/* Creative details */}
                <div className="p-4">
                  <h3 className="mb-1 line-clamp-1 font-semibold">
                    {creative.headline}
                  </h3>
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                    {creative.description}
                  </p>

                  <div className="mb-3 grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">
                        CTR: {creative.metrics.ctr}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">
                        Konv: {creative.metrics.conversions}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">
                        KPK:{" "}
                        {formatCurrency(creative.metrics.costPerConversion)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">
                        ROAS: {creative.metrics.roas}x
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">
                      {creative.campaignName}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 px-2 text-xs"
                    >
                      Vis <ExternalLinkIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {allCreatives.length === 0 && (
            <div className="col-span-full flex h-40 items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">
                Ingen annonser funnet for den valgte plattformen
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
