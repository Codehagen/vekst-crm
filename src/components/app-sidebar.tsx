"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconUsers,
  IconBuildingStore,
  IconUserSearch,
  IconTicket,
  IconMail,
  IconInnerShadowTop,
  IconSettings,
  IconHelp,
  IconSearch,
  IconUserCircle,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { NavDocuments } from "./nav-documents";
import { NavSecondary } from "./nav-secondary";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Leads",
      url: "/leads",
      icon: IconUsers,
    },
    {
      title: "Kunder",
      url: "/customers",
      icon: IconUserCircle,
    },
    {
      title: "Annonser",
      url: "/ads",
      icon: IconBuildingStore,
    },
    {
      title: "Jobbsøknader",
      url: "/applications",
      icon: IconUserSearch,
    },
  ],
  support: [
    {
      name: "Tickets",
      url: "/tickets",
      icon: IconTicket,
    },
    {
      name: "Email",
      url: "/email",
      icon: IconMail,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  // Function to check if a path is active
  const isActivePath = (path: string) => {
    if (path === "/dashboard" && pathname === "/") return true;
    return pathname === path;
  };

  // Update data with active states
  const navMainWithActive = data.navMain.map((item) => ({
    ...item,
    isActive: isActivePath(item.url),
  }));

  const supportWithActive = data.support.map((item) => ({
    ...item,
    isActive: isActivePath(item.url),
  }));

  const navSecondaryWithActive = data.navSecondary.map((item) => ({
    ...item,
    isActive: isActivePath(item.url),
  }));

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Sailsdock</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} />
        <NavDocuments items={supportWithActive} title="Support" />
        <NavSecondary items={navSecondaryWithActive} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
