"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DomainImportDialog } from "@/components/customer/domain-import-dialog";

export function ImportButton() {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
        <Building2 className="mr-2 h-4 w-4" /> Import from Email
      </Button>

      <DomainImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />
    </>
  );
}
