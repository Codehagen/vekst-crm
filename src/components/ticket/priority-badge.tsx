import { Badge } from "@/components/ui/badge";
import {
  IconChevronDown,
  IconMinus,
  IconChevronUp,
  IconAlertTriangle,
} from "@tabler/icons-react";

interface PriorityBadgeProps {
  priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const priorityConfig: Record<
    string,
    {
      label: string;
      icon: React.ReactNode;
      iconColor: string;
      className: string;
    }
  > = {
    low: {
      label: "Lav",
      icon: <IconChevronDown className="mr-1 h-3 w-3" />,
      iconColor: "text-blue-500",
      className: "bg-blue-50 dark:bg-blue-900/20",
    },
    medium: {
      label: "Middels",
      icon: <IconMinus className="mr-1 h-3 w-3" />,
      iconColor: "text-green-500",
      className: "bg-green-50 dark:bg-green-900/20",
    },
    high: {
      label: "Høy",
      icon: <IconChevronUp className="mr-1 h-3 w-3" />,
      iconColor: "text-amber-500",
      className: "bg-amber-50 dark:bg-amber-900/20",
    },
    urgent: {
      label: "Kritisk",
      icon: <IconAlertTriangle className="mr-1 h-3 w-3" />,
      iconColor: "text-red-500",
      className: "bg-red-50 dark:bg-red-900/20",
    },
  };

  const config = priorityConfig[priority] || {
    label: priority,
    icon: <IconMinus className="mr-1 h-3 w-3" />,
    iconColor: "text-gray-500",
    className: "bg-gray-50 dark:bg-gray-900/20",
  };

  return (
    <Badge
      variant="outline"
      className={`text-muted-foreground px-1.5 flex items-center justify-center ${config.className}`}
    >
      <span className={config.iconColor}>{config.icon}</span>
      {config.label}
    </Badge>
  );
}
