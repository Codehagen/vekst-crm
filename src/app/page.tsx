import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { CustomerStage } from "@prisma/client";
import {
  Building2,
  Users,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Activity,
} from "lucide-react";

// Make the homepage a server component to fetch data
export default async function Homepage() {
  // Fetch counts for different business stages
  const leadsCount = await prisma.business.count({
    where: { stage: CustomerStage.lead },
  });

  const prospectsCount = await prisma.business.count({
    where: { stage: CustomerStage.prospect },
  });

  const qualifiedCount = await prisma.business.count({
    where: { stage: CustomerStage.qualified },
  });

  const customersCount = await prisma.business.count({
    where: { stage: CustomerStage.customer },
  });

  // Get the most recent leads
  const recentLeads = await prisma.business.findMany({
    where: {
      stage: {
        in: [
          CustomerStage.lead,
          CustomerStage.prospect,
          CustomerStage.qualified,
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get potential value sum
  const potentialValueResult = await prisma.business.aggregate({
    where: {
      stage: {
        in: [
          CustomerStage.lead,
          CustomerStage.prospect,
          CustomerStage.qualified,
        ],
      },
      potensiellVerdi: { not: null },
    },
    _sum: {
      potensiellVerdi: true,
    },
  });

  const totalPotentialValue = potentialValueResult._sum.potensiellVerdi || 0;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">CRM System</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">CRM Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Oversikt over din pipeline og aktiviteter
            </p>
          </div>

          {/* Main metric cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Nye Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leadsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Leads som ennå ikke er kontaktet
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">I Dialog</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {prospectsCount + qualifiedCount}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {prospectsCount} Kontaktet
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {qualifiedCount} Kvalifisert
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Kunder</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customersCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aktive kunder
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Potensiell Verdi
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("no-NO", {
                    style: "currency",
                    currency: "NOK",
                    maximumFractionDigits: 0,
                  }).format(totalPotentialValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total potensiell verdi i pipeline
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pipeline and Recent Leads */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pipeline Overview */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Pipeline Status
                </CardTitle>
                <CardDescription>
                  Oversikt over leads i ulike stadier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-sm font-medium">Nye leads</div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-300 h-full"
                        style={{
                          width: `${
                            (leadsCount /
                              Math.max(
                                1,
                                leadsCount +
                                  prospectsCount +
                                  qualifiedCount +
                                  customersCount
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="w-8 text-right text-sm">{leadsCount}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-24 text-sm font-medium">Kontaktet</div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-300 h-full"
                        style={{
                          width: `${
                            (prospectsCount /
                              Math.max(
                                1,
                                leadsCount +
                                  prospectsCount +
                                  qualifiedCount +
                                  customersCount
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="w-8 text-right text-sm">
                      {prospectsCount}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-24 text-sm font-medium">Kvalifisert</div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-300 h-full"
                        style={{
                          width: `${
                            (qualifiedCount /
                              Math.max(
                                1,
                                leadsCount +
                                  prospectsCount +
                                  qualifiedCount +
                                  customersCount
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="w-8 text-right text-sm">
                      {qualifiedCount}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-24 text-sm font-medium">Kunder</div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="bg-green-300 h-full"
                        style={{
                          width: `${
                            (customersCount /
                              Math.max(
                                1,
                                leadsCount +
                                  prospectsCount +
                                  qualifiedCount +
                                  customersCount
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="w-8 text-right text-sm">
                      {customersCount}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Link href="/leads">
                    <Button variant="outline" className="w-full">
                      <span>Se alle leads</span>
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Leads */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Siste Leads</CardTitle>
                <CardDescription>
                  Nylig registrerte leads i systemet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentLeads.length > 0 ? (
                    recentLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-start space-x-3 border-b pb-3 last:border-0"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{lead.name}</p>
                            <Badge
                              variant={
                                lead.stage === "lead"
                                  ? "secondary"
                                  : lead.stage === "prospect"
                                  ? "default"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {lead.stage === "lead"
                                ? "Ny"
                                : lead.stage === "prospect"
                                ? "Kontaktet"
                                : "Kvalifisert"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {lead.contactPerson || lead.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Registrert:{" "}
                            {new Date(lead.createdAt).toLocaleDateString(
                              "no-NO"
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Ingen nye leads funnet
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <Link href="/leads/new">
                    <Button disabled className="w-full">
                      <span>Opprett ny lead</span>
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
