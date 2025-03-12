"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  PencilLine,
  ChevronRight,
  DollarSign,
  Tag,
  FileText,
  Plus,
  ExternalLink,
  Clock,
  Search,
  Info,
  CheckCircle,
  Globe,
  MoveUp,
  ArrowUpCircle,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import lead actions
import { getLeadById, updateLeadStatus } from "../actions";
import { Business, CustomerStage } from "@prisma/client";
import { CreateOffer } from "./create-offer";
import { SendSmsDialog } from "./send-sms-dialog";
import { LeadActivity } from "./lead-activity";
import { LeadNotes } from "./lead-notes";
import { LeadOffers } from "./lead-offers";
import { LeadProffInfo } from "./lead-proff-info";

function getStatusBadgeProps(stage: CustomerStage) {
  const stageMap: Record<
    CustomerStage,
    {
      label: string;
      variant: "default" | "outline" | "secondary" | "destructive" | "success";
      icon: React.ReactNode;
      description: string;
    }
  > = {
    lead: {
      label: "Ny",
      variant: "secondary",
      icon: <Info className="h-4 w-4" />,
      description: "Ny lead som ikke er kontaktet",
    },
    prospect: {
      label: "Kontaktet",
      variant: "default",
      icon: <Clock className="h-4 w-4" />,
      description: "Lead som er i dialog",
    },
    qualified: {
      label: "Kvalifisert",
      variant: "default",
      icon: <CheckCircle className="h-4 w-4" />,
      description: "Kvalifisert lead klar for tilbud",
    },
    customer: {
      label: "Kunde",
      variant: "success",
      icon: <ArrowUpCircle className="h-4 w-4" />,
      description: "Konvertert til aktiv kunde",
    },
    churned: {
      label: "Tapt",
      variant: "destructive",
      icon: <AlertCircle className="h-4 w-4" />,
      description: "Tapt lead",
    },
  };

  return stageMap[stage];
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState<boolean>(true);
  const [lead, setLead] = useState<Business | null>(null);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [showStageDialog, setShowStageDialog] = useState(false);
  const [isChangingStage, setIsChangingStage] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const leadData = await getLeadById(id);
        if (leadData) {
          setLead(leadData);
        } else {
          toast.error("Lead ikke funnet");
        }
      } catch (error) {
        console.error("Error fetching lead data:", error);
        toast.error("Kunne ikke hente lead-informasjon");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Handle offer creation
  const handleOfferSubmit = (offer: any) => {
    // In a real implementation, this would save to the database
    toast.success("Tilbudet ble lagret (Simulert)");
    setShowCreateOffer(false);
  };

  // Handle lead stage update
  const handleStageChange = async (newStage: CustomerStage) => {
    if (!lead) return;

    const oldStage = lead.stage;
    if (oldStage === newStage) {
      setShowStageDialog(false);
      return;
    }

    try {
      setIsChangingStage(true);

      // Optimistic update
      setLead((prev) => (prev ? { ...prev, stage: newStage } : null));

      // Update in database
      await updateLeadStatus(lead.id, newStage);

      toast.success(
        <div className="flex flex-col gap-1">
          <div className="font-medium">Status oppdatert</div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{lead.name}</span> ble flyttet fra{" "}
            <Badge variant="outline" className="ml-1 mr-1">
              {getStatusBadgeProps(oldStage).label}
            </Badge>
            <span>→</span>
            <Badge variant="outline" className="ml-1">
              {getStatusBadgeProps(newStage).label}
            </Badge>
          </div>
        </div>
      );

      // Redirect to customers page if stage is 'customer'
      if (newStage === "customer") {
        toast.success("Lead er nå konvertert til kunde!", {
          description: "Du blir videresendt til kundeoversikten...",
          duration: 3000,
        });
        setTimeout(() => {
          router.push("/bedrifter");
        }, 2000);
      }
    } catch (error) {
      // Revert on error
      setLead((prev) => (prev ? { ...prev, stage: oldStage } : null));
      console.error("Error updating lead stage:", error);
      toast.error("Kunne ikke oppdatere statusen");
    } finally {
      setIsChangingStage(false);
      setShowStageDialog(false);
    }
  };

  if (loading) {
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
                    <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/leads">Leads</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      <Skeleton className="h-4 w-24" />
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <main className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-60" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>

              <Skeleton className="h-[400px] w-full" />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!lead) {
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
                    <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/leads">Leads</BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <main className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Fant ikke lead</h1>
            <p className="text-muted-foreground mb-6">
              Lead med ID {id} ble ikke funnet
            </p>
            <Button asChild>
              <a href="/leads">Tilbake til leads</a>
            </Button>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // If we have a lead, render the lead details
  const statusProps = getStatusBadgeProps(lead.stage);

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
                  <BreadcrumbLink href="/leads">Leads</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{lead.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="p-6">
          <div className="space-y-6">
            {/* Lead Header */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      {lead.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-muted-foreground mt-1">
                      <span>{lead.contactPerson || lead.name}</span>
                      <span>•</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant={
                                statusProps.variant as
                                  | "default"
                                  | "destructive"
                                  | "outline"
                                  | "secondary"
                                  | null
                              }
                              className="flex items-center gap-1 cursor-help"
                            >
                              {statusProps.icon}
                              {statusProps.label}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{statusProps.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {lead.orgNumber && (
                        <>
                          <span>•</span>
                          <span>
                            Org.nr:
                            <a
                              href={`https://proff.no/bransjesøk?q=${lead.orgNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline ml-1"
                            >
                              {lead.orgNumber}
                            </a>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <SendSmsDialog
                    lead={lead}
                    trigger={
                      <Button variant="outline" className="gap-2">
                        <MessageSquare className="h-4 w-4" /> Send SMS
                      </Button>
                    }
                  />

                  <Button variant="outline" disabled className="gap-2">
                    <PencilLine className="h-4 w-4" /> Rediger
                  </Button>

                  <Dialog
                    open={showStageDialog}
                    onOpenChange={setShowStageDialog}
                  >
                    <DialogTrigger asChild>
                      <Button variant="default" disabled className="gap-2">
                        <MoveUp className="h-4 w-4" /> Endre status
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Endre status for {lead.name}</DialogTitle>
                        <DialogDescription>
                          Velg ny status for denne leaden. Dette vil oppdatere
                          oppfølgningsstatus.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        {Object.entries(getStatusBadgeProps).length > 0 &&
                          Object.entries(CustomerStage).map(([key, stage]) => (
                            <Button
                              key={key}
                              variant={
                                stage === lead.stage ? "secondary" : "outline"
                              }
                              className="justify-start gap-2 h-auto py-3"
                              disabled={isChangingStage}
                              onClick={() => handleStageChange(stage)}
                            >
                              {getStatusBadgeProps(stage).icon}
                              <div className="flex flex-col items-start">
                                <span>{getStatusBadgeProps(stage).label}</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                  {getStatusBadgeProps(stage).description}
                                </span>
                              </div>
                              {stage === lead.stage && (
                                <CheckCircle className="h-4 w-4 ml-auto" />
                              )}
                            </Button>
                          ))}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="ghost"
                          onClick={() => setShowStageDialog(false)}
                          disabled={isChangingStage}
                        >
                          Avbryt
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Quick Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <Card className="bg-blue-50/50 border-blue-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Kontaktinfo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </a>
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-sm hover:underline flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-amber-50/50 border-amber-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Potensiell verdi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-semibold">
                      {lead.potensiellVerdi
                        ? new Intl.NumberFormat("no-NO", {
                            style: "currency",
                            currency: "NOK",
                            maximumFractionDigits: 0,
                          }).format(lead.potensiellVerdi)
                        : "Ikke angitt"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-green-50/50 border-green-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Registrert dato
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">
                      {new Date(lead.createdAt).toLocaleDateString("no-NO")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {`${Math.floor(
                        (Date.now() - new Date(lead.createdAt).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )} dager siden`}
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className={`${
                    statusProps.variant === "success"
                      ? "bg-green-50/50 border-green-100"
                      : statusProps.variant === "destructive"
                      ? "bg-red-50/50 border-red-100"
                      : "bg-blue-50/50 border-blue-100"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          statusProps.variant as
                            | "default"
                            | "destructive"
                            | "outline"
                            | "secondary"
                            | null
                        }
                        className="flex items-center gap-1"
                      >
                        {statusProps.icon}
                        {statusProps.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setShowStageDialog(true)}
                      >
                        Endre
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {statusProps.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList className="w-full md:w-auto">
                <TabsTrigger value="details">Detaljer</TabsTrigger>
                <TabsTrigger value="activities">Aktiviteter</TabsTrigger>
                {/* <TabsTrigger value="offers">Tilbud</TabsTrigger>
                <TabsTrigger value="notes">Notater</TabsTrigger> */}
                {lead.orgNumber && (
                  <TabsTrigger value="proff">Proff Info</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Kontaktinformasjon</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex items-start">
                        <span className="w-24 flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          Navn:
                        </span>
                        <span>{lead.name}</span>
                      </div>

                      <div className="flex items-start">
                        <span className="w-24 flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          E-post:
                        </span>
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-primary hover:underline"
                        >
                          {lead.email}
                        </a>
                      </div>

                      <div className="flex items-start">
                        <span className="w-24 flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          Telefon:
                        </span>
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-primary hover:underline"
                        >
                          {lead.phone}
                        </a>
                      </div>

                      {lead.orgNumber && (
                        <div className="flex items-start">
                          <span className="w-24 flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            Org.nr:
                          </span>
                          <a
                            href={`https://proff.no/bransjesøk?q=${lead.orgNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {lead.orgNumber}
                          </a>
                        </div>
                      )}

                      {lead.website && (
                        <div className="flex items-start">
                          <span className="w-24 flex items-center gap-2 text-muted-foreground">
                            <Globe className="h-4 w-4" />
                            Nettside:
                          </span>
                          <a
                            href={
                              lead.website?.startsWith("http")
                                ? lead.website
                                : `https://${lead.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {lead.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Lead-informasjon</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex items-start">
                        <span className="w-36 flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Registrert dato:
                        </span>
                        <span>
                          {new Date(lead.createdAt).toLocaleDateString("no-NO")}
                        </span>
                      </div>

                      <div className="flex items-start">
                        <span className="w-36 flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          Potensiell verdi:
                        </span>
                        <span>
                          {lead.potensiellVerdi
                            ? new Intl.NumberFormat("no-NO", {
                                style: "currency",
                                currency: "NOK",
                                maximumFractionDigits: 0,
                              }).format(lead.potensiellVerdi)
                            : "Ikke angitt"}
                        </span>
                      </div>

                      {lead.notes && (
                        <div className="flex items-start">
                          <span className="w-36 flex items-center gap-2 text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            Notater:
                          </span>
                          <span className="whitespace-pre-wrap">
                            {lead.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {lead.address && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Adresseinformasjon</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <address className="not-italic">
                        {lead.address}
                        <br />
                        {lead.postalCode} {lead.city}
                        <br />
                        {lead.country}
                      </address>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="activities">
                {/* Updated Activities Tab Content using LeadActivity component */}
                <Card>
                  <CardContent className="pt-6">
                    <LeadActivity lead={lead} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="offers">
                <div className="space-y-4">
                  {showCreateOffer ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Opprett nytt tilbud</CardTitle>
                        <CardDescription>
                          Fyll ut informasjonen for å opprette et nytt tilbud
                          til {lead.name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CreateOffer
                          business={lead}
                          onSubmit={handleOfferSubmit}
                          onCancel={() => setShowCreateOffer(false)}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="pt-6">
                        <LeadOffers
                          lead={lead}
                          onCreateOffer={() => setShowCreateOffer(true)}
                          showCreateOffer={showCreateOffer}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notes">
                {/* Updated Notes Tab Content using LeadNotes component */}
                <Card>
                  <CardContent className="pt-6">
                    <LeadNotes lead={lead} />
                  </CardContent>
                </Card>
              </TabsContent>

              {lead.orgNumber && (
                <TabsContent value="proff">
                  <Card>
                    <CardContent className="pt-6">
                      <LeadProffInfo lead={lead} />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
