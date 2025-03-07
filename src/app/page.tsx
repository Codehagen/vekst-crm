import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Homepage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">CRM System</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashbord</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              Velkommen til CRM-systemet
            </h1>
            <p className="text-muted-foreground mt-2">
              Oversikt over dine viktigste data og aktiviteter
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Kontakter</CardTitle>
                <CardDescription>Total antall kontakter</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">256</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bedrifter</CardTitle>
                <CardDescription>Total antall bedrifter</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">124</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aktive muligheter</CardTitle>
                <CardDescription>Potensielle salg</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">16</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
