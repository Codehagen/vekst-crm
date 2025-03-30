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
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.status === "resolved" ||
          row.original.status === "closed" ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400 size-4" />
          ) : (
            <IconLoader className="mr-1 size-4" />
          )}
          <span className="capitalize">
            {row.original.status.replace(/_/g, " ")}
          </span>
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          <span className="capitalize">{row.original.priority}</span>
        </Badge>
      </div>
    ),
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
            All Tickets <Badge variant="secondary">{statusCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="open">
            Open <Badge variant="secondary">{statusCounts.open}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress{" "}
            <Badge variant="secondary">{statusCounts.in_progress}</Badge>
          </TabsTrigger>
          <TabsTrigger value="waiting_on_customer">
            Waiting on Customer{" "}
            <Badge variant="secondary">
              {statusCounts.waiting_on_customer}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved <Badge variant="secondary">{statusCounts.resolved}</Badge>
          </TabsTrigger>
          <TabsTrigger value="closed">
            Closed <Badge variant="secondary">{statusCounts.closed}</Badge>
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
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
          <Button variant="outline" size="sm">
            <IconPlus className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Add Ticket</span>
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="flex items-center gap-4 mb-4">
          <Input
            placeholder="Search tickets..."
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
              Page {table.getState().pagination.pageIndex + 1} of{" "}
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
    </Tabs>
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

  return (
    <Drawer
      direction={isMobile ? "bottom" : "right"}
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {ticket.title}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{ticket.title}</DrawerTitle>
          <DrawerDescription>
            Created on {format(ticket.createdAt, "PPP")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid gap-2">
            <div className="flex gap-2 leading-none font-medium">
              Ticket Details
            </div>
          </div>
          <Separator />
          <form className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={ticket.status}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting_on_customer">
                      Waiting on Customer
                    </SelectItem>
                    <SelectItem value="waiting_on_third_party">
                      Waiting on Third Party
                    </SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="priority">Priority</Label>
                <Select defaultValue={ticket.priority}>
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue placeholder="Select a priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="business">Business</Label>
                <Input
                  id="business"
                  defaultValue={ticket.businessName || ""}
                  placeholder="Assign to business"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="assignee">Assignee</Label>
                <Select defaultValue={ticket.assignee || ""}>
                  <SelectTrigger id="assignee" className="w-full">
                    <SelectValue placeholder="Assign ticket" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user123">John Doe</SelectItem>
                    <SelectItem value="user456">Jane Smith</SelectItem>
                    <SelectItem value="user789">Alex Johnson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                defaultValue={ticket.description}
                className="min-h-[120px]"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="comment">Add a comment</Label>
              <Textarea
                id="comment"
                placeholder="Type your comment here..."
                className="min-h-[100px]"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            {ticket.tags.length > 0 && (
              <div className="flex flex-col gap-3">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {ticket.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
        <DrawerFooter>
          <Button onClick={handleSubmitComment}>Submit Comment</Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
