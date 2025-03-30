import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Pencil, Trash, Mail, Phone, Building, Calendar } from "lucide-react";
import Link from "next/link";
import { EmailTimeline } from "@/components/email/email-timeline";

interface BusinessPageProps {
  params: {
    id: string;
  };
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const business = await prisma.business.findUnique({
    where: {
      id: params.id,
    },
    include: {
      contacts: true,
    },
  });

  if (!business) {
    notFound();
  }

  // Fetch emails related to this business for initial loading
  const businessEmails = await prisma.emailSync.findMany({
    where: {
      businessId: business.id,
      isDeleted: false,
    },
    orderBy: {
      sentAt: "desc",
    },
    take: 10,
  });

  // Convert Date objects to strings for the EmailTimeline component
  const formattedEmails = businessEmails.map((email) => ({
    ...email,
    sentAt: email.sentAt.toISOString(),
    receivedAt: email.receivedAt?.toISOString() || null,
    createdAt: email.createdAt.toISOString(),
    updatedAt: email.updatedAt.toISOString(),
  }));

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{business.name}</h1>
          <p className="text-muted-foreground mt-1">
            {business.industry || "No industry specified"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/business/${business.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" size="sm">
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Contact Info Card */}
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <div className="space-y-3">
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  {business.email}
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">
                  {business.phone}
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Building className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-sm text-muted-foreground">
                  {business.address || "No address provided"}
                  {business.postalCode && business.city
                    ? `, ${business.postalCode} ${business.city}`
                    : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4">Business Details</h2>
          <div className="space-y-3">
            <div>
              <p className="font-medium">Status</p>
              <div className="mt-1">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                  {business.status}
                </span>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 ml-2">
                  {business.stage}
                </span>
              </div>
            </div>
            {business.orgNumber && (
              <div>
                <p className="font-medium">Organization Number</p>
                <p className="text-sm text-muted-foreground">
                  {business.orgNumber}
                </p>
              </div>
            )}
            {business.website && (
              <div>
                <p className="font-medium">Website</p>
                <p className="text-sm text-muted-foreground">
                  <a
                    href={
                      business.website.startsWith("http")
                        ? business.website
                        : `https://${business.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {business.website}
                  </a>
                </p>
              </div>
            )}
            <div>
              <p className="font-medium">Created</p>
              <p className="text-sm text-muted-foreground">
                {new Date(business.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Card */}
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
          <div className="space-y-3">
            <div>
              <p className="font-medium">Number of Employees</p>
              <p className="text-sm text-muted-foreground">
                {business.numberOfEmployees || "Not specified"}
              </p>
            </div>
            <div>
              <p className="font-medium">Revenue</p>
              <p className="text-sm text-muted-foreground">
                {business.revenue
                  ? new Intl.NumberFormat("no-NO", {
                      style: "currency",
                      currency: "NOK",
                    }).format(business.revenue)
                  : "Not specified"}
              </p>
            </div>
            <div>
              <p className="font-medium">Potential Value</p>
              <p className="text-sm text-muted-foreground">
                {business.potensiellVerdi
                  ? new Intl.NumberFormat("no-NO", {
                      style: "currency",
                      currency: "NOK",
                    }).format(business.potensiellVerdi)
                  : "Not specified"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="contacts" className="mt-8">
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="contacts" className="mt-4">
          {/* <ContactsList
            businessId={business.id}
            initialContacts={business.contacts}
          /> */}
        </TabsContent>
        <TabsContent value="emails" className="mt-4">
          <EmailTimeline
            businessId={business.id}
            initialEmails={formattedEmails}
          />
        </TabsContent>
        <TabsContent value="activities" className="mt-4">
          <div className="bg-card rounded-lg border shadow-sm p-4">
            <p className="text-center text-muted-foreground py-8">
              Activities coming soon
            </p>
          </div>
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
          <div className="bg-card rounded-lg border shadow-sm p-4">
            <p className="text-center text-muted-foreground py-8">
              Notes coming soon
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {business.notes && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Notes</h2>
          <div className="bg-card rounded-lg border shadow-sm p-4">
            <p className="whitespace-pre-wrap">{business.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
