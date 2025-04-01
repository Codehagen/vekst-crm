"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { DataTable } from "@/components/customer/data-table";
import { EmptyState } from "@/components/customer/empty-state";
import { Business } from "@prisma/client";
import { getCustomers } from "../actions/customers/actions";
import { columns } from "@/components/customer/columns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImportEmailWizard } from "@/components/customer/import-email-wizard";
import { checkEmailImportAvailability } from "@/app/actions/customer";

export default function CustomersPage() {
  // State to manage customers data
  const [customers, setCustomers] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    available: boolean;
    emailCount?: number;
    needsEmailSetup?: boolean;
    needsEmailSync?: boolean;
  } | null>(null);

  // Function to fetch customers that can be called multiple times
  const refreshCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch customers on component mount
  useEffect(() => {
    refreshCustomers();
  }, [refreshCustomers]);

  // Handle importing customers
  const handleImportCustomers = async () => {
    try {
      const status = await checkEmailImportAvailability();
      setImportStatus(status);
      setShowImportWizard(true);
    } catch (error) {
      console.error("Failed to check import availability:", error);
      // Show dialog anyway, the wizard will handle the error
      setImportStatus({
        available: false,
        needsEmailSetup: true,
      });
      setShowImportWizard(true);
    }
  };

  // Handle converting leads to customers
  const handleConvertLead = () => {
    window.location.href = "/leads";
  };

  return (
    <>
      <PageHeader
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Customers", isCurrentPage: true },
        ]}
      />

      <main className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kunder</h1>
            <p className="text-muted-foreground mt-2">
              Administrer og følg opp dine kunder
            </p>
          </div>

          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Ny kunde</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Laster kunder...</p>
          </div>
        ) : customers.length > 0 ? (
          <DataTable
            columns={columns}
            data={customers}
            searchColumn="name"
            searchPlaceholder="Søk etter navn..."
          />
        ) : (
          <EmptyState
            onImport={handleImportCustomers}
            onConvert={handleConvertLead}
          />
        )}
      </main>

      <Dialog
        open={showImportWizard}
        onOpenChange={(open) => !open && setShowImportWizard(false)}
      >
        <DialogContent className="max-w-2xl p-0">
          <ImportEmailWizard
            emailCount={importStatus?.emailCount}
            needsEmailSetup={importStatus?.needsEmailSetup}
            needsEmailSync={importStatus?.needsEmailSync}
            onClose={() => setShowImportWizard(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
