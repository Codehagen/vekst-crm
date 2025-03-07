"use client";

import { useCallback, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, User, Phone, Mail, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Lead } from "./columns";

interface KanbanViewProps {
  leads: Lead[];
  onStatusChange?: (leadId: string, newStatus: Lead["status"]) => void;
}

export function KanbanView({ leads, onStatusChange }: KanbanViewProps) {
  // Track which columns are currently being dragged over
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(
    null
  );

  const statusColumns: Record<
    Lead["status"],
    { title: string; description: string; variant: string }
  > = {
    ny: {
      title: "Ny",
      description: "Nye leads som ikke er kontaktet",
      variant: "secondary",
    },
    kontaktet: {
      title: "Kontaktet",
      description: "Leads som er i dialog",
      variant: "default",
    },
    ferdig: {
      title: "Ferdig",
      description: "Avsluttede leads",
      variant: "success",
    },
  };

  // Group leads by status
  const leadsByStatus = leads.reduce<Record<Lead["status"], Lead[]>>(
    (acc, lead) => {
      if (!acc[lead.status]) {
        acc[lead.status] = [];
      }
      acc[lead.status].push(lead);
      return acc;
    },
    { ny: [], kontaktet: [], ferdig: [] }
  );

  // Handle drag start
  const handleDragStart = useCallback(() => {
    // Optional: Add some visual feedback when drag starts
  }, []);

  // Handle drag update - track which column we're hovering over
  const handleDragUpdate = useCallback((update: any) => {
    const { destination } = update;
    setActiveDroppableId(destination?.droppableId || null);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    (result: any) => {
      // Clear the active droppable
      setActiveDroppableId(null);

      const { source, destination, draggableId } = result;

      // Dropped outside the list
      if (!destination) {
        return;
      }

      // Moved to a different status
      if (source.droppableId !== destination.droppableId) {
        // Find the dragged lead
        const draggedLead = leads.find((lead) => lead.id === draggableId);

        if (draggedLead) {
          // Show success toast
          toast.success(
            <div className="flex flex-col gap-1">
              <div className="font-medium">Lead status oppdatert</div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{draggedLead.selskap}</span> ble
                flyttet fra{" "}
                <Badge variant="outline" className="ml-1 mr-1">
                  {statusColumns[source.droppableId as Lead["status"]].title}
                </Badge>
                <MoveRight className="inline h-3 w-3 mx-1" />
                <Badge variant="outline" className="ml-1">
                  {
                    statusColumns[destination.droppableId as Lead["status"]]
                      .title
                  }
                </Badge>
              </div>
            </div>
          );
        }

        // Call the onStatusChange handler if it exists
        if (onStatusChange) {
          onStatusChange(
            draggableId,
            destination.droppableId as Lead["status"]
          );
        }
      }
    },
    [leads, onStatusChange, statusColumns]
  );

  return (
    <DragDropContext
      onDragStart={handleDragStart}
      onDragUpdate={handleDragUpdate}
      onDragEnd={handleDragEnd}
    >
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {Object.entries(statusColumns).map(([status, column]) => (
          <div key={status} className="flex-shrink-0 w-96">
            <div
              className={cn(
                "bg-muted rounded-t-md p-3 border-b transition-colors",
                status === activeDroppableId && "bg-accent"
              )}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{column.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {column.description}
                  </p>
                </div>
                <Badge
                  variant={
                    column.variant as
                      | "default"
                      | "destructive"
                      | "outline"
                      | "secondary"
                      | null
                  }
                >
                  {leadsByStatus[status as Lead["status"]]?.length || 0}
                </Badge>
              </div>
            </div>

            <Droppable droppableId={status}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "bg-muted min-h-[600px] rounded-b-md p-2 transition-colors",
                    snapshot.isDraggingOver && "bg-accent/50"
                  )}
                >
                  {leadsByStatus[status as Lead["status"]]?.map(
                    (lead, index) => (
                      <Draggable
                        key={lead.id}
                        draggableId={lead.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "mb-3 transition-shadow",
                              snapshot.isDragging && "shadow-lg"
                            )}
                          >
                            <CardHeader className="p-3 pb-0">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-sm font-medium">
                                  {lead.selskap ? (
                                    <a
                                      href={`/bedrifter/${encodeURIComponent(
                                        lead.id
                                      )}`}
                                      className="hover:underline transition-colors hover:text-primary"
                                    >
                                      {lead.selskap}
                                    </a>
                                  ) : (
                                    "Ingen bedrift"
                                  )}
                                </CardTitle>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                    >
                                      <span className="sr-only">Åpne meny</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                      Handlinger
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem>
                                      Vis detaljer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      Rediger lead
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>
                                      Endre status
                                    </DropdownMenuLabel>
                                    {Object.entries(statusColumns).map(
                                      ([status, statusInfo]) =>
                                        status !== lead.status && (
                                          <DropdownMenuItem
                                            key={status}
                                            onClick={() => {
                                              if (onStatusChange) {
                                                onStatusChange(
                                                  lead.id,
                                                  status as Lead["status"]
                                                );

                                                // Show success toast when status is updated manually
                                                toast.success(
                                                  <div className="flex flex-col gap-1">
                                                    <div className="font-medium">
                                                      Lead status oppdatert
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                      <span className="font-medium">
                                                        {lead.navn}
                                                      </span>{" "}
                                                      ble flyttet til{" "}
                                                      <Badge
                                                        variant="outline"
                                                        className="ml-1"
                                                      >
                                                        {statusInfo.title}
                                                      </Badge>
                                                    </div>
                                                  </div>
                                                );
                                              }
                                            }}
                                          >
                                            <Badge
                                              variant={
                                                statusInfo.variant as
                                                  | "default"
                                                  | "destructive"
                                                  | "outline"
                                                  | "secondary"
                                                  | null
                                              }
                                              className="mr-2"
                                            >
                                              {statusInfo.title}
                                            </Badge>
                                            Flytt til{" "}
                                            {statusInfo.title.toLowerCase()}
                                          </DropdownMenuItem>
                                        )
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      Konverter til kunde
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 text-xs space-y-2">
                              <div className="flex items-center">
                                <User className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                <span className="font-medium">{lead.navn}</span>
                              </div>
                              <div className="flex items-center">
                                <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                {lead.telefon}
                              </div>
                              <div className="flex items-center truncate">
                                <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                <span className="truncate">{lead.epost}</span>
                              </div>
                            </CardContent>
                            <CardFooter className="p-3 pt-0 flex justify-between items-center">
                              <Badge variant="outline" className="text-xs">
                                Verdi
                              </Badge>
                              <div className="text-xs font-medium">
                                {new Intl.NumberFormat("no-NO", {
                                  style: "currency",
                                  currency: "NOK",
                                  maximumFractionDigits: 0,
                                }).format(lead.potensiellVerdi)}
                              </div>
                            </CardFooter>
                          </Card>
                        )}
                      </Draggable>
                    )
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
