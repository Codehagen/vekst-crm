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
import {
  MoreHorizontal,
  User,
  Phone,
  Mail,
  MoveRight,
  Eye,
} from "lucide-react";
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
import Link from "next/link";

interface KanbanViewProps {
  leads: Business[];
  onStatusChange?: (leadId: string, newStage: CustomerStage) => void;
}

export function KanbanView({ leads, onStatusChange }: KanbanViewProps) {
  // Define all status columns with appropriate titles and descriptions
  const statusColumns: {
    id: CustomerStage;
    title: string;
    description: string;
  }[] = [
    {
      id: "lead",
      title: "Nye leads",
      description: "Leads som ikke er kontaktet",
    },
    {
      id: "prospect",
      title: "Kontaktet",
      description: "Leads som er i dialog",
    },
    {
      id: "qualified",
      title: "Kvalifisert",
      description: "Leads klare for tilbud",
    },
    {
      id: "offer_sent",
      title: "Tilbud sendt",
      description: "Venter på svar fra kunde",
    },
    {
      id: "offer_accepted",
      title: "Tilbud akseptert",
      description: "Tilbud akseptert av kunde",
    },
    {
      id: "declined",
      title: "Takket nei",
      description: "Kunde takket nei eller feil match",
    },
    {
      id: "customer",
      title: "Kunde",
      description: "Konvertert til kunde",
    },
    {
      id: "churned",
      title: "Tapt",
      description: "Tapte leads",
    },
  ];

  // Group leads by status initially
  const initialColumns = statusColumns.reduce<
    Record<CustomerStage, Business[]>
  >(
    (acc, column) => {
      acc[column.id] = leads.filter((lead) => lead.stage === column.id);
      return acc;
    },
    {
      lead: [],
      prospect: [],
      qualified: [],
      offer_sent: [],
      offer_accepted: [],
      declined: [],
      customer: [],
      churned: [],
    }
  );

  const [columns, setColumns] = useState(initialColumns);

  // Handle drag end
  const handleDragEnd = useCallback(
    (result: any) => {
      const { source, destination, draggableId } = result;

      // Dropped outside the list
      if (!destination) {
        return;
      }

      // If dropped in the same place
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const sourceStatus = source.droppableId as CustomerStage;
      const destinationStatus = destination.droppableId as CustomerStage;

      // Find the lead that was dragged
      const lead = leads.find((lead) => lead.id === draggableId);
      if (!lead) return;

      // Update local state optimistically
      setColumns((prev) => {
        const newColumns = { ...prev };
        // Remove from source column
        newColumns[sourceStatus] = newColumns[sourceStatus].filter(
          (lead) => lead.id !== draggableId
        );

        // Add to destination column with updated status
        const updatedLead = { ...lead, stage: destinationStatus };
        newColumns[destinationStatus] = [
          ...newColumns[destinationStatus].slice(0, destination.index),
          updatedLead,
          ...newColumns[destinationStatus].slice(destination.index),
        ];

        return newColumns;
      });

      // Call the onStatusChange handler if it exists
      if (onStatusChange) {
        onStatusChange(draggableId, destinationStatus);
      }
    },
    [leads, onStatusChange]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex overflow-x-auto pb-4 space-x-4 min-h-[550px]">
        {statusColumns.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 flex flex-col h-full"
          >
            <div className="mb-2 sticky top-0">
              <h3 className="text-sm font-medium">{column.title}</h3>
              <p className="text-xs text-muted-foreground">
                {column.description}
              </p>
            </div>

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 min-h-[500px] rounded-lg border border-dashed p-2 bg-muted/40",
                    snapshot.isDraggingOver && "bg-accent/20"
                  )}
                >
                  {columns[column.id].length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">
                        Ingen leads
                      </p>
                    </div>
                  ) : (
                    columns[column.id].map((lead, index) => (
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
                            className="mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                          >
                            <CardHeader className="p-3 pb-0">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-sm font-medium truncate">
                                  {lead.name}
                                </CardTitle>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <span className="sr-only">Åpne meny</span>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <Link href={`/leads/${lead.id}`}>
                                      <DropdownMenuItem>
                                        Vis detaljer
                                      </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem>
                                      Send e-post
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3">
                              <div className="grid grid-cols-1 gap-y-1 text-xs">
                                <div className="flex items-center">
                                  <User className="h-3 w-3 mr-1 text-muted-foreground" />
                                  <span className="truncate">
                                    {lead.contactPerson || lead.name}
                                  </span>
                                </div>

                                {lead.email && (
                                  <div className="flex items-center truncate">
                                    <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                                    <span className="truncate">
                                      {lead.email}
                                    </span>
                                  </div>
                                )}

                                {lead.phone && (
                                  <div className="flex items-center">
                                    <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                                    <span>{lead.phone}</span>
                                  </div>
                                )}
                              </div>

                              <div className="mt-2 pt-2 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                                <div>
                                  {new Date(lead.updatedAt).toLocaleDateString(
                                    "no-NO"
                                  )}
                                </div>
                                {lead.potensiellVerdi && (
                                  <div className="font-medium">
                                    {new Intl.NumberFormat("no-NO", {
                                      style: "currency",
                                      currency: "NOK",
                                      maximumFractionDigits: 0,
                                    }).format(lead.potensiellVerdi)}
                                  </div>
                                )}
                                <Link
                                  href={`/leads/${lead.id}`}
                                  className="text-primary hover:underline"
                                >
                                  Vis
                                </Link>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))
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
