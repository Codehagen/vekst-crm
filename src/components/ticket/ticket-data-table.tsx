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
  IconPlus,
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
import { toast } from "sonner";
import { z } from "zod";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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

import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import {
  Ticket,
  assignTicket,
  updateTicketStatus,
  addTicketComment,
} from "@/lib/actions/ticket-actions";

// Define the ticket schema for client-side validation
export const ticketSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  priority: z.string(),
  businessName: z.string().nullable(),
  contactName: z.string().nullable(),
  assignee: z.string().nullable(),
  creator: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  dueDate: z.date().nullable(),
  tags: z.array(z.string()),
  commentCount: z.number().default(0),
});

// Use the imported Ticket type instead of the schema inference
// export type Ticket = z.infer<typeof ticketSchema>

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
      <span className="sr-only">Drag to reorder</span>
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
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      return <TicketViewer ticket={row.original} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
  },
  {
    accessorKey: "businessName",
    header: "Business",
    cell: ({ row }) => (
      <div className="max-w-[180px] truncate">
        {row.original.businessName || "Unassigned"}
      </div>
    ),
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => (
      <div className="min-w-[100px]">
        {row.original.dueDate
          ? format(row.original.dueDate, "MMM d, yyyy")
          : "No date set"}
      </div>
    ),
  },
  {
    accessorKey: "assignee",
    header: "Assignee",
    cell: ({ row }) => {
      const isAssigned = !!row.original.assignee;

      if (isAssigned) {
        return row.original.assignee;
      }

      return (
        <>
          <Label htmlFor={`${row.original.id}-assignee`} className="sr-only">
            Assignee
          </Label>
          <Select
            onValueChange={(value) =>
              handleTicketAssignee(row.original.id, value)
            }
          >
            <SelectTrigger
              className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              id={`${row.original.id}-assignee`}
            >
              <SelectValue placeholder="Assign ticket" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="user123">John Doe</SelectItem>
              <SelectItem value="user456">Jane Smith</SelectItem>
              <SelectItem value="user789">Alex Johnson</SelectItem>
            </SelectContent>
          </Select>
        </>
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
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleViewTicket(row.original.id)}>
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleEditTicket(row.original.id)}>
            Edit Ticket
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleUpdateStatus(row.original.id, "in_progress")}
          >
            Mark In Progress
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleUpdateStatus(row.original.id, "resolved")}
          >
            Mark Resolved
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleUpdateStatus(row.original.id, "closed")}
          >
            Close Ticket
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

// Action handlers that call server actions
async function handleTicketAssignee(ticketId: string, assigneeId: string) {
  toast.promise(assignTicket(ticketId, assigneeId), {
    loading: `Assigning ticket...`,
    success: `Ticket assigned successfully`,
    error: "Failed to assign ticket",
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
    loading: `Updating ticket status...`,
    success: `Ticket status updated to ${status}`,
    error: "Failed to update ticket status",
  });
}

async function handleAddComment(ticketId: string, content: string) {
  if (!content.trim()) {
    toast.error("Comment cannot be empty");
    return;
  }

  toast.promise(
    addTicketComment(ticketId, content, "current-user", false), // Replace "current-user" with actual user ID
    {
      loading: "Adding comment...",
      success: "Comment added successfully",
      error: "Failed to add comment",
    }
  );
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

  // Filter options based on ticket statuses
  const statusOptions = [
    { value: "all", label: "All Tickets" },
    { value: "unassigned", label: "Unassigned" },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "waiting_on_customer", label: "Waiting on Customer" },
    { value: "waiting_on_third_party", label: "Waiting on Third Party" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  const [activeFilter, setActiveFilter] = React.useState("all");

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setActiveFilter(value);

    if (value === "all") {
      table.getColumn("status")?.setFilterValue(undefined);
    } else {
      table.getColumn("status")?.setFilterValue(value);
    }
  };

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search tickets..."
            className="max-w-sm"
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(e) =>
              table.getColumn("title")?.setFilterValue(e.target.value)
            }
          />
          <Select value={activeFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns
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
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>
      </div>

      <div className="relative flex flex-col gap-4 overflow-auto px-4">
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
                      No tickets found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} ticket(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="w-20" id="rows-per-page">
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
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketViewer({ ticket }: { ticket: Ticket }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [comment, setComment] = React.useState("");

  const handleSubmitComment = async () => {
    await handleAddComment(ticket.id, comment);
    setComment(""); // Clear the comment field after submission
  };

  // Use drawer on mobile, dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="link"
            className="text-foreground w-fit px-0 text-left"
          >
            {ticket.title}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{ticket.title}</DrawerTitle>
            <DrawerDescription>
              Created on {format(ticket.createdAt, "PPP")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">Status</div>
                <StatusBadge status={ticket.status} />
              </div>
              <div className="flex items-center justify-between">
                <div className="font-medium">Priority</div>
                <PriorityBadge priority={ticket.priority} />
              </div>
              <div className="flex items-center justify-between">
                <div className="font-medium">Business</div>
                <div>{ticket.businessName || "Unassigned"}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-medium">Contact</div>
                <div>{ticket.contactName || "N/A"}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-medium">Assignee</div>
                <div>{ticket.assignee || "Unassigned"}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-medium">Due Date</div>
                <div>
                  {ticket.dueDate
                    ? format(ticket.dueDate, "PPP")
                    : "No date set"}
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <div className="font-medium">Description</div>
              <div className="text-sm text-muted-foreground">
                {ticket.description}
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <div className="font-medium">Tags</div>
              <div className="flex flex-wrap gap-2">
                {ticket.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-2">
              <div className="font-medium">Add a comment</div>
              <Textarea
                placeholder="Type your comment here..."
                className="min-h-[100px]"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button className="w-full" onClick={handleSubmitComment}>
                Submit Comment
              </Button>
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop dialog
  return (
    <>
      <Button
        variant="link"
        className="text-foreground w-fit px-0 text-left"
        onClick={() => setOpen(true)}
      >
        {ticket.title}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{ticket.title}</DialogTitle>
            <DialogDescription>
              Created on {format(ticket.createdAt, "PPP")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Status</div>
                <StatusBadge status={ticket.status} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Priority</div>
                <PriorityBadge priority={ticket.priority} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Business</div>
                <div>{ticket.businessName || "Unassigned"}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Contact</div>
                <div>{ticket.contactName || "N/A"}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Assignee</div>
                <div>{ticket.assignee || "Unassigned"}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Due Date</div>
                <div>
                  {ticket.dueDate
                    ? format(ticket.dueDate, "PPP")
                    : "No date set"}
                </div>
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <div className="font-medium">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {ticket.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="font-medium">Description</div>
                <div className="text-sm text-muted-foreground">
                  {ticket.description}
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <div className="font-medium">Add a comment</div>
                <Textarea
                  placeholder="Type your comment here..."
                  className="min-h-[100px]"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <Button onClick={handleSubmitComment}>Submit Comment</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
