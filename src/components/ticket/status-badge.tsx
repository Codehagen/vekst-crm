import { Badge } from "@/components/ui/badge";
import { IconCircleCheckFilled, IconLoader } from "@tabler/icons-react";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<
    string,
    { label: string; className: string; icon?: React.ReactNode }
  > = {
    unassigned: {
      label: "Unassigned",
      className:
        "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400",
    },
    open: {
      label: "Open",
      className:
        "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
    in_progress: {
      label: "In Progress",
      className:
        "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: <IconLoader className="mr-1 h-3 w-3" />,
    },
    waiting_on_customer: {
      label: "Waiting on Customer",
      className:
        "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
    },
    waiting_on_third_party: {
      label: "Waiting on Third Party",
      className:
        "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
    },
    resolved: {
      label: "Resolved",
      className:
        "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
      icon: (
        <IconCircleCheckFilled className="mr-1 h-3 w-3 fill-green-500 dark:fill-green-400" />
      ),
    },
    closed: {
      label: "Closed",
      className:
        "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
      icon: (
        <IconCircleCheckFilled className="mr-1 h-3 w-3 fill-green-500 dark:fill-green-400" />
      ),
    },
  };

  const config = statusConfig[status] || {
    label: status,
    className:
      "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400",
  };

  return (
    <Badge
      variant="outline"
      className={`text-muted-foreground px-1.5 flex items-center justify-center ${config.className}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}
