"use client";

import { useState } from "react";
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

import { columns, sampleLeads, Lead } from "./components/columns";
import { DataTable } from "./components/data-table";
import { KanbanView } from "./components/kanban-view";

export default function LeadsPage() {
  // Track which view is active
  const [view, setView] = useState<"table" | "kanban">("kanban");

  // State to manage leads data
  const [leads, setLeads] = useState<Lead[]>(sampleLeads);

  // Function to update a lead's status
  const handleStatusChange = (leadId: string, newStatus: Lead["status"]) => {
    // Find the lead to update
    const leadToUpdate = leads.find((lead) => lead.id === leadId);

    if (leadToUpdate) {
      // Update leads state with the new status
      setLeads((currentLeads) =>
        currentLeads.map((lead) =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );
    }
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

          {view === "table" ? (
            <DataTable
              columns={columns}
              data={leads}
              searchColumn="navn"
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
