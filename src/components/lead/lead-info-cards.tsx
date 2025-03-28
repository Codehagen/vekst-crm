"use client";

import { Business, CustomerStage } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Info,
  Building,
  MapPin,
  Globe,
  BarChart3,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadInfoCardsProps {
  lead: Business;
  statusProps: {
    label: string;
    variant: "default" | "outline" | "secondary" | "destructive" | "success";
    icon: React.ReactNode;
    description: string;
  };
  onStatusDialogOpen: () => void;
}

export function LeadInfoCards({
  lead,
  statusProps,
  onStatusDialogOpen,
}: LeadInfoCardsProps) {
  // Calculate days since creation for the progress bar
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate progress for visual indicators
  const daysSincePercentage = Math.min((daysSinceCreation / 30) * 100, 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
      {/* Contact info card - Larger card spanning 2 columns on larger screens */}
      <Card className="bg-gradient-to-br from-blue-50 to-slate-50 border-blue-100 shadow-sm hover:shadow-md transition-all duration-200 xl:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
            <Mail className="h-4 w-4 mr-2 text-blue-600" />
            Kontaktinformasjon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            <div className="space-y-2">
              {lead.contactPerson && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    {lead.contactPerson}
                  </span>
                </div>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="text-sm font-medium text-primary hover:underline flex items-center gap-2 group"
                >
                  <Mail className="h-4 w-4 text-blue-600 group-hover:text-primary transition-colors" />
                  <span className="truncate">{lead.email}</span>
                </a>
              )}
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="text-sm hover:underline flex items-center gap-2 group"
                >
                  <Phone className="h-4 w-4 text-blue-600 group-hover:text-primary transition-colors" />
                  <span>{lead.phone}</span>
                </a>
              )}
            </div>
            <div className="space-y-2 mt-2 sm:mt-0">
              {lead.website && (
                <a
                  href={
                    lead.website.startsWith("http")
                      ? lead.website
                      : `https://${lead.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline flex items-center gap-2 group"
                >
                  <Globe className="h-4 w-4 text-blue-600 group-hover:text-primary transition-colors" />
                  <span className="truncate">
                    {lead.website.replace(/^https?:\/\//, "")}
                  </span>
                </a>
              )}
              {(lead.address || lead.postalCode || lead.city) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    {lead.address && <div>{lead.address}</div>}
                    {(lead.postalCode || lead.city) && (
                      <div>
                        {[lead.postalCode, lead.city]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial card */}
      <Card className="bg-gradient-to-br from-amber-50 to-slate-50 border-amber-100 shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-amber-800 flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-amber-600" />
            Potensiell verdi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col h-full justify-between">
            <p className="text-2xl font-bold tracking-tight text-amber-900">
              {lead.potensiellVerdi
                ? new Intl.NumberFormat("no-NO", {
                    style: "currency",
                    currency: "NOK",
                    maximumFractionDigits: 0,
                  }).format(lead.potensiellVerdi)
                : "Ikke angitt"}
            </p>

            {lead.industry && (
              <div className="mt-3 flex items-center text-xs text-muted-foreground">
                <Building className="h-3.5 w-3.5 mr-1.5" />
                <span>Bransje: {lead.industry}</span>
              </div>
            )}

            {lead.numberOfEmployees && (
              <div className="mt-1 flex items-center text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5 mr-1.5" />
                <span>Ansatte: {lead.numberOfEmployees}</span>
              </div>
            )}

            {lead.revenue && (
              <div className="mt-1 flex items-center text-xs text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                <span>
                  Omsetning:{" "}
                  {new Intl.NumberFormat("no-NO", {
                    style: "currency",
                    currency: "NOK",
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(lead.revenue)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time card */}
      <Card className="bg-gradient-to-br from-green-50 to-slate-50 border-green-100 shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-800 flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-green-600" />
            Tidslinje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium">Registrert</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(lead.createdAt).toLocaleDateString("no-NO")}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${daysSincePercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {daysSinceCreation} dager siden
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium">Sist oppdatert</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(lead.updatedAt).toLocaleDateString("no-NO")}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.floor(
                  (Date.now() - new Date(lead.updatedAt).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                dager siden
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status card */}
      <Card
        className={cn(
          "shadow-sm hover:shadow-md transition-all duration-200",
          statusProps.variant === "success"
            ? "bg-gradient-to-br from-green-50 to-slate-50 border-green-100"
            : statusProps.variant === "destructive"
            ? "bg-gradient-to-br from-red-50 to-slate-50 border-red-100"
            : statusProps.variant === "secondary"
            ? "bg-gradient-to-br from-slate-100 to-slate-50 border-slate-200"
            : "bg-gradient-to-br from-blue-50 to-slate-50 border-blue-100"
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle
            className={cn(
              "text-sm font-medium flex items-center",
              statusProps.variant === "success"
                ? "text-green-800"
                : statusProps.variant === "destructive"
                ? "text-red-800"
                : statusProps.variant === "secondary"
                ? "text-slate-800"
                : "text-blue-800"
            )}
          >
            <Info
              className={cn(
                "h-4 w-4 mr-2",
                statusProps.variant === "success"
                  ? "text-green-600"
                  : statusProps.variant === "destructive"
                  ? "text-red-600"
                  : statusProps.variant === "secondary"
                  ? "text-slate-600"
                  : "text-blue-600"
              )}
            />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge
                variant={statusProps.variant}
                className="flex items-center gap-1 px-2.5 py-1"
              >
                {statusProps.icon}
                {statusProps.label}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs border-0 hover:bg-white/80"
                onClick={onStatusDialogOpen}
              >
                Endre
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {statusProps.description}
            </p>

            {/* Notes preview if available */}
            {lead.notes && (
              <div className="pt-2 mt-2 border-t">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Notater:
                </p>
                <p className="text-xs line-clamp-3">{lead.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
