import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { TicketDataTable } from "@/components/ticket/ticket-data-table";
import { getTickets } from "@/app/actions/tickets";

export default async function TicketsPage() {
  // Get all tickets for the current user's workspace
  const tickets = await getTickets();

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tickets", isCurrentPage: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">
            Manage support tickets and customer requests
          </p>
        </div>

        <Suspense fallback={<div>Loading ticket data...</div>}>
          <TicketDataTable data={tickets} />
        </Suspense>
      </div>
    </>
  );
}
