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
    { value: "unassigned", label: "Ikke tildelt" },
    { value: "open", label: "Åpen" },
    { value: "in_progress", label: "Under arbeid" },
    { value: "waiting_on_customer", label: "Venter på kunde" },
    { value: "waiting_on_third_party", label: "Venter på tredjepart" },
    { value: "resolved", label: "Løst" },
    { value: "closed", label: "Lukket" },
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
