import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

import { getAllBusinesses } from "../actions/businesses/actions";
import { DataTable } from "@/components/business/data-table";
import { columns } from "@/components/business/columns";

export const metadata = {
  title: "Businesses | CRM",
  description: "Manage all your businesses in one place",
};

export default async function BusinessesPage() {
  const businesses = await getAllBusinesses();

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Businesses", isCurrentPage: true },
        ]}
      />

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
          <Link href="/businesses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Business
            </Button>
          </Link>
        </div>

        <div className="rounded-md border">
          <DataTable columns={columns} data={businesses} />
        </div>
      </div>
    </>
  );
}
