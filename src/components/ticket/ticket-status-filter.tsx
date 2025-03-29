"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TicketStatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "all";

  const statuses = [
    { value: "all", label: "All Tickets" },
    { value: "unassigned", label: "Unassigned" },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "waiting_on_customer", label: "Waiting on Customer" },
    { value: "waiting_on_third_party", label: "Waiting on Third Party" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  function handleStatusChange(value: string) {
    const params = new URLSearchParams(searchParams);

    if (value && value !== "all") {
      params.set("status", value);
    } else {
      params.delete("status");
    }

    router.push(`/tickets?${params.toString()}`);
  }

  return (
    <Select value={status} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((statusOption) => (
          <SelectItem key={statusOption.value} value={statusOption.value}>
            {statusOption.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
