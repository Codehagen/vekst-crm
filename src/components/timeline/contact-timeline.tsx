"use client";

import React, { useEffect, useState } from "react";
import {
  Timeline,
  TimelineContent,
  TimelineItem,
} from "@/components/timeline/timeline";
import {
  Mail,
  MessageSquare,
  FileText,
  User,
  CalendarClock,
  AlertCircle,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TimelineEvent, getContactTimeline } from "@/app/actions/timeline";

interface ContactTimelineProps {
  contactId: string;
  limit?: number;
  includeSms?: boolean;
  includeEmails?: boolean;
  includeActivities?: boolean;
  showFilters?: boolean;
}

export function ContactTimeline({
  contactId,
  limit = 20,
  includeSms = true,
  includeEmails = true,
  includeActivities = true,
  showFilters = true,
}: ContactTimelineProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    includeSms,
    includeEmails,
    includeActivities,
  });

  // Fetch timeline events
  const fetchEvents = async (newPage = page, newFilters = filters) => {
    try {
      setIsLoading(true);
      const timelineEvents = await getContactTimeline(contactId, {
        page: newPage,
        limit,
        ...newFilters,
      });

      if (newPage === 1) {
        setEvents(timelineEvents);
      } else {
        setEvents((prev) => [...prev, ...timelineEvents]);
      }

      setHasMore(timelineEvents.length === limit);
      setPage(newPage);
    } catch (error) {
      console.error("Failed to load timeline:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchEvents(1);
  }, [contactId]);

  // Update when filters change
  const handleFilterChange = (filterKey: keyof typeof filters) => {
    const newFilters = {
      ...filters,
      [filterKey]: !filters[filterKey as keyof typeof filters],
    };
    setFilters(newFilters);
    fetchEvents(1, newFilters);
  };

  // Load more events
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchEvents(page + 1);
    }
  };

  // Get icon based on event type
  const getEventIcon = (type: TimelineEvent["type"]): LucideIcon => {
    switch (type) {
      case "contact_created":
        return User;
      case "activity":
        return CalendarClock;
      case "email":
        return Mail;
      case "sms":
        return MessageSquare;
      default:
        return FileText;
    }
  };

  // Get relative time string (like "2 minutes ago")
  const getRelativeTimeString = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - new Date(date).getTime()) / 1000
    );

    if (diffInSeconds < 60) {
      return `${diffInSeconds} sekunder siden`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minutt" : "minutter"} siden`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "time" : "timer"} siden`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "dag" : "dager"} siden`;
    }
  };

  // Get status badge variant based on status
  const getStatusVariant = (status?: string) => {
    if (!status) return "outline";

    switch (status) {
      case "completed":
      case "accepted":
      case "resolved":
        return "default";
      case "pending":
      case "in_progress":
      case "sent":
        return "secondary";
      case "rejected":
      case "failed":
      case "expired":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Convert status to display text
  const getStatusText = (status?: string) => {
    if (!status) return "";

    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
  };

  // Get action text based on event type
  const getActionText = (event: TimelineEvent): string => {
    switch (event.type) {
      case "contact_created":
        return "opprettet kontakt";
      case "activity":
        return "registrerte aktivitet";
      case "email":
        return event.metadata?.direction === "inbound"
          ? "mottok e-post"
          : "sendte e-post";
      case "sms":
        return event.metadata?.direction === "inbound"
          ? "mottok SMS"
          : "sendte SMS";
      default:
        return "utførte handling";
    }
  };

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge
            variant={filters.includeActivities ? "default" : "outline"}
            onClick={() => handleFilterChange("includeActivities")}
            className="cursor-pointer"
          >
            <CalendarClock className="mr-1 h-3 w-3" />
            Aktiviteter
          </Badge>
          <Badge
            variant={filters.includeEmails ? "default" : "outline"}
            onClick={() => handleFilterChange("includeEmails")}
            className="cursor-pointer"
          >
            <Mail className="mr-1 h-3 w-3" />
            E-poster
          </Badge>
          <Badge
            variant={filters.includeSms ? "default" : "outline"}
            onClick={() => handleFilterChange("includeSms")}
            className="cursor-pointer"
          >
            <MessageSquare className="mr-1 h-3 w-3" />
            SMS
          </Badge>
        </div>
      )}

      {isLoading && page === 1 ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-3">
          <div className="text-muted-foreground text-xs font-medium">
            Aktivitetslogg
          </div>
          <Timeline>
            {events.map((event, index) => {
              const EventIcon = getEventIcon(event.type);
              return (
                <TimelineItem
                  key={event.id}
                  step={index + 1}
                  className="m-0! flex-row items-center gap-3 py-2.5!"
                >
                  <EventIcon className="text-muted-foreground/80" size={16} />

                  <Avatar className="h-6 w-6">
                    {event.user?.image ? (
                      <AvatarImage
                        src={event.user.image}
                        alt={event.user?.name || "System"}
                      />
                    ) : null}
                    <AvatarFallback>
                      {event.user?.name
                        ? event.user.name.charAt(0).toUpperCase()
                        : "S"}
                    </AvatarFallback>
                  </Avatar>

                  <TimelineContent className="text-foreground">
                    <span className="font-medium">
                      {event.user?.name || "System"}
                    </span>
                    <span className="font-normal">
                      {" "}
                      {getActionText(event)}
                      {event.title !== "System" && `: ${event.title}`}{" "}
                      <Link
                        href={event.href || "#"}
                        className="hover:underline"
                      >
                        {getRelativeTimeString(event.date)}
                      </Link>
                    </span>

                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    )}

                    {event.status && (
                      <div className="mt-1">
                        <Badge variant={getStatusVariant(event.status)}>
                          {getStatusText(event.status)}
                        </Badge>
                      </div>
                    )}
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>

          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading}
                className="w-full max-w-xs"
              >
                {isLoading ? "Laster..." : "Last flere"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 border rounded-md">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Ingen hendelser funnet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Det er ikke registrert noen hendelser for denne kontaktpersonen
            ennå. Aktiviteter, e-poster, og andre interaksjoner vil vises her.
          </p>
        </div>
      )}
    </div>
  );
}
