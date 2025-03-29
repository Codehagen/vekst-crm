import { Badge } from "@/components/ui/badge";

interface PriorityBadgeProps {
  priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const priorityConfig: Record<string, { label: string; className: string }> = {
    low: {
      label: "Low",
      className:
        "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
    medium: {
      label: "Medium",
      className:
        "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    },
    high: {
      label: "High",
      className:
        "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    },
    urgent: {
      label: "Urgent",
      className:
        "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
    },
  };

  const config = priorityConfig[priority] || {
    label: priority,
    className:
      "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400",
  };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
