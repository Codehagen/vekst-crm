import { Suspense } from "react";
import {
  TicketDataTable,
  ticketSchema,
} from "@/components/ticket/ticket-data-table";
import { PageHeader } from "@/components/page-header";

// Generate mock data for the ticket table
function generateMockTickets(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const id = `ticket-${i + 1}`;
    const statuses = [
      "unassigned",
      "open",
      "in_progress",
      "waiting_on_customer",
      "waiting_on_third_party",
      "resolved",
      "closed",
    ];
    const priorities = ["low", "medium", "high", "urgent"];
    const tags = [
      "technical",
      "invoicing",
      "account",
      "urgent",
      "bug",
      "feature",
      "inquiry",
    ];

    // Random date within the last 30 days
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));

    // Random date in the future for due date (or null)
    const dueDate = Math.random() > 0.3 ? new Date() : null;
    if (dueDate) {
      dueDate.setDate(
        new Date().getDate() + Math.floor(Math.random() * 14) + 1
      );
    }

    // Random assignee (or null)
    const assignee =
      Math.random() > 0.3
        ? ["John Doe", "Jane Smith", "Alex Johnson"][
            Math.floor(Math.random() * 3)
          ]
        : null;

    // Random business (or null for unassigned tickets)
    const businessName =
      Math.random() > 0.2
        ? [
            "Norsk Teknologi AS",
            "Hansen Konsult AS",
            "Johansen og Sønner AS",
            "Olsen Digital AS",
          ][Math.floor(Math.random() * 4)]
        : null;

    return ticketSchema.parse({
      id,
      title: `Ticket #${i + 1}: ${
        [
          "Support request",
          "Bug report",
          "Feature request",
          "Account issue",
          "Billing question",
        ][Math.floor(Math.random() * 5)]
      }`,
      description: `This is a sample description for ticket #${
        i + 1
      }. It contains details about the issue or request.`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      businessName,
      contactName: businessName ? `Contact for ${businessName}` : null,
      assignee,
      creator: "system",
      createdAt,
      updatedAt: new Date(createdAt.getTime() + Math.random() * 86400000), // Random time after creation
      dueDate,
      tags: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 },
        () => tags[Math.floor(Math.random() * tags.length)]
      ),
      commentCount: Math.floor(Math.random() * 5),
    });
  });
}

export default function TicketsPage() {
  const mockTickets = generateMockTickets(15);

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tickets", isCurrentPage: true },
        ]}
      />

      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Tickets</h2>
          <p className="text-muted-foreground">
            Manage support tickets and customer requests
          </p>
        </div>

        <Suspense fallback={<div>Loading ticket data...</div>}>
          <TicketDataTable data={mockTickets} />
        </Suspense>
      </div>
    </>
  );
}
