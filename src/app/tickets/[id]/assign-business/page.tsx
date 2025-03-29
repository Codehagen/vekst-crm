import { PageHeader } from "@/components/page-header";
import { AssignBusinessForm } from "@/components/ticket/assign-business-form";
import { notFound } from "next/navigation";
import { getTicket } from "@/app/actions/tickets";

interface AssignBusinessPageProps {
  params: {
    id: string;
  };
}

export default async function AssignBusinessPage({
  params,
}: AssignBusinessPageProps) {
  const ticket = await getTicket(params.id);

  if (!ticket) {
    notFound();
  }

  // If ticket already has a business, we should redirect
  if (ticket.business) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This ticket is already assigned to a business:{" "}
                <strong>{ticket.business.name}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tickets", href: "/tickets" },
          { label: ticket.title, href: `/tickets/${ticket.id}` },
          { label: "Assign Business", isCurrentPage: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="max-w-2xl mx-auto w-full">
          <h1 className="text-2xl font-bold mb-6">Assign Business to Ticket</h1>
          <AssignBusinessForm ticket={ticket} />
        </div>
      </div>
    </>
  );
}
