import { useState } from "react";
import { Button } from "@/components/ui/button";
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

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteContacts: boolean) => Promise<void>;
  businessCount: number;
  isDeleting: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  businessCount,
  isDeleting,
}: DeleteConfirmationDialogProps) {
  const [deleteContacts, setDeleteContacts] = useState(false);

  const handleConfirm = async () => {
    await onConfirm(deleteContacts);
  };

  const businessText =
    businessCount === 1 ? "this business" : `these ${businessCount} businesses`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {businessText}? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start space-x-2 pt-2">
          <Checkbox
            id="delete-contacts"
            checked={deleteContacts}
            onCheckedChange={(checked) => setDeleteContacts(checked === true)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="delete-contacts">
              Also delete associated contacts
            </Label>
            <p className="text-sm text-muted-foreground">
              If unchecked, contacts will be preserved.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
