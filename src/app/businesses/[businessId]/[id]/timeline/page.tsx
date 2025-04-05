import { BusinessTimeline } from "@/components/timeline/business-timeline";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

interface PageProps {
  params: {
    businessId: string;
  };
}

export default async function BusinessTimelinePage({ params }: PageProps) {
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
    select: {
      id: true,
      name: true,
    },
  });

  if (!business) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{business.name}</h1>
        <p className="text-muted-foreground">Bedriftshistorikk</p>
      </div>

      <BusinessTimeline businessId={businessId} showFilters={true} />
    </div>
  );
}
