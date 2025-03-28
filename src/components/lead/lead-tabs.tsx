"use client";

import { Business } from "@prisma/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadDetailsTab } from "./lead-details-tab";
import { LeadActivity } from "./lead-activity";
import { LeadProffInfo } from "./lead-proff-info";
import { LeadNotes } from "./lead-notes";
import { LeadOffers } from "./lead-offers";
import { CreateOffer } from "./create-offer";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  FileText,
  Calendar,
  ClipboardCheck,
  FileEdit,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadTabsProps {
  lead: Business;
  statusProps?: {
    label: string;
    variant: "default" | "outline" | "secondary" | "destructive" | "success";
    icon: React.ReactNode;
    description: string;
  };
  onStatusDialogOpen?: () => void;
}

export function LeadTabs({
  lead,
  statusProps,
  onStatusDialogOpen,
}: LeadTabsProps) {
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [isTabsSticky, setIsTabsSticky] = useState(false);

  // Handle scroll to make tabs sticky
  useEffect(() => {
    const handleScroll = () => {
      // Adjust these values based on your layout
      const scrollThreshold = 200;
      setIsTabsSticky(window.scrollY > scrollThreshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle offer creation
  const handleOfferSubmit = (offer: any) => {
    // In a real implementation, this would save to the database
    toast.success("Tilbudet ble lagret (Simulert)");
    setShowCreateOffer(false);
  };

  return (
    <Tabs
      defaultValue="details"
      className="space-y-4"
      value={activeTab}
      onValueChange={setActiveTab}
    >
      <div
        className={cn(
          "transition-all duration-200 bg-white z-10 py-2",
          isTabsSticky && "sticky top-0 shadow-sm border-b"
        )}
      >
        <TabsList className="w-full md:w-auto bg-muted/60 p-1 backdrop-blur-sm">
          <TabsTrigger
            value="details"
            className="flex items-center gap-2 data-[state=active]:bg-white"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline-block">Detaljer</span>
          </TabsTrigger>
          <TabsTrigger
            value="activities"
            className="flex items-center gap-2 data-[state=active]:bg-white"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline-block">Aktiviteter</span>
          </TabsTrigger>
          <TabsTrigger
            value="offers"
            className="flex items-center gap-2 data-[state=active]:bg-white"
          >
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline-block">Tilbud</span>
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="flex items-center gap-2 data-[state=active]:bg-white"
          >
            <FileEdit className="h-4 w-4" />
            <span className="hidden sm:inline-block">Notater</span>
          </TabsTrigger>
          {lead.orgNumber && (
            <TabsTrigger
              value="proff"
              className="flex items-center gap-2 data-[state=active]:bg-white"
            >
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline-block">Proff Info</span>
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      <TabsContent
        value="details"
        className="animate-in fade-in-50 duration-300"
      >
        <LeadDetailsTab
          lead={lead}
          statusProps={statusProps}
          onStatusDialogOpen={onStatusDialogOpen}
        />
      </TabsContent>

      <TabsContent
        value="activities"
        className="animate-in fade-in-50 duration-300"
      >
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <LeadActivity lead={lead} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent
        value="offers"
        className="animate-in fade-in-50 duration-300"
      >
        <div className="space-y-4">
          {showCreateOffer ? (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Opprett nytt tilbud</CardTitle>
                <CardDescription>
                  Fyll ut informasjonen for å opprette et nytt tilbud til{" "}
                  {lead.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateOffer
                  business={lead}
                  onSubmit={handleOfferSubmit}
                  onCancel={() => setShowCreateOffer(false)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <LeadOffers
                  lead={lead}
                  onCreateOffer={() => setShowCreateOffer(true)}
                  showCreateOffer={showCreateOffer}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="notes" className="animate-in fade-in-50 duration-300">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <LeadNotes lead={lead} />
          </CardContent>
        </Card>
      </TabsContent>

      {lead.orgNumber && (
        <TabsContent
          value="proff"
          className="animate-in fade-in-50 duration-300"
        >
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <LeadProffInfo lead={lead} />
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}
