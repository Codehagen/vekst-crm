import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<
    string,
    {
      label: string;
      variant: "default" | "outline" | "secondary" | "destructive";
    }
  > = {
    unassigned: {
      label: "Unassigned",
      variant: "outline",
    },
    open: {
      label: "Open",
      variant: "secondary",
    },
    in_progress: {
      label: "In Progress",
      variant: "default",
    },
    waiting_on_customer: {
      label: "Waiting on Customer",
      variant: "secondary",
    },
    waiting_on_third_party: {
      label: "Waiting on Third Party",
      variant: "secondary",
    },
    resolved: {
      label: "Resolved",
      variant: "outline",
    },
    closed: {
      label: "Closed",
      variant: "destructive",
    },
  };

  const config = statusConfig[status] || {
    label: status,
    variant: "outline",
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
