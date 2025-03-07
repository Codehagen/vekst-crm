"use client";

import * as React from "react";
import {
  Users,
  Building2,
  BarChart3,
  CalendarClock,
  MessageSquare,
  Home,
  Settings2,
  ClipboardList,
  Briefcase,
  GalleryVerticalEnd,
  AudioWaveform,
  Command,
} from "lucide-react";

import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Sample data for teams
const teamsData = {
  teams: [
    {
      name: "Vekstloop",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
};

// CRM navigation items in Norwegian
const crmItems = [
  {
    name: "Dashbord",
    url: "/dashbord",
    icon: Home,
    group: "Hovedmoduler",
  },
  {
    name: "Leads",
    url: "/leads",
    icon: Users,
    group: "Hovedmoduler",
  },
  {
    name: "Kontakter",
    url: "/kontakter",
    icon: Users,
    group: "Hovedmoduler",
  },
  {
    name: "Bedrifter",
    url: "/bedrifter",
    icon: Building2,
    group: "Hovedmoduler",
  },
  {
    name: "Muligheter",
    url: "/muligheter",
    icon: Briefcase,
    group: "Hovedmoduler",
  },
  {
    name: "Aktiviteter",
    url: "/aktiviteter",
    icon: CalendarClock,
    group: "Hovedmoduler",
  },
  {
    name: "Kommunikasjon",
    url: "/kommunikasjon",
    icon: MessageSquare,
    group: "Verktøy",
  },
  {
    name: "Oppgaver",
    url: "/oppgaver",
    icon: ClipboardList,
    group: "Verktøy",
  },
  {
    name: "Rapporter",
    url: "/rapporter",
    icon: BarChart3,
    group: "Verktøy",
  },
  {
    name: "Innstillinger",
    url: "/innstillinger",
    icon: Settings2,
    group: "Verktøy",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Group the navigation items by their group property
  const groupedItems = crmItems.reduce<Record<string, typeof crmItems>>(
    (acc, item) => {
      if (!acc[item.group]) {
        acc[item.group] = [];
      }
      acc[item.group].push(item);
      return acc;
    },
    {}
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teamsData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {Object.entries(groupedItems).map(([groupName, items]) => (
          <SidebarGroup
            key={groupName}
            className="group-data-[collapsible=icon]:hidden"
          >
            <SidebarGroupLabel>{groupName}</SidebarGroupLabel>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
