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
import { Ticket } from "@/app/actions/tickets";

import {
  assignTicket,
  updateTicketStatus,
  addTicketComment,
  updateTicket,
  createTicket,
  getWorkspaceUsers,
} from "@/app/actions/tickets";
import { getAllBusinesses } from "@/app/actions/businesses/actions";
import { UserAssignSelect } from "./user-assign-select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
          ? format(row.original.dueDate, "MMM d, yyyy")
          : "Ingen frist satt"}
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

// Define the AddTicketSheet component
function AddTicketSheet() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    subject: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    companyName: "",
    status: "open" as string,
    businessId: "",
    assigneeId: "",
  });
  const [businesses, setBusinesses] = React.useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = React.useState(false);
  const [showCustomBusiness, setShowCustomBusiness] = React.useState(false);

  // Fetch businesses when the form opens
  React.useEffect(() => {
    if (open && businesses.length === 0) {
      fetchBusinesses();
    }
  }, [open, businesses.length]);

  // Function to fetch businesses
  const fetchBusinesses = async () => {
    try {
      setIsLoadingBusinesses(true);
      const businessList = await getAllBusinesses();
      setBusinesses(businessList.map((b) => ({ id: b.id, name: b.name })));
    } catch (error) {
      console.error("Error loading businesses:", error);
    } finally {
      setIsLoadingBusinesses(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriorityChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      priority: value as "low" | "medium" | "high" | "urgent",
    }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleBusinessChange = (value: string) => {
    if (value === "custom") {
      setShowCustomBusiness(true);
      setFormData((prev) => ({ ...prev, businessId: "" }));
    } else {
      setShowCustomBusiness(false);
      setFormData((prev) => ({ ...prev, businessId: value, companyName: "" }));
    }
  };

  const handleAssign = (ticketId: string, userId: string) => {
    setFormData((prev) => ({ ...prev, assigneeId: userId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare data for submission
      const ticketData = {
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        assigneeId: formData.assigneeId || undefined,
        // Include either businessId or companyName
        ...(formData.businessId
          ? { businessId: formData.businessId }
          : { companyName: formData.companyName }),
      };

      const response = await createTicket(ticketData);

      await toast.promise(Promise.resolve(response), {
        loading: "Oppretter sak...",
        success: "Sak opprettet",
        error: "Kunne ikke opprette sak",
      });

      if (response.success) {
        setFormData({
          subject: "",
          description: "",
          priority: "medium" as "low" | "medium" | "high" | "urgent",
          companyName: "",
          status: "open",
          businessId: "",
          assigneeId: "",
        });
        setOpen(false);
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <IconPlus className="mr-2 h-4 w-4" />
          <span className="hidden lg:inline">Legg til sak</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-md w-[90vw]">
        <SheetHeader>
          <SheetTitle>Opprett ny sak</SheetTitle>
          <SheetDescription>
            Fyll ut informasjonen for å opprette en ny sak.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="subject" className="required">
              Tittel
            </Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Kort beskrivelse av saken"
              required
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="description" className="required">
              Beskrivelse
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detaljert beskrivelse av saken"
              className="min-h-[120px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Velg status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Åpen</SelectItem>
                  <SelectItem value="in_progress">Pågående</SelectItem>
                  <SelectItem value="waiting_on_customer">
                    Venter på kunde
                  </SelectItem>
                  <SelectItem value="waiting_on_third_party">
                    Venter på tredjepart
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <Label htmlFor="priority">Prioritet</Label>
              <Select
                value={formData.priority}
                onValueChange={handlePriorityChange}
              >
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue placeholder="Velg prioritet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Lav</SelectItem>
                  <SelectItem value="medium">Middels</SelectItem>
                  <SelectItem value="high">Høy</SelectItem>
                  <SelectItem value="urgent">Kritisk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="business">Bedrift</Label>
            <Select
              value={
                formData.businessId || (showCustomBusiness ? "custom" : "")
              }
              onValueChange={handleBusinessChange}
            >
              <SelectTrigger id="business" className="w-full">
                <SelectValue placeholder="Velg bedrift" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingBusinesses ? (
                  <SelectItem value="loading" disabled>
                    Laster bedrifter...
                  </SelectItem>
                ) : (
                  <>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Annen bedrift</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            {showCustomBusiness && (
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Skriv inn bedriftsnavn"
                className="mt-2"
              />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="assignee">Tildelt til</Label>
            <div className="w-full">
              <UserAssignSelect ticketId="new-ticket" onAssign={handleAssign} />
            </div>
          </div>

          <SheetFooter className="pt-4">
            <Button
              type="submit"
              disabled={
                isSubmitting || !formData.subject || !formData.description
              }
              className="w-full"
            >
              {isSubmitting ? "Oppretter..." : "Opprett sak"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
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
          <AddTicketSheet />
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

function TicketViewer({ ticket }: { ticket: Ticket }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [comment, setComment] = React.useState("");

  // Add state for editable fields
  const [status, setStatus] = React.useState(ticket.status);
  const [priority, setPriority] = React.useState(ticket.priority);
  const [businessName, setBusinessName] = React.useState(
    ticket.businessName || ""
  );
  const [description, setDescription] = React.useState(ticket.description);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Track changes when editing fields - only for fields that don't auto-save
  React.useEffect(() => {
    const changes =
      businessName !== (ticket.businessName || "") ||
      description !== ticket.description;

    setHasChanges(changes);
  }, [businessName, description, ticket]);

  const handleSubmitComment = async () => {
    await handleAddComment(ticket.id, comment);
    setComment(""); // Clear the comment field after submission
  };

  // Status change handler with immediate save
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;

    setStatus(newStatus);
    try {
      await toast.promise(updateTicketStatus(ticket.id, newStatus), {
        loading: "Oppdaterer status...",
        success: `Status oppdatert til ${statusMap[newStatus] || newStatus}`,
        error: "Kunne ikke oppdatere status",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      // Reset to original value on error
      setStatus(ticket.status);
    }
  };

  // Priority change handler with immediate save
  const handlePriorityChange = async (newPriority: string) => {
    if (newPriority === priority) return;

    setPriority(newPriority);
    try {
      const result = await toast.promise(
        updateTicket(ticket.id, { priority: newPriority }),
        {
          loading: "Oppdaterer prioritet...",
          success: `Prioritet oppdatert til ${
            priorityMap[newPriority] || newPriority
          }`,
          error: "Kunne ikke oppdatere prioritet",
        }
      );

      // Success is handled by the toast
    } catch (error) {
      console.error("Error updating priority:", error);
      // Reset to original value on error
      setPriority(ticket.priority);
    }
  };

  // Handler for saving text fields
  const handleSaveChanges = async () => {
    if (!hasChanges) return;

    setIsSubmitting(true);
    try {
      // Prepare update data with proper type annotation
      const updateData: Record<string, any> = {
        description,
      };

      // Only include businessName if it's been changed and is not empty
      if (businessName && businessName !== ticket.businessName) {
        // Using a more generic Record type to avoid TypeScript errors
        updateData.submittedCompanyName = businessName;
      }

      await toast.promise(updateTicket(ticket.id, updateData), {
        loading: "Lagrer endringer...",
        success: "Sak oppdatert",
        error: "Kunne ikke oppdatere sak",
      });

      // Success is handled by the toast
      setHasChanges(false);
    } catch (error) {
      console.error("Error updating ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
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
            Opprettet {format(ticket.createdAt, "PPP")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid gap-2">
            <div className="flex gap-2 leading-none font-medium">
              Saksdetaljer
            </div>
          </div>
          <Separator />
          <form className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Velg status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Åpen</SelectItem>
                    <SelectItem value="in_progress">Pågående</SelectItem>
                    <SelectItem value="waiting_on_customer">
                      Venter på kunde
                    </SelectItem>
                    <SelectItem value="waiting_on_third_party">
                      Venter på tredjepart
                    </SelectItem>
                    <SelectItem value="resolved">Løst</SelectItem>
                    <SelectItem value="closed">Lukket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="priority">Prioritet</Label>
                <Select value={priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue placeholder="Velg prioritet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Lav</SelectItem>
                    <SelectItem value="medium">Middels</SelectItem>
                    <SelectItem value="high">Høy</SelectItem>
                    <SelectItem value="urgent">Kritisk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="business">Bedrift</Label>
                <Input
                  id="business"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Tildel til bedrift"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="assignee">Tildelt til</Label>
                <UserAssignSelect
                  ticketId={ticket.id}
                  onAssign={handleTicketAssignee}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="comment">Legg til kommentar</Label>
              <Textarea
                id="comment"
                placeholder="Skriv kommentaren din her..."
                className="min-h-[100px]"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            {ticket.tags.length > 0 && (
              <div className="flex flex-col gap-3">
                <Label>Tagger</Label>
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
        <DrawerFooter className="flex flex-col sm:flex-row gap-2">
          {hasChanges && (
            <Button
              onClick={handleSaveChanges}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Lagrer..." : "Lagre endringer"}
            </Button>
          )}
          <Button
            onClick={handleSubmitComment}
            disabled={!comment.trim()}
            className="w-full sm:w-auto"
          >
            Send kommentar
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Lukk
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
