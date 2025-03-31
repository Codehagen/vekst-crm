"use client";

import { useEffect, useState } from "react";
import { Activity, ActivityType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Phone,
  Mail,
  FileText,
  Users,
  Calendar,
  CheckCircle,
  CircleX,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface CustomerActivitiesProps {
  customerId: string;
}

export function CustomerActivities({ customerId }: CustomerActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        // Replace with actual API call when available
        // const data = await getActivitiesByBusinessId(customerId);
        // Simulate API call for now
        await new Promise((resolve) => setTimeout(resolve, 600));
        const mockActivities: Activity[] = [
          {
            id: "1",
            type: "call" as ActivityType,
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
            description: "Diskuterte kontraktfornyelse",
            completed: true,
            outcome: "Kunden vil fornye for ett år til",
            createdAt: new Date(),
            updatedAt: new Date(),
            businessId: customerId,
            contactId: null,
            jobApplicationId: null,
            userId: "user-1",
            ticketId: null,
          },
          {
            id: "2",
            type: "email" as ActivityType,
            date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
            description: "Sendte kontraktsdokumenter",
            completed: true,
            outcome: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            businessId: customerId,
            contactId: "1",
            jobApplicationId: null,
            userId: "user-1",
            ticketId: null,
          },
          {
            id: "3",
            type: "meeting" as ActivityType,
            date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
            description: "Planlagt gjennomgang av kundetilfredshet",
            completed: false,
            outcome: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            businessId: customerId,
            contactId: "1",
            jobApplicationId: null,
            userId: "user-1",
            ticketId: null,
          },
        ];
        setActivities(mockActivities);
      } catch (error) {
        console.error("Error fetching activities:", error);
        toast.error("Failed to load activities");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [customerId]);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "call":
        return <Phone className="h-5 w-5" />;
      case "email":
        return <Mail className="h-5 w-5" />;
      case "meeting":
        return <Users className="h-5 w-5" />;
      case "note":
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getActivityTypeLabel = (type: ActivityType) => {
    switch (type) {
      case "call":
        return "Telefonsamtale";
      case "email":
        return "E-post";
      case "meeting":
        return "Møte";
      case "note":
        return "Notat";
      default:
        return type;
    }
  };

  // Sort activities by date (upcoming first, then past)
  const sortedActivities = [...activities].sort((a, b) => {
    const now = new Date();
    const aIsUpcoming = a.date > now;
    const bIsUpcoming = b.date > now;

    if (aIsUpcoming && !bIsUpcoming) return -1; // a is upcoming, b is past
    if (!aIsUpcoming && bIsUpcoming) return 1; // a is past, b is upcoming

    // Both are upcoming or both are past, sort by date
    return bIsUpcoming
      ? a.date.getTime() - b.date.getTime() // For upcoming: closest first
      : b.date.getTime() - a.date.getTime(); // For past: most recent first
  });

  const formatDate = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return `I dag, ${format(date, "HH:mm")}`;
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isTomorrow) {
      return `I morgen, ${format(date, "HH:mm")}`;
    }

    return format(date, "d. MMMM yyyy, HH:mm", { locale: nb });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Aktiviteter</h3>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          <span>Ny aktivitet</span>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[100px] w-full" />
          ))}
        </div>
      ) : sortedActivities.length > 0 ? (
        <div className="space-y-4">
          {sortedActivities.map((activity) => {
            const isUpcoming = activity.date > new Date();

            return (
              <Card
                key={activity.id}
                className={`
                ${isUpcoming ? "border-primary/20" : ""}
                ${activity.completed ? "bg-muted/30" : ""}
              `}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div
                        className={`
                        p-2 rounded-full
                        ${
                          isUpcoming
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }
                      `}
                      >
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <div>{getActivityTypeLabel(activity.type)}</div>
                        <div className="text-xs text-muted-foreground font-normal flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(activity.date)}
                          {activity.completed && (
                            <CheckCircle className="h-3 w-3 text-primary ml-1" />
                          )}
                        </div>
                      </div>
                    </CardTitle>
                    <div>
                      {isUpcoming ? (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          Kommende
                        </span>
                      ) : activity.completed ? (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                          Fullført
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full">
                          Ikke fullført
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-sm">{activity.description}</p>
                  {activity.outcome && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Resultat:</span>{" "}
                      {activity.outcome}
                    </p>
                  )}
                  {isUpcoming && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="h-8 gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Fullfør</span>
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1">
                        <CircleX className="h-3.5 w-3.5" />
                        <span>Avbryt</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-6 text-center">
          <h4 className="font-medium">Ingen aktiviteter</h4>
          <p className="text-muted-foreground text-sm mt-1">
            Det er ingen planlagte eller tidligere aktiviteter for denne kunden.
          </p>
          <Button variant="outline" size="sm" className="mt-4 gap-1">
            <Plus className="h-4 w-4" />
            <span>Ny aktivitet</span>
          </Button>
        </div>
      )}
    </div>
  );
}
