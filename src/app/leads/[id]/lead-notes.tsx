"use client";

import { useState } from "react";
import { Business } from "@prisma/client";
import { toast } from "sonner";
import { FileText, Plus, Save, X, Trash2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeadNotesProps {
  lead: Business;
}

interface Note {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
}

export function LeadNotes({ lead }: LeadNotesProps) {
  // Example notes - in a real app, these would come from a database
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      content:
        lead.notes ||
        "Første kontakt med leaden. De er interessert i våre tjenester og ønsker mer informasjon.",
      createdAt: new Date(lead.createdAt),
      createdBy: "Jan Johansen",
    },
  ]);

  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add a new note
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Notatet kan ikke være tomt");
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real app, you would call an API to save the note
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      const note: Note = {
        id: Date.now().toString(),
        content: newNote,
        createdAt: new Date(),
        createdBy: "Jan Johansen", // In a real app, this would be the current user
      };

      setNotes([note, ...notes]);
      setNewNote("");
      setShowAddNote(false);
      toast.success("Notat lagt til");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Kunne ikke legge til notat");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date nicely
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return (
        "I dag " +
        date.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })
      );
    } else if (days === 1) {
      return (
        "I går " +
        date.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })
      );
    } else if (days < 7) {
      return days + " dager siden";
    } else {
      return date.toLocaleDateString("no-NO", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Notater</h3>
        <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Legg til notat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Legg til nytt notat</DialogTitle>
              <DialogDescription>
                Legg til et notat om {lead.name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Skriv notatet ditt her..."
                className="min-h-[150px]"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddNote(false)}
                disabled={isSubmitting}
                className="gap-1"
              >
                <X className="h-4 w-4" /> Avbryt
              </Button>
              <Button
                onClick={handleAddNote}
                disabled={isSubmitting || !newNote.trim()}
                className="gap-1"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Lagrer..." : "Lagre notat"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id} className="bg-white border">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {note.createdBy.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{note.createdBy}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(note.createdAt)}
                      </p>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Slett notat</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm">
                  {note.content}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border rounded-lg bg-muted/10">
          <p className="text-muted-foreground">Ingen notater registrert</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 gap-1"
            onClick={() => setShowAddNote(true)}
          >
            <Plus className="h-4 w-4" /> Legg til første notat
          </Button>
        </div>
      )}
    </div>
  );
}
