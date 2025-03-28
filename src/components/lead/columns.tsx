"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Business, CustomerStage } from "@prisma/client";

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

// Function to get status badge with appropriate color
function getStatusBadge(stage: CustomerStage) {
  const statusMap: Record<
    CustomerStage,
    {
      label: string;
      variant: "default" | "outline" | "secondary" | "destructive" | "success";
    }
  > = {
    lead: { label: "Ny", variant: "secondary" },
    prospect: { label: "Kontaktet", variant: "default" },
    qualified: { label: "Kvalifisert", variant: "default" },
    offer_sent: { label: "Tilbud sendt", variant: "default" },
    offer_accepted: { label: "Tilbud akseptert", variant: "success" },
    declined: { label: "Takket nei", variant: "destructive" },
    customer: { label: "Kunde", variant: "success" },
    churned: { label: "Tapt", variant: "destructive" },
  };

  const { label, variant } = statusMap[stage];
  return (
    <Badge
      variant={
        variant as "default" | "destructive" | "outline" | "secondary" | null
      }
    >
      {label}
    </Badge>
  );
}

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
    accessorKey: "contactPerson",
    header: "Kontaktperson",
    cell: ({ row }) => <div>{row.getValue("contactPerson") || "-"}</div>,
  },
  {
    accessorKey: "stage",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.getValue("stage")),
  },
  {
    accessorKey: "potensiellVerdi",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="justify-end w-full"
      >
        Potensiell Verdi
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("potensiellVerdi");
      if (!amount) return <div className="text-right">-</div>;

      const formatted = new Intl.NumberFormat("no-NO", {
        style: "currency",
        currency: "NOK",
      }).format(amount as number);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const lead = row.original;

      return (
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
              onClick={() => navigator.clipboard.writeText(lead.id)}
            >
              Kopier ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <a href={`/leads/${lead.id}`}>Vis detaljer</a>
            </DropdownMenuItem>
            <DropdownMenuItem>Rediger lead</DropdownMenuItem>
            <DropdownMenuItem>Konverter til kunde</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
