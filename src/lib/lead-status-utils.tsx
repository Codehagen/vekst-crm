import { CustomerStage } from "@prisma/client";
import {
  Info,
  Clock,
  CheckCircle,
  ArrowUpCircle,
  AlertCircle,
  Send,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import React from "react";

export function getStatusBadgeProps(stage: CustomerStage) {
  const stageMap: Record<
    CustomerStage,
    {
      label: string;
      variant: "default" | "outline" | "secondary" | "destructive" | "success";
      icon: React.ReactNode;
      description: string;
    }
  > = {
    lead: {
      label: "Ny",
      variant: "secondary",
      icon: <Info className="h-4 w-4" />,
      description: "Ny lead som ikke er kontaktet",
    },
    prospect: {
      label: "Kontaktet",
      variant: "default",
      icon: <Clock className="h-4 w-4" />,
      description: "Lead som er i dialog",
    },
    qualified: {
      label: "Kvalifisert",
      variant: "default",
      icon: <CheckCircle className="h-4 w-4" />,
      description: "Kvalifisert lead klar for tilbud",
    },
    offer_sent: {
      label: "Tilbud sendt",
      variant: "default",
      icon: <Send className="h-4 w-4" />,
      description: "Tilbud er sendt til kunden",
    },
    offer_accepted: {
      label: "Tilbud akseptert",
      variant: "success",
      icon: <ThumbsUp className="h-4 w-4" />,
      description: "Kunden har akseptert tilbudet",
    },
    declined: {
      label: "Takket nei",
      variant: "destructive",
      icon: <ThumbsDown className="h-4 w-4" />,
      description: "Kunden takket nei eller feil match",
    },
    customer: {
      label: "Kunde",
      variant: "success",
      icon: <ArrowUpCircle className="h-4 w-4" />,
      description: "Konvertert til aktiv kunde",
    },
    churned: {
      label: "Tapt",
      variant: "destructive",
      icon: <AlertCircle className="h-4 w-4" />,
      description: "Tapt lead",
    },
  };

  return stageMap[stage];
}
