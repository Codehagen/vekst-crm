"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppearanceSettings } from "./appearance-settings";
import { NotificationSettings } from "./notification-settings";
import { PersonalInfoForm } from "./personal-info-form";
import { SecuritySettings } from "./security-settings";

export function SettingsLayout() {
  const [activeTab, setActiveTab] = useState("personal");

  return (
    <Tabs
      defaultValue="personal"
      className="space-y-6"
      value={activeTab}
      onValueChange={setActiveTab}
    >
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="personal">Personal Info</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="notifications" disabled>
          Notifications
        </TabsTrigger>
        <TabsTrigger value="appearance" disabled>
          Appearance
        </TabsTrigger>
      </TabsList>
      <TabsContent value="personal" className="space-y-6">
        <PersonalInfoForm />
      </TabsContent>
      <TabsContent value="notifications" className="space-y-6">
        <NotificationSettings />
      </TabsContent>
      <TabsContent value="security" className="space-y-6">
        <SecuritySettings />
      </TabsContent>
      <TabsContent value="appearance" className="space-y-6">
        <AppearanceSettings />
      </TabsContent>
    </Tabs>
  );
}
