import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  ChevronLeft,
  Building2,
  Phone,
  Mail,
  CalendarClock,
  CreditCard,
  AlertCircle,
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

import { Business, ChurnRiskLevel } from "@prisma/client";
import { getCustomerById } from "@/app/actions/customers/actions";
import { formatCurrency } from "@/lib/utils";
import { CustomerTabs } from "@/components/customer/customer-tabs";

interface CustomerDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function CustomerDetailsPage({
  params,
}: CustomerDetailsPageProps) {
  const customerId = params.id;
  const customer = await getCustomerById(customerId);

  if (!customer) {
    return notFound();
  }

  const getRiskBadge = (risk: ChurnRiskLevel | null) => {
    if (!risk) return null;

    const riskBadges: Record<
      string,
      {
        label: string;
        variant:
          | "default"
          | "outline"
          | "secondary"
          | "destructive"
          | "success";
      }
    > = {
      low: { label: "Lav churn risiko", variant: "success" },
      medium: { label: "Medium churn risiko", variant: "secondary" },
      high: { label: "Høy churn risiko", variant: "default" },
      critical: { label: "Kritisk churn risiko", variant: "destructive" },
    };

    const { label, variant } = riskBadges[risk] || {
      label: risk,
      variant: "outline",
    };

    return (
      <Badge variant={variant as any} className="ml-2">
        {label}
      </Badge>
    );
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("nb-NO");
  };

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Customers", href: "/customers" },
          { label: customer.name || "Kunde detaljer", isCurrentPage: true },
        ]}
      />

      <main className="p-6">
        <div className="mb-6">
          <Link href="/customers">
            <Button variant="outline" size="sm" className="mb-4">
              <ChevronLeft className="mr-2 h-4 w-4" /> Tilbake til kunder
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center">
                {customer.name}
                {getRiskBadge(customer.churnRisk)}
              </h1>
              <p className="text-muted-foreground mt-2">
                Kunde siden {formatDate(customer.customerSince)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Rediger</Button>
              <Button>Send SMS</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Customer Information */}
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
                <p className="font-medium">{customer.contactPerson || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {customer.phone}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-post</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {customer.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Adresse</p>
                <p className="font-medium">
                  {customer.address ? (
                    <>
                      {customer.address}
                      <br />
                      {customer.postalCode} {customer.city}
                      {customer.country ? `, ${customer.country}` : ""}
                    </>
                  ) : (
                    "-"
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contract Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Kontraktinformasjon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Kontrakttype</p>
                <p className="font-medium">{customer.contractType || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kontraktverdi</p>
                <p className="font-medium">
                  {customer.contractValue
                    ? formatCurrency(customer.contractValue, "NOK")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Betalingsvilkår</p>
                <p className="font-medium">{customer.paymentTerms || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fornyes</p>
                <p className="font-medium flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  {formatDate(customer.contractRenewalDate)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Tilleggsinformasjon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Kundesegment</p>
                <p className="font-medium">{customer.customerSegment || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Org. nummer</p>
                <p className="font-medium">{customer.orgNumber || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NPS Score</p>
                <p className="font-medium">
                  {customer.npsScore !== null ? customer.npsScore : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Sist gjennomgått
                </p>
                <p className="font-medium">
                  {formatDate(customer.lastReviewDate)}
                </p>
              </div>
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
          <CustomerTabs customer={customer} />
        </Suspense>
      </main>
    </>
  );
}
