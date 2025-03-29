import { PageHeader } from "@/components/page-header";
import { TicketDetail } from "@/components/ticket/ticket-detail";
import { notFound } from "next/navigation";
import { getTicket } from "@/app/actions/tickets";

interface TicketPageProps {
  params: {
    id: string;
  };
}

export default async function TicketPage({ params }: TicketPageProps) {
  const ticket = await getTicket(params.id);

  if (!ticket) {
    notFound();
  }

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tickets", href: "/tickets" },
          { label: ticket.title, isCurrentPage: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <TicketDetail ticket={ticket} />
      </div>
    </>
  );
}
