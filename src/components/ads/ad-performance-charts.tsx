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
import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import { BarChart } from "@/components/charts/BarChart";
import type { AvailableChartColorsKeys } from "@/lib/chartUtils";

interface TimeseriesDataPoint {
  date: string;
  google: {
    clicks: number;
    impressions: number;
    spend: number;
  };
  facebook: {
    clicks: number;
    impressions: number;
    spend: number;
  };
}

interface AdPerformanceChartsProps {
  data: TimeseriesDataPoint[];
}

export function AdPerformanceCharts({ data }: AdPerformanceChartsProps) {
  const [metric, setMetric] = useState<"clicks" | "impressions" | "spend">(
    "clicks"
  );

  // Calculate platform totals for the selected metric
  const googleTotal = data.reduce((sum, item) => sum + item.google[metric], 0);
  const facebookTotal = data.reduce(
    (sum, item) => sum + item.facebook[metric],
    0
  );

  // Format the totals based on metric type
  const formatter = metric === "spend" ? formatCurrency : formatCompactNumber;

  // Norwegian metric names
  const metricNames = {
    clicks: "Klikk",
    impressions: "Visninger",
    spend: "Forbruk",
  };

  // Format data for time series chart
  const chartData = data.slice(0, 14).map((item: TimeseriesDataPoint) => ({
    date: new Date(item.date).toLocaleDateString("nb-NO", {
      month: "short",
      day: "numeric",
    }),
    Google: item.google[metric],
    Facebook: item.facebook[metric],
  }));

  // Use colors from the available chart colors
  const googleColor: AvailableChartColorsKeys = "blue";
  const facebookColor: AvailableChartColorsKeys = "cyan";

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <CardTitle>Ytelsestrender</CardTitle>
            <CardDescription>
              Sammenlign ytelsesmetrikk på tvers av plattformer over tid
            </CardDescription>
          </div>
          <Tabs
            defaultValue="clicks"
            onValueChange={(value) => setMetric(value as any)}
          >
            <TabsList>
              <TabsTrigger value="clicks">Klikk</TabsTrigger>
              <TabsTrigger value="impressions">Visninger</TabsTrigger>
              <TabsTrigger value="spend">Forbruk</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="px-2">
        <BarChart
          data={chartData}
          index="date"
          categories={["Google", "Facebook"]}
          colors={[googleColor, facebookColor]}
          valueFormatter={formatter}
          showYAxis
          yAxisWidth={60}
          showXAxis
          showLegend
          showTooltip
          showGridLines
          legendPosition="right"
          xAxisLabel={`${metricNames[metric]} over tid`}
        />
      </CardContent>
    </Card>
  );
}
