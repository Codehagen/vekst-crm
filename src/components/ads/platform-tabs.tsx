"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleCircleFilled, Facebook } from "@/components/icons";

export function PlatformTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPlatform = searchParams.get("platform") || "all";

  const handleTabChange = (value: string) => {
    // Create new URLSearchParams with the current search parameters
    const params = new URLSearchParams(searchParams.toString());

    // Update or add the platform parameter
    params.set("platform", value);

    // Navigate to the new URL with updated parameters
    router.push(`/ads?${params.toString()}`);
  };

  return (
    <Tabs
      defaultValue={currentPlatform}
      onValueChange={handleTabChange}
      className="w-fit"
    >
      <TabsList>
        <TabsTrigger value="all" className="px-4">
          Alle plattformer
        </TabsTrigger>
        <TabsTrigger value="google" className="px-4">
          <GoogleCircleFilled className="mr-2 h-4 w-4 text-[hsl(var(--chart-1))]" />
          Google Ads
        </TabsTrigger>
        <TabsTrigger value="facebook" className="px-4">
          <Facebook className="mr-2 h-4 w-4 text-[hsl(var(--chart-2))]" />
          Facebook Ads
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
