"use client";

import { useState } from "react";
import { AlertCircle, Trash } from "lucide-react";
import { toast } from "sonner";
import { Business } from "@prisma/client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteCustomer } from "@/app/actions/customers/actions";

interface DeleteDialogProps {
  customer: Business;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteDialog({
  customer,
  open,
  onOpenChange,
  onSuccess,
}: DeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCustomer(customer.id);

      toast.success(`Kunden "${customer.name}" ble slettet`);
      onOpenChange(false);

      // Either call the onSuccess callback or reload the page
      if (onSuccess) {
        onSuccess();
      } else {
        // Reload the page to refresh the data
        window.location.reload();
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Kunne ikke slette kunden");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-6 w-6" />
            <AlertDialogTitle>Slett kunde</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-3">
            Er du sikker på at du vil slette kunden{" "}
            <strong>{customer.name}</strong>? Denne handlingen kan ikke angres,
            og all tilknyttet data vil bli slettet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Avbryt</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-1"
            >
              <Trash className="h-4 w-4" />
              {isDeleting ? "Sletter..." : "Slett kunde"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
