import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  ChevronLeft,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  BarChart3,
  Users,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

import { Business, CustomerStage } from "@prisma/client";
import { getBusinessById } from "@/app/actions/businesses/actions";
import { BusinessTabs } from "@/components/business/business-tabs";

interface BusinessDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function BusinessDetailsPage({
  params,
}: BusinessDetailsPageProps) {
  // Ensure params is properly handled
  const { id } = params;
  const business = await getBusinessById(id);

  if (!business) {
    return notFound();
  }

  // Function to get the stage badge
  const getStageBadge = (stage: CustomerStage) => {
    const stageConfig: Record<
      CustomerStage,
      {
        label: string;
        variant: "default" | "outline" | "secondary" | "destructive";
      }
    > = {
      lead: { label: "Lead", variant: "outline" },
      prospect: { label: "Prospekt", variant: "secondary" },
      qualified: { label: "Kvalifisert", variant: "secondary" },
      offer_sent: { label: "Tilbud sendt", variant: "default" },
      offer_accepted: { label: "Tilbud akseptert", variant: "default" },
      declined: { label: "Avslått", variant: "destructive" },
      customer: { label: "Kunde", variant: "default" },
      churned: { label: "Tapt", variant: "destructive" },
    };

    const config = stageConfig[stage];
    return (
      <Badge variant={config.variant} className="ml-2">
        {config.label}
      </Badge>
    );
  };

  // Find primary contact if exists
  const primaryContact = business.contacts.find((contact) => contact.isPrimary);

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Bedrifter", href: "/businesses" },
          { label: business.name || "Bedriftsdetaljer", isCurrentPage: true },
        ]}
      />

      <main className="p-6">
        <div className="mb-6">
          <Link href="/businesses">
            <Button variant="outline" size="sm" className="mb-4">
              <ChevronLeft className="mr-2 h-4 w-4" /> Tilbake til bedrifter
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center">
                {business.name}
                {getStageBadge(business.stage)}
              </h1>
              <p className="text-muted-foreground mt-2">
                {business.industry || "Ingen bransje spesifisert"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Rediger</Button>
              <Button>Send SMS</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Kontaktinformasjon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Kontaktperson</p>
                <p className="font-medium">{business.contactPerson || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {business.phone}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-post</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {business.email}
                </p>
              </div>
              {business.website && (
                <div>
                  <p className="text-sm text-muted-foreground">Nettside</p>
                  <p className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <a
                      href={
                        business.website.startsWith("http")
                          ? business.website
                          : `https://${business.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {business.website}
                    </a>
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Adresse</p>
                <p className="font-medium flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1" />
                  {business.address ? (
                    <span>
                      {business.address}
                      <br />
                      {business.postalCode} {business.city}
                      {business.country ? `, ${business.country}` : ""}
                    </span>
                  ) : (
                    "-"
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleDollarSign className="h-5 w-5" />
                Bedriftsdetaljer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Organisasjonsnummer
                </p>
                <p className="font-medium">{business.orgNumber || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bransje</p>
                <p className="font-medium">{business.industry || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Antall ansatte</p>
                <p className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {business.numberOfEmployees || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Omsetning</p>
                <p className="font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {business.revenue
                    ? new Intl.NumberFormat("nb-NO", {
                        style: "currency",
                        currency: "NOK",
                      }).format(business.revenue)
                    : "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Primary Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Primær kontakt
              </CardTitle>
            </CardHeader>
            <CardContent>
              {primaryContact ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Navn</p>
                    <p className="font-medium">{primaryContact.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stilling</p>
                    <p className="font-medium">
                      {primaryContact.position || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">E-post</p>
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a
                        href={`mailto:${primaryContact.email}`}
                        className="text-primary hover:underline"
                      >
                        {primaryContact.email}
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <a
                        href={`tel:${primaryContact.phone}`}
                        className="text-primary hover:underline"
                      >
                        {primaryContact.phone}
                      </a>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-muted-foreground">
                    Ingen primær kontakt tildelt
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href={`/businesses/${id}?tab=contacts`}>
                      Legg til kontakt
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Contacts, Activities, SMS, etc. */}
        <Suspense
          fallback={
            <div className="mt-6">
              <Skeleton className="h-[300px] w-full" />
            </div>
          }
        >
          <BusinessTabs business={business} />
        </Suspense>
      </main>
    </>
  );
}
