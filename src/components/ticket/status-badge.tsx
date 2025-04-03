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
      label: "Ikke tildelt",
      className:
        "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400",
      icon: <IconLoader className="mr-1 h-3 w-3 text-gray-500" />,
    },
    open: {
      label: "Åpen",
      className:
        "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
      icon: <IconLoader className="mr-1 h-3 w-3 text-blue-500" />,
    },
    in_progress: {
      label: "Under arbeid",
      className:
        "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: <IconLoader className="mr-1 h-3 w-3 text-yellow-500" />,
    },
    waiting_on_customer: {
      label: "Venter på kunde",
      className:
        "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
      icon: <IconLoader className="mr-1 h-3 w-3 text-purple-500" />,
    },
    waiting_on_third_party: {
      label: "Venter på tredjepart",
      className:
        "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
      icon: <IconLoader className="mr-1 h-3 w-3 text-orange-500" />,
    },
    resolved: {
      label: "Løst",
      className:
        "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
      icon: (
        <IconCircleCheckFilled className="mr-1 h-3 w-3 fill-green-500 dark:fill-green-400" />
      ),
    },
    closed: {
      label: "Lukket",
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
    icon: <IconLoader className="mr-1 h-3 w-3 text-gray-500" />,
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
