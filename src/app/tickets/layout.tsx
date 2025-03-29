import { AppLayout } from "@/components/app-layout";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppLayout>{children}</AppLayout>
    </SidebarProvider>
  );
}
