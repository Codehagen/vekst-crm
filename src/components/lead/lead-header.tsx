"use client";

import { Business, CustomerStage } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SendSmsDialog } from "@/components/lead/send-sms-dialog";
import {
  User,
  MessageSquare,
  PencilLine,
  MoveUp,
  CheckCircle,
  Phone,
  Mail,
  Globe,
  Building,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const stageOrder: CustomerStage[] = [
  "lead",
  "prospect",
  "qualified",
  "offer_sent",
  "offer_accepted",
  "customer",
];

interface LeadHeaderProps {
  lead: Business;
  getStatusBadgeProps: (stage: CustomerStage) => {
    label: string;
    variant: "default" | "outline" | "secondary" | "destructive" | "success";
    icon: React.ReactNode;
    description: string;
  };
  onStatusChange: (newStage: CustomerStage) => Promise<void>;
}

export function LeadHeader({
  lead,
  getStatusBadgeProps,
  onStatusChange,
}: LeadHeaderProps) {
  const [showStageDialog, setShowStageDialog] = useState(false);
  const [isChangingStage, setIsChangingStage] = useState(false);

  const statusProps = getStatusBadgeProps(lead.stage);

  // Calculate lead progress through pipeline
  const currentStageIndex = stageOrder.indexOf(lead.stage);
  const progress =
    currentStageIndex === -1
      ? 0
      : Math.round((currentStageIndex / (stageOrder.length - 1)) * 100);

  // Determine background color based on stage
  const getBgClass = (stage: CustomerStage) => {
    if (stage === "lead" || stage === "prospect")
      return "bg-gradient-to-br from-slate-100 to-slate-50";
    if (stage === "qualified" || stage === "offer_sent")
      return "bg-gradient-to-br from-blue-50 to-slate-50";
    if (stage === "offer_accepted" || stage === "customer")
      return "bg-gradient-to-br from-green-50 to-slate-50";
    if (stage === "declined" || stage === "churned")
      return "bg-gradient-to-br from-red-50 to-slate-50";
    return "bg-white";
  };

  const handleStageChange = async (newStage: CustomerStage) => {
    if (lead.stage === newStage) {
      setShowStageDialog(false);
      return;
    }

    try {
      setIsChangingStage(true);
      await onStatusChange(newStage);
    } catch (error) {
      console.error("Error updating lead stage:", error);
    } finally {
      setIsChangingStage(false);
      setShowStageDialog(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border shadow-sm overflow-hidden transition-all duration-200",
        getBgClass(lead.stage)
      )}
    >
      {/* Progress bar */}
      {lead.stage !== "declined" && lead.stage !== "churned" && (
        <div className="relative h-1 w-full bg-gray-200">
          <div
            className={cn(
              "absolute h-full transition-all duration-500",
              progress < 33
                ? "bg-blue-400"
                : progress < 66
                ? "bg-purple-500"
                : "bg-green-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full",
                statusProps.variant === "success"
                  ? "bg-green-100"
                  : statusProps.variant === "destructive"
                  ? "bg-red-100"
                  : statusProps.variant === "secondary"
                  ? "bg-gray-100"
                  : "bg-blue-100"
              )}
            >
              <User
                className={cn(
                  "h-8 w-8",
                  statusProps.variant === "success"
                    ? "text-green-600"
                    : statusProps.variant === "destructive"
                    ? "text-red-600"
                    : statusProps.variant === "secondary"
                    ? "text-gray-600"
                    : "text-blue-600"
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {lead.name}
                </h1>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant={statusProps.variant}
                        className="flex items-center gap-1 ml-2 cursor-help"
                      >
                        {statusProps.icon}
                        {statusProps.label}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{statusProps.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground">
                {lead.contactPerson && (
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span>{lead.contactPerson}</span>
                  </div>
                )}
                {lead.orgNumber && (
                  <div className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" />
                    <a
                      href={`https://proff.no/bransjesøk?q=${lead.orgNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {lead.orgNumber}
                    </a>
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                    {lead.email}
                  </a>
                )}
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="mr-1.5 h-3.5 w-3.5" />
                    {lead.phone}
                  </a>
                )}
                {lead.website && (
                  <a
                    href={
                      lead.website.startsWith("http")
                        ? lead.website
                        : `https://${lead.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="mr-1.5 h-3.5 w-3.5" />
                    {lead.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            <SendSmsDialog
              lead={lead}
              trigger={
                <Button variant="outline" size="sm" className="gap-2">
                  <MessageSquare className="h-4 w-4" /> Send SMS
                </Button>
              }
            />

            <Button variant="outline" size="sm" disabled className="gap-2">
              <PencilLine className="h-4 w-4" /> Rediger
            </Button>

            <Dialog open={showStageDialog} onOpenChange={setShowStageDialog}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="gap-2">
                  <MoveUp className="h-4 w-4" /> Endre status
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Endre status for {lead.name}</DialogTitle>
                  <DialogDescription>
                    Velg ny status for denne leaden. Dette vil oppdatere
                    oppfølgningsstatus.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {Object.entries(CustomerStage).map(([key, stage]) => (
                    <Button
                      key={key}
                      variant={stage === lead.stage ? "secondary" : "outline"}
                      className="justify-start gap-2 h-auto py-3"
                      disabled={isChangingStage}
                      onClick={() => handleStageChange(stage)}
                    >
                      {getStatusBadgeProps(stage).icon}
                      <div className="flex flex-col items-start">
                        <span>{getStatusBadgeProps(stage).label}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          {getStatusBadgeProps(stage).description}
                        </span>
                      </div>
                      {stage === lead.stage && (
                        <CheckCircle className="h-4 w-4 ml-auto" />
                      )}
                    </Button>
                  ))}
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setShowStageDialog(false)}
                    disabled={isChangingStage}
                  >
                    Avbryt
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
