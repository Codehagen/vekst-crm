import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { BusinessTimeline } from "@/components/timeline/business-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PageProps {
  params: {
    businessId: string;
  };
}

export default async function BusinessDetailsPage({ params }: PageProps) {
  const businessId = params.businessId;
  const session = await getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return notFound();
  }

  // Verify business exists and belongs to user's workspace
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { workspaceId: true },
  });

  if (!user?.workspaceId) {
    return notFound();
  }

  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      workspaceId: user.workspaceId,
    },
    include: {
      contacts: true,
      tags: true,
    },
  });

  if (!business) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{business.name}</h1>
        <p className="text-muted-foreground">Bedriftsdetaljer</p>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Detaljer</TabsTrigger>
          <TabsTrigger value="timeline">Tidslinje</TabsTrigger>
          <TabsTrigger value="contacts">
            Kontakter ({business.contacts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bedriftsinformasjon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Navn
                  </p>
                  <p>{business.name}</p>
                </div>
                {business.orgNumber && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Organisasjonsnummer
                    </p>
                    <p>{business.orgNumber}</p>
                  </div>
                )}
                {business.email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      E-post
                    </p>
                    <p>{business.email}</p>
                  </div>
                )}
                {business.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Telefon
                    </p>
                    <p>{business.phone}</p>
                  </div>
                )}
                {business.website && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Nettside
                    </p>
                    <p>{business.website}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adresse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {business.address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Adresse
                    </p>
                    <p>{business.address}</p>
                  </div>
                )}
                {business.postalCode && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Postnummer
                    </p>
                    <p>{business.postalCode}</p>
                  </div>
                )}
                {business.city && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      By
                    </p>
                    <p>{business.city}</p>
                  </div>
                )}
                {business.country && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Land
                    </p>
                    <p>{business.country}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <BusinessTimeline businessId={businessId} showFilters={true} />
        </TabsContent>

        <TabsContent value="contacts">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {business.contacts.map((contact) => (
              <Card key={contact.id}>
                <CardHeader>
                  <CardTitle>{contact.name}</CardTitle>
                  {contact.isPrimary && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                      Primærkontakt
                    </span>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      E-post
                    </p>
                    <p>{contact.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Telefon
                    </p>
                    <p>{contact.phone}</p>
                  </div>
                  {contact.position && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Stilling
                      </p>
                      <p>{contact.position}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
