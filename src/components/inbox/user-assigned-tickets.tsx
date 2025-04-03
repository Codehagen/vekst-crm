import { getUserAssignedTickets } from "@/app/actions/tickets";
import { DataTable } from "@/components/ui/data-table";
import { Card } from "@/components/ui/card";
import { ticketsTableColumns } from "@/components/ticket/tickets-table-columns";
import { EmptyState } from "@/components/empty-state";
import { IconInbox } from "@tabler/icons-react";

interface UserAssignedTicketsProps {
  status?: string;
}

export async function UserAssignedTickets({
  status,
}: UserAssignedTicketsProps) {
  const tickets = await getUserAssignedTickets();

  // Filter tickets by status if provided
  const filteredTickets = status
    ? tickets.filter(
        (ticket) => ticket.status.toLowerCase() === status.toLowerCase()
      )
    : tickets;

  if (!filteredTickets.length) {
    return (
      <Card className="border-none">
        <EmptyState
          icon={IconInbox}
          title="No assigned tickets"
          description={
            status
              ? `You don't have any ${status} tickets assigned to you`
              : "You don't have any tickets assigned to you"
          }
        />
      </Card>
    );
  }

  return (
    <Card>
      <DataTable
        columns={ticketsTableColumns}
        data={filteredTickets}
        filterableColumns={[
          {
            id: "status",
            title: "Status",
            options: [
              { label: "Open", value: "open" },
              { label: "In Progress", value: "in-progress" },
              { label: "Waiting", value: "waiting" },
              { label: "Closed", value: "closed" },
            ],
          },
          {
            id: "priority",
            title: "Priority",
            options: [
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
              { label: "Urgent", value: "urgent" },
            ],
          },
        ]}
        searchableColumns={[
          {
            id: "title",
            title: "Title",
          },
          {
            id: "businessName",
            title: "Business",
          },
        ]}
      />
    </Card>
  );
}
