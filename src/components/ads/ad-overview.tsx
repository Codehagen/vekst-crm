import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon, HelpCircleIcon } from "lucide-react";
import { Facebook, GoogleCircleFilled } from "@/components/icons";

interface AdOverviewProps {
  data: {
    google: {
      impressions: number;
      clicks: number;
      ctr: number;
      spend: number;
      conversions: number;
      costPerConversion: number;
      roas: number;
    };
    facebook: {
      impressions: number;
      clicks: number;
      ctr: number;
      spend: number;
      conversions: number;
      costPerConversion: number;
      roas: number;
    };
  };
}

export function AdOverview({ data }: AdOverviewProps) {
  // Calculate totals across platforms
  const totalImpressions = data.google.impressions + data.facebook.impressions;
  const totalClicks = data.google.clicks + data.facebook.clicks;
  const totalCtr =
    totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const totalSpend = data.google.spend + data.facebook.spend;
  const totalConversions = data.google.conversions + data.facebook.conversions;
  const totalCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const totalCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;

  // Mock previous period performance (would come from real data)
  const prevPeriodCpa = totalCpa * 1.15; // 15% worse before
  const isCpaImproved = prevPeriodCpa > totalCpa;
  const cpaChangePercent = Math.abs(
    ((totalCpa - prevPeriodCpa) / prevPeriodCpa) * 100
  ).toFixed(1);

  const prevPeriodConversions = totalConversions * 0.85; // 15% better now
  const isConvImproved = prevPeriodConversions < totalConversions;
  const convChangePercent = Math.abs(
    ((totalConversions - prevPeriodConversions) / prevPeriodConversions) * 100
  ).toFixed(1);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Visninger
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircleIcon className="ml-1 inline h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Antall ganger annonsene dine ble vist
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <GoogleCircleFilled className="h-4 w-4 text-[hsl(var(--chart-1))]" />
            <Facebook className="h-4 w-4 text-[hsl(var(--chart-2))]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCompactNumber(totalImpressions)}
          </div>
          <p className="text-xs text-muted-foreground">
            Google: {formatCompactNumber(data.google.impressions)} / Facebook:{" "}
            {formatCompactNumber(data.facebook.impressions)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Forbruk
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircleIcon className="ml-1 inline h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Totalt beløp brukt på tvers av plattformer
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <GoogleCircleFilled className="h-4 w-4 text-[hsl(var(--chart-1))]" />
            <Facebook className="h-4 w-4 text-[hsl(var(--chart-2))]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
          <p className="text-xs text-muted-foreground">
            Google: {formatCurrency(data.google.spend)} / Facebook:{" "}
            {formatCurrency(data.facebook.spend)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Konverteringer
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircleIcon className="ml-1 inline h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Antall fullførte målhandlinger fra annonser
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <GoogleCircleFilled className="h-4 w-4 text-[hsl(var(--chart-1))]" />
            <Facebook className="h-4 w-4 text-[hsl(var(--chart-2))]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">{totalConversions}</div>
            <div
              className={`ml-2 flex items-center text-xs ${
                isConvImproved ? "text-green-500" : "text-destructive"
              }`}
            >
              {isConvImproved ? (
                <ArrowUpIcon className="h-3 w-3" />
              ) : (
                <ArrowDownIcon className="h-3 w-3" />
              )}
              {convChangePercent}%
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Google: {data.google.conversions} / Facebook:{" "}
            {data.facebook.conversions}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Kostnad per konvertering
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircleIcon className="ml-1 inline h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Gjennomsnittlig kostnad for å anskaffe en konvertering
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <GoogleCircleFilled className="h-4 w-4 text-[hsl(var(--chart-1))]" />
            <Facebook className="h-4 w-4 text-[hsl(var(--chart-2))]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <div className="text-2xl font-bold">{formatCurrency(totalCpa)}</div>
            <div
              className={`ml-2 flex items-center text-xs ${
                isCpaImproved ? "text-green-500" : "text-destructive"
              }`}
            >
              {isCpaImproved ? (
                <ArrowDownIcon className="h-3 w-3" />
              ) : (
                <ArrowUpIcon className="h-3 w-3" />
              )}
              {cpaChangePercent}%
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Google: {formatCurrency(data.google.costPerConversion)} / FB:{" "}
            {formatCurrency(data.facebook.costPerConversion)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
