import { PageHeader } from "@/components/page-header";
import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketDataTable } from "@/components/ticket/ticket-data-table";
import { Metadata } from "next";
import { getUserAssignedTickets } from "@/app/actions/tickets";

export const metadata: Metadata = {
  title: "Inbox | Sailsdock",
  description: "Your personal inbox with assigned tickets",
};

export default async function InboxPage() {
  // Get tickets assigned to the current user
  const tickets = await getUserAssignedTickets();

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Inbox", isCurrentPage: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-muted-foreground">
            View and manage tickets assigned to you
          </p>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="waiting">Waiting</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <Suspense fallback={<div>Loading ticket data...</div>}>
              <TicketDataTable data={tickets} />
            </Suspense>
          </TabsContent>
          <TabsContent value="open" className="space-y-4">
            <Suspense fallback={<div>Loading ticket data...</div>}>
              <TicketDataTable
                data={tickets.filter((ticket) => ticket.status === "open")}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="in-progress" className="space-y-4">
            <Suspense fallback={<div>Loading ticket data...</div>}>
              <TicketDataTable
                data={tickets.filter(
                  (ticket) => ticket.status === "in_progress"
                )}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="waiting" className="space-y-4">
            <Suspense fallback={<div>Loading ticket data...</div>}>
              <TicketDataTable
                data={tickets.filter(
                  (ticket) =>
                    ticket.status === "waiting_on_customer" ||
                    ticket.status === "waiting_on_third_party"
                )}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
