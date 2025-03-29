import { PageHeader } from "@/components/page-header";
import { TicketList } from "@/components/ticket/ticket-list";
import { TicketStatusFilter } from "@/components/ticket/ticket-status-filter";

export default function TicketsPage() {
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
          <div className="flex items-center gap-2">
            <TicketStatusFilter />
          </div>
        </div>

        <TicketList />
      </div>
    </>
  );
}
