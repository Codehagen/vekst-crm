"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Trash,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Business } from "@prisma/client";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DeleteDialog } from "./delete-dialog";
import { deleteCustomers } from "@/app/actions/customers/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Column definitions
export const columns: ColumnDef<Business>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Velg alle"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Velg rad"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Navn
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const businessName = row.getValue("name") as string;
      const id = row.original.id;

      // Get the primary contact or contactPerson
      const contacts = (row.original as any).contacts;
      const primaryContact = contacts?.[0];
      const contactPerson = row.original.contactPerson;

      // Determine the display name - prioritize primary contact's name,
      // then fall back to contactPerson field, then business name
      const displayName = primaryContact?.name || contactPerson || businessName;

      return (
        <div>
          <Link
            href={`/customers/${id}`}
            className="font-medium text-primary hover:underline flex items-center gap-1"
          >
            {displayName}
            <ExternalLink className="h-3 w-3 inline opacity-50" />
          </Link>
          {displayName !== businessName && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {businessName}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "E-post",
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
  },
  {
    accessorKey: "phone",
    header: "Telefon",
  },
  {
    id: "primaryContact",
    header: "Selskap",
    cell: ({ row }) => {
      // The business object now includes contacts from our updated query
      const contacts = (row.original as any).contacts;
      const primaryContact = contacts?.[0];
      const businessId = row.original.id;
      const businessName = row.getValue("name") as string;

      return (
        <div>
          <Link
            href={`/businesses/${businessId}`}
            className="text-primary hover:underline"
          >
            {businessName}
          </Link>
          {primaryContact && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {primaryContact.name}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "customerSince",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Kunde siden
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("customerSince") as Date | null;
      if (!date) return <div>-</div>;
      return <div>{new Date(date).toLocaleDateString("nb-NO")}</div>;
    },
  },
  {
    accessorKey: "contractValue",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="justify-end w-full"
      >
        Kontraktverdi
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("contractValue");
      if (!amount) return <div className="text-right">-</div>;
      return (
        <div className="text-right font-medium">
          {formatCurrency(amount as number, "NOK")}
        </div>
      );
    },
  },
  {
    accessorKey: "contractRenewalDate",
    header: "Fornyes",
    cell: ({ row }) => {
      const date = row.getValue("contractRenewalDate") as Date | null;
      if (!date) return <div>-</div>;

      const renewalDate = new Date(date);
      const today = new Date();
      const diffTime = renewalDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return <Badge variant="destructive">Utløpt</Badge>;
      } else if (diffDays <= 30) {
        return <Badge variant="default">{diffDays} dager</Badge>;
      } else {
        return <div>{renewalDate.toLocaleDateString("nb-NO")}</div>;
      }
    },
  },
  {
    accessorKey: "churnRisk",
    header: "Churn risiko",
    cell: ({ row }) => {
      const risk = row.getValue("churnRisk");
      if (!risk) return <div>-</div>;

      const riskBadges: Record<
        string,
        {
          label: string;
          variant:
            | "default"
            | "outline"
            | "secondary"
            | "destructive"
            | "success";
        }
      > = {
        low: { label: "Lav", variant: "success" },
        medium: { label: "Medium", variant: "secondary" },
        high: { label: "Høy", variant: "default" },
        critical: { label: "Kritisk", variant: "destructive" },
      };

      const { label, variant } = riskBadges[risk as string] || {
        label: risk as string,
        variant: "outline",
      };

      return <Badge variant={variant as any}>{label}</Badge>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const customer = row.original;
      const [showDeleteDialog, setShowDeleteDialog] = useState(false);
      const [isDeleting, setIsDeleting] = useState(false);
      const [deleteBusinesses, setDeleteBusinesses] = useState(false);

      const handleDelete = async () => {
        try {
          setIsDeleting(true);
          const result = await deleteCustomers([customer.id], deleteBusinesses);

          if (result.success) {
            toast.success(`Kunden "${customer.name}" ble slettet`);
            // Reload the page to refresh the data
            window.location.reload();
          } else {
            toast.error(`Kunne ikke slette kunden: ${result.error}`);
          }
        } catch (error) {
          console.error("Error deleting customer:", error);
          toast.error("Kunne ikke slette kunden");
        } finally {
          setIsDeleting(false);
          setShowDeleteDialog(false);
        }
      };

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Åpne meny</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(customer.id)}
              >
                Kopier ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <a href={`/customers/${customer.id}`}>Vis detaljer</a>
              </DropdownMenuItem>
              <DropdownMenuItem>Rediger kunde</DropdownMenuItem>
              <DropdownMenuItem>Send SMS</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                Slett kunde
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Bekreft sletting
                </DialogTitle>
                <DialogDescription>
                  Er du sikker på at du vil slette kunden "{customer.name}"?
                  Denne handlingen kan ikke angres.
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
    },
  },
];
