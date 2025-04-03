import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteCustomers } from "@/app/actions/customers/actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface DeleteSelectedButtonProps {
  selectedCustomers: string[];
  onCustomersDeleted: () => void;
}

export function DeleteSelectedButton({
  selectedCustomers,
  onCustomersDeleted,
}: DeleteSelectedButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteBusinesses, setDeleteBusinesses] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteCustomers(selectedCustomers, deleteBusinesses);

      if (result.success) {
        toast.success(
          `Slettet ${result.count} ${result.count === 1 ? "kunde" : "kunder"}`
        );
        onCustomersDeleted();
        window.location.reload();
      } else {
        toast.error(`Kunne ikke slette: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Det oppstod en feil: ${(error as Error).message}`);
    } finally {
      setIsDeleting(false);
      setShowConfirmation(false);
    }
  };

  const customerText =
    selectedCustomers.length === 1
      ? "denne kunden"
      : `disse ${selectedCustomers.length} kundene`;

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="h-8"
        onClick={() => setShowConfirmation(true)}
        disabled={selectedCustomers.length === 0}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Slett valgte
      </Button>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Bekreft sletting
            </DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil slette {customerText}? Denne handlingen
              kan ikke angres.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="delete-businesses"
              checked={deleteBusinesses}
              onCheckedChange={(checked) =>
                setDeleteBusinesses(checked === true)
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="delete-businesses">
                Slett også tilknyttede bedrifter
              </Label>
              <p className="text-sm text-muted-foreground">
                Hvis ikke valgt vil bedriftene bli bevart.
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Avbryt
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Sletter..." : "Slett"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
