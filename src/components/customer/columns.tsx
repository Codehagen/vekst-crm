"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Trash, ExternalLink } from "lucide-react";
import { Business } from "@prisma/client";
import Link from "next/link";

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
                className="text-destructive focus:text-destructive flex items-center gap-2"
              >
                <Trash className="h-4 w-4" />
                <span>Slett kunde</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DeleteDialog
            customer={customer}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onSuccess={() => {
              // This will be handled by the parent component
              window.location.reload();
            }}
          />
        </>
      );
    },
  },
];
