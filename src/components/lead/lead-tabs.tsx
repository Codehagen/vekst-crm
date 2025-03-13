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
import { useState } from "react";
import { toast } from "sonner";

interface LeadTabsProps {
  lead: Business;
}

export function LeadTabs({ lead }: LeadTabsProps) {
  const [showCreateOffer, setShowCreateOffer] = useState(false);

  // Handle offer creation
  const handleOfferSubmit = (offer: any) => {
    // In a real implementation, this would save to the database
    toast.success("Tilbudet ble lagret (Simulert)");
    setShowCreateOffer(false);
  };

  return (
    <Tabs defaultValue="details" className="space-y-4">
      <TabsList className="w-full md:w-auto">
        <TabsTrigger value="details">Detaljer</TabsTrigger>
        <TabsTrigger value="activities">Aktiviteter</TabsTrigger>
        {/* <TabsTrigger value="offers">Tilbud</TabsTrigger>
        <TabsTrigger value="notes">Notater</TabsTrigger> */}
        {lead.orgNumber && <TabsTrigger value="proff">Proff Info</TabsTrigger>}
      </TabsList>

      <TabsContent value="details">
        <LeadDetailsTab lead={lead} />
      </TabsContent>

      <TabsContent value="activities">
        <Card>
          <CardContent className="pt-6">
            <LeadActivity lead={lead} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="offers">
        <div className="space-y-4">
          {showCreateOffer ? (
            <Card>
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
            <Card>
              <CardContent className="pt-6">
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

      <TabsContent value="notes">
        <Card>
          <CardContent className="pt-6">
            <LeadNotes lead={lead} />
          </CardContent>
        </Card>
      </TabsContent>

      {lead.orgNumber && (
        <TabsContent value="proff">
          <Card>
            <CardContent className="pt-6">
              <LeadProffInfo lead={lead} />
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}
