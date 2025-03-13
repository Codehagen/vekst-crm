"use client";

import { useState } from "react";
import { Business } from "@prisma/client";
import {
  Plus,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface LeadActivityProps {
  lead: Business;
}

// Activity types
type ActivityType = "call" | "email" | "meeting" | "sms" | "note";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  date: Date;
  completed: boolean;
  dueDate?: Date;
}

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  call: "bg-blue-50 text-blue-700",
  email: "bg-purple-50 text-purple-700",
  meeting: "bg-green-50 text-green-700",
  sms: "bg-amber-50 text-amber-700",
  note: "bg-gray-50 text-gray-700",
};

export function LeadActivity({ lead }: LeadActivityProps) {
  // Example activities - in a real app, these would come from a database
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: "1",
      type: "call",
      title: "Introduksjonssamtale",
      description: "Ring for å presentere våre tjenester",
      date: new Date(),
      completed: true,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      id: "2",
      type: "email",
      title: "Send produktinfo",
      description: "Send informasjon om våre tjenester og priser",
      date: new Date(),
      completed: false,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
    },
  ]);

  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivity, setNewActivity] = useState<{
    type: ActivityType;
    title: string;
    description: string;
    dueDate: string;
  }>({
    type: "call",
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
  });

  // Handle adding a new activity
  const handleAddActivity = () => {
    if (!newActivity.title) {
      toast.error("Tittel må fylles ut");
      return;
    }

    const activity: Activity = {
      id: Date.now().toString(),
      type: newActivity.type,
      title: newActivity.title,
      description: newActivity.description,
      date: new Date(),
      completed: false,
      dueDate: newActivity.dueDate ? new Date(newActivity.dueDate) : undefined,
    };

    setActivities((prev) => [activity, ...prev]);
    toast.success("Aktivitet lagt til");
    setShowAddActivity(false);

    // Reset form
    setNewActivity({
      type: "call",
      title: "",
      description: "",
      dueDate: new Date().toISOString().split("T")[0],
    });
  };

  // Toggle activity completion status
  const toggleActivityStatus = (id: string) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === id
          ? { ...activity, completed: !activity.completed }
          : activity
      )
    );
  };

  // Format date to readable string
  const formatDate = (date?: Date) => {
    if (!date) return "";
    return date.toLocaleDateString("no-NO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate if an activity is overdue
  const isOverdue = (activity: Activity) => {
    if (!activity.dueDate || activity.completed) return false;
    return new Date() > activity.dueDate;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Aktiviteter</h3>
        <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Legg til aktivitet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Legg til ny aktivitet</DialogTitle>
              <DialogDescription>
                Legg til en ny aktivitet eller oppgave knyttet til {lead.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="activity-type">Type aktivitet</Label>
                <Select
                  value={newActivity.type}
                  onValueChange={(value: ActivityType) =>
                    setNewActivity({ ...newActivity, type: value })
                  }
                >
                  <SelectTrigger id="activity-type">
                    <SelectValue placeholder="Velg type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Telefonsamtale
                      </div>
                    </SelectItem>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> E-post
                      </div>
                    </SelectItem>
                    <SelectItem value="meeting">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Møte
                      </div>
                    </SelectItem>
                    <SelectItem value="sms">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> SMS
                      </div>
                    </SelectItem>
                    <SelectItem value="note">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Notat
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity-title">Tittel</Label>
                <Input
                  id="activity-title"
                  value={newActivity.title}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, title: e.target.value })
                  }
                  placeholder="F.eks. Oppfølgingssamtale"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity-description">Beskrivelse</Label>
                <Textarea
                  id="activity-description"
                  value={newActivity.description}
                  onChange={(e) =>
                    setNewActivity({
                      ...newActivity,
                      description: e.target.value,
                    })
                  }
                  placeholder="Legg til detaljer om aktiviteten"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due-date">Frist</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={newActivity.dueDate}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddActivity(false)}
              >
                Avbryt
              </Button>
              <Button onClick={handleAddActivity}>Legg til</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`border rounded-lg p-3 transition-all ${
                activity.completed
                  ? "bg-muted/30 border-muted"
                  : isOverdue(activity)
                  ? "border-red-200 bg-red-50/50"
                  : "border-muted"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    ACTIVITY_COLORS[activity.type]
                  } ${activity.completed ? "opacity-50" : ""}`}
                >
                  {ACTIVITY_ICONS[activity.type]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4
                        className={`font-medium ${
                          activity.completed
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {activity.title}
                      </h4>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8"
                      onClick={() => toggleActivityStatus(activity.id)}
                    >
                      {activity.completed ? (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="font-normal">
                      {activity.type === "call" && "Telefonsamtale"}
                      {activity.type === "email" && "E-post"}
                      {activity.type === "meeting" && "Møte"}
                      {activity.type === "sms" && "SMS"}
                      {activity.type === "note" && "Notat"}
                    </Badge>

                    {activity.dueDate && (
                      <Badge
                        variant={
                          isOverdue(activity) ? "destructive" : "outline"
                        }
                        className="font-normal gap-1 ml-auto"
                      >
                        <Clock className="h-3 w-3" />
                        {formatDate(activity.dueDate)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border rounded-lg bg-muted/10">
          <p className="text-muted-foreground">Ingen aktiviteter registrert</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 gap-1"
            onClick={() => setShowAddActivity(true)}
          >
            <Plus className="h-4 w-4" /> Legg til første aktivitet
          </Button>
        </div>
      )}
    </div>
  );
}
