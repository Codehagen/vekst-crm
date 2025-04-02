"use client";

import { Activity, ActivityType } from "@prisma/client";
import {
  Calendar,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface BusinessActivitiesProps {
  businessId: string;
  activities: Activity[];
}

export function BusinessActivities({
  businessId,
  activities,
}: BusinessActivitiesProps) {
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />;
      case "meeting":
        return <Calendar className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "note":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityLabel = (type: ActivityType) => {
    switch (type) {
      case "call":
        return "Telefonsamtale";
      case "meeting":
        return "Møte";
      case "email":
        return "E-post";
      case "note":
        return "Notat";
      default:
        return "Aktivitet";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Aktiviteter</h3>
        <Link href={`/businesses/${businessId}/activities/new`}>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            <span>Legg til aktivitet</span>
          </Button>
        </Link>
      </div>

      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id}>
              <CardHeader className="py-3 px-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getActivityIcon(activity.type)}
                    {getActivityLabel(activity.type)}
                  </CardTitle>
                  <Badge
                    variant={activity.completed ? "default" : "outline"}
                    className="flex items-center gap-1"
                  >
                    {activity.completed ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        <span>Fullført</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        <span>Venter</span>
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <div className="space-y-2">
                  <p className="text-sm">{activity.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <p>
                      {new Date(activity.date).toLocaleDateString("nb-NO", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {activity.outcome && (
                      <Badge variant="secondary">{activity.outcome}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Ingen aktiviteter ennå</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Registrer dine interaksjoner med denne bedriften for å holde
            oversikt over relasjonen.
          </p>
          <Button className="mt-4" asChild>
            <Link href={`/businesses/${businessId}/activities/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til første aktivitet
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
