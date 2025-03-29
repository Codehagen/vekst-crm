"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { getTickets } from "@/app/actions/tickets";

// Ticket type definition
interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  business?: {
    id: string;
    name: string;
  } | null;
  submitterName?: string | null;
  submitterEmail?: string | null;
  submittedCompanyName?: string | null;
}

export function TicketList() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTickets() {
      setIsLoading(true);
      try {
        const data = await getTickets({
          status: status && status !== "all" ? status : undefined,
        });
        setTickets(data);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTickets();
  }, [status]);

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle>All Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TicketListSkeleton />
        ) : tickets.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No tickets found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {status
                ? `There are no tickets with status: ${status}`
                : "There are no tickets in the system yet"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-xs">
                    {ticket.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="font-medium hover:underline"
                    >
                      {ticket.title}
                    </Link>
                    {!ticket.business && (
                      <Badge variant="secondary" className="ml-2">
                        Unassigned
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {ticket.business ? (
                      <Link
                        href={`/businesses/${ticket.business.id}`}
                        className="hover:underline"
                      >
                        {ticket.business.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">
                        {ticket.submittedCompanyName || "Unknown"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={ticket.priority} />
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(ticket.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/tickets/${ticket.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function TicketListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-14 ml-auto" />
        </div>
      ))}
    </div>
  );
}
