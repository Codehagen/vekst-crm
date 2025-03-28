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
import { GoogleCircleFilled, Facebook } from "@/components/icons";
import { BarList } from "@/components/charts/BarList";

// Define interface for AudienceInsight since we can't access the actual import
interface AudienceInsightData {
  label: string;
  value: number;
}

interface AudienceInsight {
  type: string;
  data: AudienceInsightData[];
}

interface AudienceInsightsProps {
  data: {
    google: AudienceInsight[];
    facebook: AudienceInsight[];
  };
}

export function AudienceInsights({ data }: AudienceInsightsProps) {
  const [platform, setPlatform] = useState<"google" | "facebook">("google");
  const [insightType, setInsightType] = useState<"age" | "device">("age");

  // Get the selected insight data
  const insightData =
    data[platform].find((insight) => insight.type === insightType)?.data || [];

  // Norwegian labels for insights
  const typeLabels = {
    age: "Alder",
    device: "Enhet",
  };

  // Norwegian platform names
  const platformLabels = {
    google: "Google",
    facebook: "Facebook",
  };

  // Norwegian translations for key takeaways
  const keyTakeaways = {
    google: {
      age: "Primærmålgruppen er 25-44 år, som utgjør 60% av engasjementet.",
      device:
        "Mobile enheter dominerer med 62%, vurder optimalisering for mobilopplevelsen.",
    },
    facebook: {
      age: "Facebook-publikummet er yngre, med 25-34 som det sterkeste segmentet.",
      device:
        "78% av Facebook-brukerne får tilgang via mobil, noe som krever mobilfokusert kreativt innhold.",
    },
  };

  // Format data for BarList
  const barListData = insightData.map((item: AudienceInsightData) => ({
    name: item.label,
    value: item.value,
  }));

  // Platform-specific styling
  const platformColorClass =
    platform === "google"
      ? "bg-[hsl(var(--chart-1)_/_0.2)] dark:bg-[hsl(var(--chart-1)_/_0.3)]"
      : "bg-[hsl(var(--chart-2)_/_0.2)] dark:bg-[hsl(var(--chart-2)_/_0.3)]";

  // Handler for bar clicks
  const handleBarClick = (item: { name: string; value: number }) => {
    console.log(`Selected: ${item.name} with value ${item.value}%`);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col space-y-2">
          <CardTitle>Publikumsinnsikt</CardTitle>
          <CardDescription>Demografisk og enhetsfordeling</CardDescription>
        </div>
        <div className="mt-4 flex justify-between">
          <Tabs
            value={platform}
            onValueChange={(value) =>
              setPlatform(value as "google" | "facebook")
            }
            className="w-fit"
          >
            <TabsList>
              <TabsTrigger
                value="google"
                className="flex items-center gap-1 px-3"
              >
                <GoogleCircleFilled className="h-3 w-3 text-[hsl(var(--chart-1))]" />
                Google
              </TabsTrigger>
              <TabsTrigger
                value="facebook"
                className="flex items-center gap-1 px-3"
              >
                <Facebook className="h-3 w-3 text-[hsl(var(--chart-2))]" />
                Facebook
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs
            value={insightType}
            onValueChange={(value) => setInsightType(value as "age" | "device")}
            className="w-fit"
          >
            <TabsList>
              <TabsTrigger value="age" className="px-3">
                Alder
              </TabsTrigger>
              <TabsTrigger value="device" className="px-3">
                Enhet
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="py-2">
          <BarList
            data={barListData}
            valueFormatter={(value) => `${value}%`}
            barColor={platformColorClass}
            onValueChange={handleBarClick}
          />
        </div>

        <div className="mt-4 rounded-md bg-muted p-2">
          <h4 className="mb-1 text-sm font-medium">Viktig innsikt</h4>
          <p className="text-xs text-muted-foreground">
            {keyTakeaways[platform][insightType]}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
