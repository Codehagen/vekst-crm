import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteBusinesses } from "@/app/actions/businesses/actions";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

interface DeleteSelectedButtonProps {
  selectedBusinesses: string[];
  onBusinessesDeleted: () => void;
}

export function DeleteSelectedButton({
  selectedBusinesses,
  onBusinessesDeleted,
}: DeleteSelectedButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (deleteContacts: boolean) => {
    try {
      setIsDeleting(true);
      const result = await deleteBusinesses(selectedBusinesses, deleteContacts);

      if (result.success) {
        toast.success(
          `Successfully deleted ${result.count} ${
            result.count === 1 ? "business" : "businesses"
          }`
        );
        onBusinessesDeleted();
        window.location.reload();
      } else {
        toast.error(`Failed to delete: ${result.error}`);
      }
    } catch (error) {
      toast.error(`An error occurred: ${(error as Error).message}`);
    } finally {
      setIsDeleting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="h-8"
        onClick={() => setShowConfirmation(true)}
        disabled={selectedBusinesses.length === 0}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Selected
      </Button>

      <DeleteConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleDelete}
        businessCount={selectedBusinesses.length}
        isDeleting={isDeleting}
      />
    </>
  );
}
