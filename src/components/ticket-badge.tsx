"use client";

import { useEffect, useState, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { getOpenTicketsCount } from "@/app/actions/tickets";

function TicketBadgeContent() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const openCount = await getOpenTicketsCount();
        setCount(openCount);
      } catch (error) {
        console.error("Failed to fetch open tickets count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();

    // Set up periodic refresh (every 30 seconds)
    const intervalId = setInterval(fetchCount, 30000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return <TicketBadgeSkeleton />;
  }

  if (count === 0) return null;

  return (
    <Badge
      variant="secondary"
      className="ml-auto bg-primary text-primary-foreground min-w-5 h-5 flex items-center justify-center text-xs"
    >
      {count}
    </Badge>
  );
}

function TicketBadgeSkeleton() {
  return (
    <div className="ml-auto w-5 h-5 rounded-full bg-muted animate-pulse"></div>
  );
}

export function TicketBadge() {
  return (
    <Suspense fallback={<TicketBadgeSkeleton />}>
      <TicketBadgeContent />
    </Suspense>
  );
}
