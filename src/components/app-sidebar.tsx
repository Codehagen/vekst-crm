"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
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
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    url: "/",
    icon: Home,
    group: "Hovedmoduler",
  },
  {
    name: "Leads",
    url: "/leads",
    icon: Users,
    group: "Hovedmoduler",
  },
  // {
  //   name: "Kontakter",
  //   url: "/kontakter",
  //   icon: Users,
  //   group: "Hovedmoduler",
  // },
  // {
  //   name: "Bedrifter",
  //   url: "/bedrifter",
  //   icon: Building2,
  //   group: "Hovedmoduler",
  // },
  // {
  //   name: "Muligheter",
  //   url: "/muligheter",
  //   icon: Briefcase,
  //   group: "Hovedmoduler",
  // },
  // {
  //   name: "Aktiviteter",
  //   url: "/aktiviteter",
  //   icon: CalendarClock,
  //   group: "Hovedmoduler",
  // },
  // {
  //   name: "Kommunikasjon",
  //   url: "/kommunikasjon",
  //   icon: MessageSquare,
  //   group: "Verktøy",
  // },
  // {
  //   name: "Oppgaver",
  //   url: "/oppgaver",
  //   icon: ClipboardList,
  //   group: "Verktøy",
  // },
  // {
  //   name: "Rapporter",
  //   url: "/rapporter",
  //   icon: BarChart3,
  //   group: "Verktøy",
  // },
  // {
  //   name: "Innstillinger",
  //   url: "/innstillinger",
  //   icon: Settings2,
  //   group: "Verktøy",
  // },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  // Function to check if a navigation item is active
  const isActive = (itemUrl: string) => {
    // Check if the current path matches the item URL exactly
    if (pathname === itemUrl) return true;

    // Check if the current path starts with the item URL (for subpages)
    // This handles cases like /bedrifter/[id] should highlight the /bedrifter menu item
    if (itemUrl !== "/" && pathname.startsWith(itemUrl)) return true;

    return false;
  };

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
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      isActive(item.url) && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
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
