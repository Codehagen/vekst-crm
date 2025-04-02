"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, ExternalLink } from "lucide-react";
import {
  Business,
  BusinessStatus,
  CustomerStage,
  Contact,
} from "@prisma/client";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Helper function to get stage badge
function getStageBadge(stage: CustomerStage) {
  const stageConfig: Record<
    CustomerStage,
    {
      label: string;
      variant: "default" | "outline" | "secondary" | "destructive";
    }
  > = {
    lead: { label: "Lead", variant: "outline" },
    prospect: { label: "Prospekt", variant: "secondary" },
    qualified: { label: "Kvalifisert", variant: "secondary" },
    offer_sent: { label: "Tilbud sendt", variant: "default" },
    offer_accepted: { label: "Tilbud akseptert", variant: "default" },
    declined: { label: "Avslått", variant: "destructive" },
    customer: { label: "Kunde", variant: "default" },
    churned: { label: "Tapt", variant: "destructive" },
  };

  const config = stageConfig[stage];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Extend Business type to include contacts
interface BusinessWithContacts extends Business {
  contacts?: Contact[];
}

// Column definitions
export const columns: ColumnDef<BusinessWithContacts>[] = [
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
      const name = row.getValue("name") as string;
      const id = row.original.id;

      return (
        <Link
          href={`/businesses/${id}`}
          className="font-medium text-primary hover:underline flex items-center gap-1"
        >
          {name}
          <ExternalLink className="h-3 w-3 inline opacity-50" />
        </Link>
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
    accessorKey: "contactPerson",
    header: "Kontaktperson",
  },
  {
    accessorKey: "stage",
    header: "Status",
    cell: ({ row }) => {
      const stage = row.getValue("stage") as CustomerStage;
      return getStageBadge(stage);
    },
  },
  {
    accessorKey: "industry",
    header: "Bransje",
    cell: ({ row }) => <div>{row.getValue("industry") || "-"}</div>,
  },
  {
    id: "primaryContact",
    header: "Primær kontakt",
    cell: ({ row }) => {
      const contacts = row.original.contacts;
      const primaryContact = contacts?.find(
        (contact: Contact) => contact.isPrimary
      );

      if (!primaryContact)
        return <div className="text-muted-foreground">Ingen</div>;

      return (
        <Link
          href={`/businesses/${row.original.id}?tab=contacts`}
          className="text-primary hover:underline"
        >
          {primaryContact.name}
        </Link>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const business = row.original;

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
            <DropdownMenuItem asChild>
              <Link href={`/businesses/${business.id}`}>Se detaljer</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/businesses/${business.id}/edit`}>Rediger</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Slett</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
