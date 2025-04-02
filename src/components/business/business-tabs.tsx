"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, MessageSquare, Mail, FileText } from "lucide-react";
import { BusinessContacts } from "./business-contacts";
import { BusinessActivities } from "./business-activities";
import { BusinessSmsHistory } from "./business-sms-history";
import { BusinessEmailHistory } from "./business-email-history";
import { Business } from "@prisma/client";
import { useSearchParams } from "next/navigation";

interface BusinessTabsProps {
  business: Business & {
    contacts: any[];
    activities: any[];
  };
}

export function BusinessTabs({ business }: BusinessTabsProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "contacts";
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <Tabs
      defaultValue={initialTab}
      className="w-full mt-6"
      value={activeTab}
      onValueChange={setActiveTab}
    >
      <TabsList className="grid grid-cols-5 md:w-[750px] mb-6">
        <TabsTrigger value="contacts" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Kontakter</span>
        </TabsTrigger>
        <TabsTrigger value="activities" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Aktiviteter</span>
        </TabsTrigger>
        <TabsTrigger value="sms" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">SMS</span>
        </TabsTrigger>
        <TabsTrigger value="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <span className="hidden sm:inline">E-post</span>
        </TabsTrigger>
        <TabsTrigger value="notes" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Notater</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="contacts" className="space-y-4">
        <BusinessContacts
          businessId={business.id}
          contacts={business.contacts}
        />
      </TabsContent>

      <TabsContent value="activities" className="space-y-4">
        <BusinessActivities
          businessId={business.id}
          activities={business.activities}
        />
      </TabsContent>

      <TabsContent value="sms" className="space-y-4">
        <BusinessSmsHistory businessId={business.id} />
      </TabsContent>

      <TabsContent value="email" className="space-y-4">
        <BusinessEmailHistory businessId={business.id} />
      </TabsContent>

      <TabsContent value="notes" className="space-y-4">
        <div className="rounded-md border p-4">
          <h3 className="text-lg font-medium">Notater</h3>
          <p className="text-muted-foreground mb-4">
            {business.notes ||
              "Ingen notater tilgjengelig for denne bedriften."}
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
