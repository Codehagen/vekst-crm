"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  IconUsers,
  IconBuilding,
  IconChartBar,
  IconCalendarTime,
  IconMessageCircle,
  IconHome,
  IconSettings,
  IconClipboardList,
  IconBriefcase,
  IconLayoutGridAdd,
  IconWaveSine,
  IconCommand,
  type Icon,
  IconInnerShadowTop,
} from "@tabler/icons-react";

import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// Sample data for teams
const teamsData = {
  teams: [
    {
      name: "Vekstloop",
      logo: IconLayoutGridAdd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: IconWaveSine,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: IconCommand,
      plan: "Free",
    },
  ],
};

// CRM navigation items in Norwegian
const crmItems = [
  {
    name: "Dashbord",
    url: "/",
    icon: IconHome,
    group: "Hovedmoduler",
  },
  {
    name: "Leads",
    url: "/leads",
    icon: IconUsers,
    group: "Hovedmoduler",
  },
  {
    name: "Annonser",
    url: "/ads",
    icon: IconLayoutGridAdd,
    group: "Hovedmoduler",
  },
  {
    name: "Jobbsøknader",
    url: "/applications",
    icon: IconBriefcase,
    group: "Hovedmoduler",
  },
  {
    name: "Tickets",
    url: "/tickets",
    icon: IconClipboardList,
    group: "Hovedmoduler",
  },

  // {
  //   name: "Kontakter",
  //   url: "/kontakter",
  //   icon: IconUsers,
  //   group: "Hovedmoduler",
  // },
  // {
  //   name: "Bedrifter",
  //   url: "/bedrifter",
  //   icon: IconBuilding,
  //   group: "Hovedmoduler",
  // },
  // {
  //   name: "Muligheter",
  //   url: "/muligheter",
  //   icon: IconBriefcase,
  //   group: "Hovedmoduler",
  // },
  // {
  //   name: "Aktiviteter",
  //   url: "/aktiviteter",
  //   icon: IconCalendarTime,
  //   group: "Hovedmoduler",
  // },
  // {
  //   name: "Kommunikasjon",
  //   url: "/kommunikasjon",
  //   icon: IconMessageCircle,
  //   group: "Verktøy",
  // },
  // {
  //   name: "Oppgaver",
  //   url: "/oppgaver",
  //   icon: IconClipboardList,
  //   group: "Verktøy",
  // },
  // {
  //   name: "Rapporter",
  //   url: "/rapporter",
  //   icon: IconChartBar,
  //   group: "Verktøy",
  // },
  // {
  //   name: "Innstillinger",
  //   url: "/innstillinger",
  //   icon: IconSettings,
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
        <SidebarMenuButton
          asChild
          className="data-[slot=sidebar-menu-button]:!p-1.5"
        >
          <a href="/">
            <IconInnerShadowTop className="!size-5" />
            <span className="text-base font-semibold">Sailsdock</span>
          </a>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        {Object.entries(groupedItems).map(([groupName, items]) => (
          <SidebarGroup
            key={groupName}
            className="group-data-[collapsible=icon]:hidden"
          >
            <SidebarGroupLabel>{groupName}</SidebarGroupLabel>
            <SidebarGroupContent className="flex flex-col gap-2">
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.name}
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
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
