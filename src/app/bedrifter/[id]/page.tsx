"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  Users,
  Calendar,
  FileText,
  Tag,
  Plus,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Import server actions instead of mock API
import {
  getBusinessById,
  getBusinessActivities,
  getBusinessContacts,
  getBusinessOffers,
} from "../actions";
import { Business, Contact, Activity, Offer } from "@prisma/client";
import { BusinessWithRelations } from "@/lib/services/business-service";
import { CreateOffer } from "./create-offer";

export default function BusinessDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState<boolean>(true);
  const [business, setBusiness] = useState<BusinessWithRelations | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showCreateOffer, setShowCreateOffer] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Use server actions to fetch data
        const businessData = await getBusinessById(id);
        if (businessData) {
          setBusiness(businessData);

          // Fetch additional data in parallel
          const [contactsData, activitiesData, offersData] = await Promise.all([
            getBusinessContacts(id),
            getBusinessActivities(id),
            getBusinessOffers(id),
          ]);

          setContacts(contactsData);
          setActivities(activitiesData);
          setOffers(offersData);
        }
      } catch (error) {
        console.error("Error fetching business data:", error);
        toast.error("Failed to load business data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleOfferSubmit = (offer: Omit<Offer, "id">) => {
    const newOffer: Offer = {
      ...offer,
      id: `temp-${Date.now()}`,
    };

    setOffers([newOffer, ...offers]);
    setShowCreateOffer(false);
    toast.success("Tilbudet ble lagret");
  };

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
                    {loading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      business?.name || "Bedriftsdetaljer"
                    )}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="p-6">
          {loading ? (
            // Loading state
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
          ) : business ? (
            // Business data display
            <div className="space-y-6">
              {/* Business Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      {business.name}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>
                        Org.nr:
                        <a
                          href={`https://proff.no/bransjesøk?q=${business.orgNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline ml-1"
                        >
                          {business.orgNumber}
                        </a>
                      </span>
                      <span>•</span>
                      <Badge
                        variant={
                          business.status === "active"
                            ? "outline"
                            : business.status === "inactive"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {business.status === "active"
                          ? "Aktiv"
                          : business.status === "inactive"
                          ? "Inaktiv"
                          : "Lead"}
                      </Badge>
                      {business.bilagCount > 0 && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="bg-amber-50">
                            <FileText className="mr-1 h-3 w-3" />
                            {business.bilagCount} bilag
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {business.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tabs Interface */}
              <Tabs defaultValue="info" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="info">Bedriftsinformasjon</TabsTrigger>
                  <TabsTrigger value="contacts">Kontaktinfo</TabsTrigger>
                  <TabsTrigger value="offers">Tilbud</TabsTrigger>
                </TabsList>

                {/* Info Tab */}
                <TabsContent value="info" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Contact Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Kontaktinformasjon</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-start">
                            <span className="w-24 flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              E-post:
                            </span>
                            <a
                              href={`mailto:${business.email}`}
                              className="text-primary hover:underline"
                            >
                              {business.email}
                            </a>
                          </div>

                          <div className="flex items-start">
                            <span className="w-24 flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              Telefon:
                            </span>
                            <a
                              href={`tel:${business.phone}`}
                              className="hover:underline"
                            >
                              {business.phone}
                            </a>
                          </div>

                          {/* Website field */}
                          {business.website && (
                            <div className="flex items-start">
                              <span className="w-24 flex items-center gap-2 text-muted-foreground">
                                <Globe className="h-4 w-4" />
                                Nettside:
                              </span>
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
                            </div>
                          )}

                          {/* Regnskapstall field */}
                          <div className="flex items-start">
                            <span className="w-24 text-muted-foreground">
                              Regnskapstall:
                            </span>
                            <a
                              href={`https://proff.no/bransjesøk?q=${business.orgNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              proff.no
                            </a>
                          </div>

                          <div className="pt-2">
                            <h4 className="text-sm font-medium mb-1">
                              Adresse
                            </h4>
                            <address className="not-italic text-muted-foreground">
                              {business.address}
                              <br />
                              {business.postalCode} {business.city}
                              <br />
                              {business.country}
                            </address>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Business Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Detaljer</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {business.industry && (
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Bransje:</span>
                            <span>{business.industry}</span>
                          </div>
                        )}

                        {business.numberOfEmployees !== undefined && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Antall ansatte:</span>
                            <span>{business.numberOfEmployees}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Opprettet:</span>
                          <span>
                            {business.createdAt.toLocaleDateString("no-NO")}
                          </span>
                        </div>

                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-1">Bilag</h4>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>Antall bilag:</span>
                            <Badge variant="outline">
                              {business.bilagCount}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notes */}
                    {business.notes && (
                      <Card className="md:col-span-2">
                        <CardHeader>
                          <CardTitle>Notater</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="whitespace-pre-line">
                            {business.notes}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* Contacts Tab */}
                <TabsContent value="contacts">
                  <Card>
                    <CardHeader>
                      <CardTitle>Kontakter</CardTitle>
                      <CardDescription>
                        Kontaktpersoner hos {business.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {contacts.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {contacts.map((contact) => (
                            <Card key={contact.id}>
                              <CardHeader>
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-base">
                                    {contact.name}
                                  </CardTitle>
                                  {contact.isPrimary && (
                                    <Badge>Primær kontakt</Badge>
                                  )}
                                </div>
                                {contact.position && (
                                  <CardDescription>
                                    {contact.position}
                                  </CardDescription>
                                )}
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <a
                                      href={`mailto:${contact.email}`}
                                      className="text-primary hover:underline"
                                    >
                                      {contact.email}
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <a
                                      href={`tel:${contact.phone}`}
                                      className="hover:underline"
                                    >
                                      {contact.phone}
                                    </a>
                                  </div>
                                  {contact.notes && (
                                    <div className="pt-2 border-t mt-2">
                                      <p className="text-sm text-muted-foreground">
                                        {contact.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Ingen kontaktpersoner registrert</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Activities Tab */}
                <TabsContent value="activities">
                  <Card>
                    <CardHeader>
                      <CardTitle>Aktivitetslogg</CardTitle>
                      <CardDescription>
                        Historikk over aktiviteter med {business.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {activities.length > 0 ? (
                        <div className="space-y-4">
                          {activities.map((activity) => (
                            <div
                              key={activity.id}
                              className="flex gap-4 p-4 border rounded-lg"
                            >
                              <div
                                className={`rounded-full p-2 h-10 w-10 flex items-center justify-center ${
                                  activity.type === "meeting"
                                    ? "bg-blue-50"
                                    : activity.type === "call"
                                    ? "bg-green-50"
                                    : activity.type === "email"
                                    ? "bg-amber-50"
                                    : "bg-gray-50"
                                }`}
                              >
                                {activity.type === "meeting" ? (
                                  <Users className="h-5 w-5 text-blue-600" />
                                ) : activity.type === "call" ? (
                                  <Phone className="h-5 w-5 text-green-600" />
                                ) : activity.type === "email" ? (
                                  <Mail className="h-5 w-5 text-amber-600" />
                                ) : (
                                  <FileText className="h-5 w-5 text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <h4 className="font-medium capitalize">
                                    {activity.type}
                                  </h4>
                                  <time className="text-sm text-muted-foreground">
                                    {activity.date.toLocaleDateString("no-NO")}
                                  </time>
                                </div>
                                <p className="mt-1">{activity.description}</p>
                                {activity.outcome && (
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    <strong>Resultat:</strong>{" "}
                                    {activity.outcome}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Ingen aktiviteter registrert</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Offers Tab */}
                <TabsContent value="offers">
                  <div className="space-y-4">
                    {!showCreateOffer && (
                      <div className="flex justify-end">
                        <Button onClick={() => setShowCreateOffer(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Opprett nytt tilbud
                        </Button>
                      </div>
                    )}

                    {showCreateOffer ? (
                      <CreateOffer
                        business={business}
                        onCancel={() => setShowCreateOffer(false)}
                        onSubmit={handleOfferSubmit}
                      />
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>Tilbud</CardTitle>
                          <CardDescription>
                            Tilbud sendt til {business.name}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {offers.length > 0 ? (
                            <div className="space-y-4">
                              {offers.map((offer) => (
                                <Card key={offer.id}>
                                  <CardHeader>
                                    <div className="flex justify-between items-start">
                                      <CardTitle className="text-base">
                                        {offer.title}
                                      </CardTitle>
                                      <Badge
                                        variant={
                                          offer.status === "draft"
                                            ? "secondary"
                                            : offer.status === "sent"
                                            ? "default"
                                            : offer.status === "accepted"
                                            ? "outline"
                                            : offer.status === "rejected"
                                            ? "destructive"
                                            : "outline"
                                        }
                                      >
                                        {offer.status === "draft"
                                          ? "Utkast"
                                          : offer.status === "sent"
                                          ? "Sendt"
                                          : offer.status === "accepted"
                                          ? "Akseptert"
                                          : offer.status === "rejected"
                                          ? "Avslått"
                                          : "Utløpt"}
                                      </Badge>
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                      <span className="inline-block mr-4">
                                        Opprettet:{" "}
                                        {offer.createdAt.toLocaleDateString(
                                          "no-NO"
                                        )}
                                      </span>
                                      <span className="inline-block mr-4">
                                        Utløper:{" "}
                                        {offer.expiresAt.toLocaleDateString(
                                          "no-NO"
                                        )}
                                      </span>
                                      <span className="inline-block font-medium">
                                        {new Intl.NumberFormat("no-NO", {
                                          style: "currency",
                                          currency: offer.currency,
                                          maximumFractionDigits: 0,
                                        }).format(offer.totalAmount)}
                                      </span>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      <p>{offer.description}</p>

                                      <div className="border rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-border">
                                          <thead className="bg-muted">
                                            <tr>
                                              <th
                                                scope="col"
                                                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                                              >
                                                Beskrivelse
                                              </th>
                                              <th
                                                scope="col"
                                                className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
                                              >
                                                Antall
                                              </th>
                                              <th
                                                scope="col"
                                                className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
                                              >
                                                Pris
                                              </th>
                                              <th
                                                scope="col"
                                                className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
                                              >
                                                Sum
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-card divide-y divide-border">
                                            {offer.items.map(
                                              (item, itemIndex) => (
                                                <tr key={item.id}>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    {item.description}
                                                    {item.discount && (
                                                      <span className="text-xs ml-2 text-green-600">
                                                        ({item.discount}%
                                                        rabatt)
                                                      </span>
                                                    )}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                                                    {item.quantity}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                                                    {new Intl.NumberFormat(
                                                      "no-NO",
                                                      {
                                                        style: "currency",
                                                        currency:
                                                          offer.currency,
                                                        maximumFractionDigits: 0,
                                                      }
                                                    ).format(item.unitPrice)}
                                                  </td>
                                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right">
                                                    {new Intl.NumberFormat(
                                                      "no-NO",
                                                      {
                                                        style: "currency",
                                                        currency:
                                                          offer.currency,
                                                        maximumFractionDigits: 0,
                                                      }
                                                    ).format(item.total)}
                                                  </td>
                                                </tr>
                                              )
                                            )}
                                            <tr className="bg-muted/50">
                                              <td
                                                colSpan={3}
                                                className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right"
                                              >
                                                Total
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap text-base font-bold text-right">
                                                {new Intl.NumberFormat(
                                                  "no-NO",
                                                  {
                                                    style: "currency",
                                                    currency: offer.currency,
                                                    maximumFractionDigits: 0,
                                                  }
                                                ).format(offer.totalAmount)}
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>

                                      {offer.notes && (
                                        <div className="text-sm text-muted-foreground border-t pt-3 mt-3">
                                          <p>{offer.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>Ingen tilbud registrert</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            // No business found
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Fant ikke bedriften</h2>
              <p className="text-muted-foreground">
                Bedriften med ID {id} ble ikke funnet
              </p>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
