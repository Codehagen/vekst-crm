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
import { Business, CustomerStage } from "@prisma/client";

interface KanbanViewProps {
  leads: Business[];
  onStatusChange?: (leadId: string, newStage: CustomerStage) => void;
}

export function KanbanView({ leads, onStatusChange }: KanbanViewProps) {
  // Track which columns are currently being dragged over
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(
    null
  );

  const statusColumns: Record<
    CustomerStage,
    { title: string; description: string; variant: string }
  > = {
    lead: {
      title: "Ny",
      description: "Nye leads som ikke er kontaktet",
      variant: "secondary",
    },
    prospect: {
      title: "Kontaktet",
      description: "Leads som er i dialog",
      variant: "default",
    },
    qualified: {
      title: "Kvalifisert",
      description: "Kvalifiserte leads klare for tilbud",
      variant: "default",
    },
    customer: {
      title: "Kunde",
      description: "Konvertert til kunde",
      variant: "success",
    },
    churned: {
      title: "Tapt",
      description: "Tapte leads",
      variant: "destructive",
    },
  };

  // Group leads by status (we only show lead, prospect, and qualified in the kanban)
  const leadsByStatus = leads.reduce<Record<CustomerStage, Business[]>>(
    (acc, lead) => {
      // Only include these stages in the kanban view
      if (["lead", "prospect", "qualified"].includes(lead.stage)) {
        if (!acc[lead.stage]) {
          acc[lead.stage] = [];
        }
        acc[lead.stage].push(lead);
      }
      return acc;
    },
    { lead: [], prospect: [], qualified: [], customer: [], churned: [] }
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
        // Call the onStatusChange handler if it exists
        if (onStatusChange) {
          // Optimistic update - immediately apply the change in the UI
          // The actual server update will happen in the parent component
          onStatusChange(draggableId, destination.droppableId as CustomerStage);
        }
      }
    },
    [onStatusChange]
  );

  // We only show these stages in the kanban
  const kanbanStages: CustomerStage[] = ["lead", "prospect", "qualified"];

  return (
    <DragDropContext
      onDragStart={handleDragStart}
      onDragUpdate={handleDragUpdate}
      onDragEnd={handleDragEnd}
    >
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {kanbanStages.map((stage) => (
          <div key={stage} className="flex-shrink-0 w-96">
            <div
              className={cn(
                "bg-muted rounded-t-md p-3 border-b transition-colors",
                stage === activeDroppableId && "bg-accent"
              )}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{statusColumns[stage].title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {statusColumns[stage].description}
                  </p>
                </div>
                <Badge
                  variant={
                    statusColumns[stage].variant as
                      | "default"
                      | "destructive"
                      | "outline"
                      | "secondary"
                      | null
                  }
                >
                  {leadsByStatus[stage]?.length || 0}
                </Badge>
              </div>
            </div>

            <Droppable droppableId={stage}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "bg-muted min-h-[600px] rounded-b-md p-2 transition-colors",
                    snapshot.isDraggingOver && "bg-accent/50"
                  )}
                >
                  {leadsByStatus[stage]?.map((lead, index) => (
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
                                <a
                                  href={`/leads/${encodeURIComponent(lead.id)}`}
                                  className="hover:underline transition-colors hover:text-primary"
                                >
                                  {lead.name}
                                </a>
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
                                  {kanbanStages.map(
                                    (status) =>
                                      status !== lead.stage && (
                                        <DropdownMenuItem
                                          key={status}
                                          onClick={() => {
                                            if (onStatusChange) {
                                              onStatusChange(
                                                lead.id,
                                                status as CustomerStage
                                              );
                                            }
                                          }}
                                        >
                                          <div className="flex items-center">
                                            {statusColumns[status].title}
                                          </div>
                                        </DropdownMenuItem>
                                      )
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pb-1">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <User className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                <span>{lead.contactPerson || lead.name}</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <Mail className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                <a
                                  href={`mailto:${lead.email}`}
                                  className="hover:underline transition-colors hover:text-primary"
                                >
                                  {lead.email}
                                </a>
                              </div>
                              <div className="flex items-center text-sm">
                                <Phone className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="hover:underline transition-colors hover:text-primary"
                                >
                                  {lead.phone}
                                </a>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="p-3 pt-0 flex justify-between">
                            <div className="text-xs text-muted-foreground flex items-center">
                              Oppdatert:{" "}
                              {new Date(lead.updatedAt).toLocaleDateString(
                                "no-NO"
                              )}
                            </div>
                            {lead.potensiellVerdi && (
                              <div className="text-sm font-medium">
                                {new Intl.NumberFormat("no-NO", {
                                  style: "currency",
                                  currency: "NOK",
                                  maximumFractionDigits: 0,
                                }).format(lead.potensiellVerdi)}
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      )}
                    </Draggable>
                  ))}
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
