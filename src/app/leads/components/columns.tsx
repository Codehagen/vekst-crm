"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

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

// Define the Lead type with 3 statuses
export interface Lead {
  id: string;
  navn: string;
  epost: string;
  telefon: string;
  selskap?: string;
  status: "ny" | "kontaktet" | "ferdig";
  potensiellVerdi: number;
}

// Sample data
export const sampleLeads: Lead[] = [
  {
    id: "l001",
    navn: "Ola Nordmann",
    epost: "ola@example.no",
    telefon: "99887766",
    selskap: "Norsk Teknologi AS",
    status: "ny",
    potensiellVerdi: 75000,
  },
  {
    id: "l002",
    navn: "Kari Hansen",
    epost: "kari@bedrift.no",
    telefon: "45678901",
    selskap: "Hansen Konsult",
    status: "kontaktet",
    potensiellVerdi: 120000,
  },
  {
    id: "l003",
    navn: "Lars Johansen",
    epost: "lars@firma.no",
    telefon: "91234567",
    selskap: "Johansen og Sønner",
    status: "kontaktet",
    potensiellVerdi: 250000,
  },
  {
    id: "l004",
    navn: "Ingrid Olsen",
    epost: "ingrid@selskap.no",
    telefon: "92345678",
    selskap: "Olsen Digital",
    status: "ferdig",
    potensiellVerdi: 180000,
  },
  {
    id: "l005",
    navn: "Erik Berg",
    epost: "erik@konsulent.no",
    telefon: "93456789",
    status: "ferdig",
    potensiellVerdi: 50000,
  },
];

// Function to get status badge with appropriate color
function getStatusBadge(status: Lead["status"]) {
  const statusMap: Record<
    Lead["status"],
    {
      label: string;
      variant: "default" | "outline" | "secondary" | "destructive" | "success";
    }
  > = {
    ny: { label: "Ny", variant: "secondary" },
    kontaktet: { label: "Kontaktet", variant: "default" },
    ferdig: { label: "Ferdig", variant: "success" },
  };

  const { label, variant } = statusMap[status];
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
export const columns: ColumnDef<Lead>[] = [
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
    accessorKey: "navn",
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
    accessorKey: "epost",
    header: "E-post",
    cell: ({ row }) => <div>{row.getValue("epost")}</div>,
  },
  {
    accessorKey: "telefon",
    header: "Telefon",
  },
  {
    accessorKey: "selskap",
    header: "Selskap",
    cell: ({ row }) => <div>{row.getValue("selskap") || "-"}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.getValue("status")),
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
      const amount = parseFloat(row.getValue("potensiellVerdi"));
      const formatted = new Intl.NumberFormat("no-NO", {
        style: "currency",
        currency: "NOK",
      }).format(amount);

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
              Kopier lead ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Vis detaljer</DropdownMenuItem>
            <DropdownMenuItem>Rediger lead</DropdownMenuItem>
            <DropdownMenuItem>Konverter til kunde</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
