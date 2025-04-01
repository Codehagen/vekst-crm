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
import { useSession } from "@/lib/auth/client";

const data = {
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
  const { data: session, isPending } = useSession();

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
        {isPending ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
                <div className="grid flex-1 text-left text-sm leading-tight gap-1.5">
                  <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted opacity-70" />
                </div>
                <div className="ml-auto h-4 w-4 animate-pulse rounded bg-muted" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <NavUser
            user={{
              name: session?.user?.name || "Guest",
              email: session?.user?.email || "",
              avatar: session?.user?.image || "",
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
