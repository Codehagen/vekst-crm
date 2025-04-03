"use client";

import { useEffect, useState, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { getUserAssignedTicketsCount } from "@/app/actions/tickets";

function InboxBadgeContent() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const assignedCount = await getUserAssignedTicketsCount();
        setCount(assignedCount);
      } catch (error) {
        console.error("Failed to fetch assigned tickets count:", error);
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
    return <InboxBadgeSkeleton />;
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

function InboxBadgeSkeleton() {
  return (
    <div className="ml-auto w-5 h-5 rounded-full bg-muted animate-pulse"></div>
  );
}

export function InboxBadge() {
  return (
    <Suspense fallback={<InboxBadgeSkeleton />}>
      <InboxBadgeContent />
    </Suspense>
  );
}
