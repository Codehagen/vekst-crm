import { ContactTimeline } from "@/components/timeline/contact-timeline";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

interface PageProps {
  params: {
    businessId: string;
    contactId: string;
  };
}

export default async function ContactTimelinePage({ params }: PageProps) {
  const { businessId, contactId } = params;
  const session = await getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return notFound();
  }

  // Verify user has access to this workspace and contact
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { workspaceId: true },
  });

  if (!user?.workspaceId) {
    return notFound();
  }

  // Get the contact and make sure it belongs to the specified business
  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      businessId: businessId,
      business: {
        workspaceId: user.workspaceId,
      },
    },
    include: {
      business: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!contact) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{contact.name}</h1>
        <p className="text-muted-foreground">
          Kontakthistorikk |{" "}
          <span className="text-primary">{contact.business.name}</span>
        </p>
      </div>

      <ContactTimeline contactId={contactId} showFilters={true} />
    </div>
  );
}
