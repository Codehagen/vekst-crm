"use client";

import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconPlus,
  IconCircleCheckFilled,
  IconLoader,
} from "@tabler/icons-react";
import {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { PriorityBadge } from "./priority-badge";
import { Ticket } from "@/app/actions/tickets";

import {
  assignTicket,
  updateTicketStatus,
  addTicketComment,
  updateTicket,
  createTicket,
  getWorkspaceUsers,
  deleteTickets,
} from "@/app/actions/tickets";
import { getAllBusinesses } from "@/app/actions/businesses/actions";
import { UserAssignSelect } from "./user-assign-select";

import { AddTicketSheet } from "./add-ticket-sheet";
import { TicketViewer } from "./ticket-viewer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Status text mapping
const statusMap: Record<string, string> = {
  unassigned: "Ikke tildelt",
  open: "Åpen",
  in_progress: "Under arbeid",
  waiting_on_customer: "Venter på kunde",
  waiting_on_third_party: "Venter på tredjepart",
  resolved: "Løst",
  closed: "Lukket",
};

// Status color mapping for loader icons
const statusColorMap: Record<string, string> = {
  unassigned: "text-gray-500",
  open: "text-blue-500",
  in_progress: "text-yellow-500",
  waiting_on_customer: "text-purple-500",
  waiting_on_third_party: "text-orange-500",
  resolved: "fill-green-500 dark:fill-green-400",
  closed: "fill-green-500 dark:fill-green-400",
};

// Priority text mapping
const priorityMap: Record<string, string> = {
  low: "Lav",
  medium: "Middels",
  high: "Høy",
  urgent: "Kritisk",
};

// Create a separate component for the drag handle
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Dra for å omorganisere</span>
    </Button>
  );
}

// Define table columns for tickets
const columns: ColumnDef<Ticket>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Velg alle"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Velg rad"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: "Tittel",
    cell: ({ row }) => {
      return (
        <TicketViewer
          ticket={row.original}
          onTicketUpdated={() => window.location.reload()}
        />
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.status === "resolved" ||
          row.original.status === "closed" ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400 size-4" />
          ) : (
            <IconLoader
              className={`mr-1 size-4 ${
                statusColorMap[row.original.status] || ""
              }`}
            />
          )}
          <span>
            {statusMap[row.original.status] ||
              row.original.status.replace(/_/g, " ")}
          </span>
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "priority",
    header: "Prioritet",
    cell: ({ row }) => (
      <div className="w-32">
        <PriorityBadge priority={row.original.priority} />
      </div>
    ),
  },
  {
    accessorKey: "businessName",
    header: "Bedrift",
    cell: ({ row }) => (
      <div className="max-w-[180px] truncate">
        {row.original.businessName || "Ikke tildelt"}
      </div>
    ),
  },
  {
    accessorKey: "dueDate",
    header: "Frist",
    cell: ({ row }) => (
      <div className="min-w-[100px]">
        {row.original.dueDate
          ? format(row.original.dueDate, "d. MMM yyyy", { locale: nb })
          : "Ingen frist satt"}
      </div>
    ),
  },
  {
    accessorKey: "estimatedTime",
    header: "Estimert tid",
    cell: ({ row }) => (
      <div className="min-w-[80px]">
        {row.original.estimatedTime
          ? `${row.original.estimatedTime} min`
          : "Ikke satt"}
      </div>
    ),
  },
  {
    accessorKey: "assignee",
    header: "Tildelt til",
    cell: ({ row }) => {
      const isAssigned = !!row.original.assignee;

      if (isAssigned) {
        return row.original.assignee;
      }

      return (
        <UserAssignSelect
          ticketId={row.original.id}
          onAssign={handleTicketAssignee}
        />
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Åpne meny</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleViewTicket(row.original.id)}>
            Vis detaljer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleEditTicket(row.original.id)}>
            Rediger sak
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleUpdateStatus(row.original.id, "in_progress")}
          >
            Merk som under arbeid
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleUpdateStatus(row.original.id, "resolved")}
          >
            Merk som løst
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleUpdateStatus(row.original.id, "closed")}
          >
            Lukk sak
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

// Action handlers that call server actions
async function handleTicketAssignee(ticketId: string, assigneeId: string) {
  toast.promise(assignTicket(ticketId, assigneeId), {
    loading: `Tildeler sak...`,
    success: `Sak tildelt`,
    error: "Kunne ikke tildele sak",
  });
}

function handleViewTicket(ticketId: string) {
  console.log(`View ticket ${ticketId}`);
  // Navigate to ticket detail page
}

function handleEditTicket(ticketId: string) {
  console.log(`Edit ticket ${ticketId}`);
  // Open edit modal or navigate to edit page
}

async function handleUpdateStatus(ticketId: string, status: string) {
  toast.promise(updateTicketStatus(ticketId, status), {
    loading: `Oppdaterer status...`,
    success: `Status oppdatert til ${statusMap[status] || status}`,
    error: "Kunne ikke oppdatere status",
  });
}

async function handleAddComment(ticketId: string, content: string) {
  if (!content.trim()) {
    toast.error("Kommentar kan ikke være tom");
    return;
  }

  toast.promise(addTicketComment(ticketId, content, undefined, false), {
    loading: "Legger til kommentar...",
    success: "Kommentar lagt til",
    error: "Kunne ikke legge til kommentar",
  });
}

function DraggableRow({ row }: { row: Row<Ticket> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function TicketDataTable({ data: initialData }: { data: Ticket[] }) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [activeTab, setActiveTab] = React.useState("all");
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  // Calculate ticket counts by status
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: initialData.length,
      open: 0,
      in_progress: 0,
      waiting_on_customer: 0,
      waiting_on_third_party: 0,
      resolved: 0,
      closed: 0,
    };

    initialData.forEach((ticket) => {
      if (counts[ticket.status] !== undefined) {
        counts[ticket.status]++;
      }
    });

    return counts;
  }, [initialData]);

  // Filter data based on selected tab
  React.useEffect(() => {
    if (activeTab === "all") {
      setData(initialData);
    } else {
      setData(initialData.filter((ticket) => ticket.status === activeTab));
    }
    // Reset pagination when switching tabs
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [activeTab, initialData]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Clear any filters when changing tabs
    table.resetColumnFilters();
  };

  // Handler for deleting selected tickets
  async function handleDeleteSelected() {
    const selectedRowIds = Object.keys(rowSelection);
    if (selectedRowIds.length === 0) return;

    setIsDeleting(true);
    try {
      const response = await deleteTickets(selectedRowIds);

      if (response.success) {
        toast.success(
          `${response.count} ${response.count === 1 ? "sak" : "saker"} slettet`
        );
        // Remove deleted tickets from the table data
        setData((currentData) =>
          currentData.filter((row) => !selectedRowIds.includes(row.id))
        );
        // Clear row selection
        setRowSelection({});
      } else {
        toast.error(response.error || "Kunne ikke slette saker");
      }
    } catch (error) {
      console.error("Error deleting tickets:", error);
      toast.error("En feil oppstod ved sletting av saker");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }

  return (
    <Tabs
      defaultValue="all"
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
          <TabsTrigger value="all">
            Alle saker <Badge variant="secondary">{statusCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="open">
            Åpne <Badge variant="secondary">{statusCounts.open}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            Pågående{" "}
            <Badge variant="secondary">{statusCounts.in_progress}</Badge>
          </TabsTrigger>
          <TabsTrigger value="waiting_on_customer">
            Venter på kunde{" "}
            <Badge variant="secondary">
              {statusCounts.waiting_on_customer}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Løst <Badge variant="secondary">{statusCounts.resolved}</Badge>
          </TabsTrigger>
          <TabsTrigger value="closed">
            Lukket <Badge variant="secondary">{statusCounts.closed}</Badge>
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Slett ({Object.keys(rowSelection).length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Slett saker</DialogTitle>
                  <DialogDescription>
                    Er du sikker på at du vil slette{" "}
                    {Object.keys(rowSelection).length}{" "}
                    {Object.keys(rowSelection).length === 1 ? "sak" : "saker"}?
                    Denne handlingen kan ikke angres.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={isDeleting}
                  >
                    Avbryt
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteSelected}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Sletter..." : "Slett"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline">Tilpass kolonner</span>
                <span className="lg:hidden">Kolonner</span>
                <IconChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <AddTicketSheet
            onTicketCreated={() => {
              // Refresh data after a new ticket is created
              // This assumes there is a function to reload data or the component will be refreshed by the parent
              window.location.reload();
            }}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="flex items-center gap-4 mb-4">
          <Input
            placeholder="Søk i saker..."
            className="max-w-sm"
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(e) =>
              table.getColumn("title")?.setFilterValue(e.target.value)
            }
          />
        </div>
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Ingen saker funnet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} av{" "}
            {table.getFilteredRowModel().rows.length} sak(er) valgt.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rader per side
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Side {table.getState().pagination.pageIndex + 1} av{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Gå til første side</span>
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Gå til forrige side</span>
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Gå til neste side</span>
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Gå til siste side</span>
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Tabs>
  );
}
