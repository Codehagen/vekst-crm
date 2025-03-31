import { UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onImport?: () => void;
  onConvert?: () => void;
}

export function EmptyState({ onImport, onConvert }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-[60vh]">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <UsersRound className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mt-6 text-2xl font-semibold">Ingen kunder ennå</h3>
      <p className="mt-2 text-muted-foreground max-w-md">
        Du har ingen kunder i systemet. Du kan importere kunder fra en ekstern
        kilde eller konvertere leads til kunder.
      </p>
      <div className="mt-6 flex gap-4">
        {onImport && (
          <Button onClick={onImport} variant="default">
            Importer kunder
          </Button>
        )}
        {onConvert && (
          <Button onClick={onConvert} variant="outline">
            Konverter lead til kunde
          </Button>
        )}
      </div>
    </div>
  );
}
