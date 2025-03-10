"use client";

import { useEffect, useState } from "react";
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
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { KanbanView } from "./components/kanban-view";
import { Business, CustomerStage } from "@prisma/client";
import { getLeads, updateLeadStatus } from "./actions";

export default function LeadsPage() {
  // Track which view is active
  const [view, setView] = useState<"table" | "kanban">("kanban");

  // State to manage leads data
  const [leads, setLeads] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch leads on component mount
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const data = await getLeads();
        setLeads(data);
      } catch (error) {
        console.error("Error fetching leads:", error);
        toast.error("Failed to load leads");
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Function to update a lead's status
  const handleStatusChange = async (
    leadId: string,
    newStage: CustomerStage
  ) => {
    // Find the lead being updated
    const leadToUpdate = leads.find((lead) => lead.id === leadId);
    if (!leadToUpdate) return;

    // Get the old status before updating
    const oldStage = leadToUpdate.stage;

    // Store the original leads state in case we need to revert
    const originalLeads = [...leads];

    try {
      // Optimistic update - immediately update the UI
      setLeads((currentLeads) =>
        currentLeads.map((lead) =>
          lead.id === leadId ? { ...lead, stage: newStage } : lead
        )
      );

      // Update in the database via server action
      await updateLeadStatus(leadId, newStage);

      // Show a detailed toast notification after successful update
      toast.success(
        <div className="flex flex-col gap-1">
          <div className="font-medium">Lead status oppdatert</div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{leadToUpdate.name}</span> ble flyttet
            fra{" "}
            <Badge variant="outline" className="ml-1 mr-1">
              {getStageLabel(oldStage)}
            </Badge>
            <span>→</span>
            <Badge variant="outline" className="ml-1">
              {getStageLabel(newStage)}
            </Badge>
          </div>
        </div>
      );
    } catch (error) {
      // If server update fails, revert to the original state
      setLeads(originalLeads);
      console.error("Error updating lead status:", error);
      toast.error("Failed to update lead status");
    }
  };

  // Helper function to get readable status labels
  const getStageLabel = (stage: CustomerStage): string => {
    const stageLabels: Record<CustomerStage, string> = {
      lead: "Ny",
      prospect: "Kontaktet",
      qualified: "Kvalifisert",
      customer: "Kunde",
      churned: "Tapt",
    };
    return stageLabels[stage];
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
                  <BreadcrumbLink href="/">CRM System</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Leads</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
              <p className="text-muted-foreground mt-2">
                Håndter potensielle kunder og salgsmuligheter
              </p>
            </div>
            <Tabs
              defaultValue="kanban"
              value={view}
              onValueChange={(value) => setView(value as "table" | "kanban")}
            >
              <TabsList className="grid w-[200px] grid-cols-2">
                <TabsTrigger value="kanban" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  <span>Kanban</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <TableIcon className="h-4 w-4" />
                  <span>Tabell</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Laster leads...</p>
            </div>
          ) : view === "table" ? (
            <DataTable
              columns={columns}
              data={leads}
              searchColumn="name"
              searchPlaceholder="Søk etter navn..."
            />
          ) : (
            <KanbanView leads={leads} onStatusChange={handleStatusChange} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
