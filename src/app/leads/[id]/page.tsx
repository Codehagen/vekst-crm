"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Import lead actions and types
import { getLeadById, updateLeadStatus } from "../../actions/leads/actions";
import { Business, CustomerStage } from "@prisma/client";

// Import custom components
import { LeadHeader } from "@/components/lead/lead-header";
import { LeadInfoCards } from "@/components/lead/lead-info-cards";
import { LeadTabs } from "@/components/lead/lead-tabs";

// Import utilities
import { getStatusBadgeProps } from "@/lib/lead-status-utils";

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
      <>
        <PageHeader
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Leads", href: "/leads" },
            { label: "Laster...", isCurrentPage: true },
          ]}
        />

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
      </>
    );
  }

  if (!lead) {
    return (
      <>
        <PageHeader
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Leads", href: "/leads" },
          ]}
        />

        <main className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Fant ikke lead</h1>
          <p className="text-muted-foreground mb-6">
            Lead med ID {id} ble ikke funnet
          </p>
          <Button asChild>
            <a href="/leads">Tilbake til leads</a>
          </Button>
        </main>
      </>
    );
  }

  // If we have a lead, render the lead details using our components
  const statusProps = getStatusBadgeProps(lead.stage);

  return (
    <>
      <PageHeader
        items={[
          { label: "CRM System", href: "/" },
          { label: "Leads", href: "/leads" },
          { label: lead.name, isCurrentPage: true },
        ]}
      />

      <main className="p-6">
        <div className="space-y-6">
          {/* Lead Header */}
          <LeadHeader
            lead={lead}
            getStatusBadgeProps={getStatusBadgeProps}
            onStatusChange={handleStageChange}
          />

          {/* Quick Info Cards */}
          <LeadInfoCards
            lead={lead}
            statusProps={statusProps}
            onStatusDialogOpen={() => setShowStageDialog(true)}
          />

          {/* Main Content with Tabs */}
          <LeadTabs lead={lead} />
        </div>
      </main>
    </>
  );
}
