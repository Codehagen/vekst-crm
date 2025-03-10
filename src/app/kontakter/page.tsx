"use client";

import { useEffect, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Contact } from "@prisma/client";
import { getContacts } from "./actions";
import { toast } from "sonner";

export default function KontakterPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const data = await getContacts();
        setContacts(data);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        toast.error("Failed to load contacts");
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

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
                  <BreadcrumbPage>Kontakter</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Kontakter</h1>
              <p className="text-muted-foreground mt-2">
                Administrer dine kontakter og kunderelasjoner
              </p>
            </div>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ny kontakt
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kontaktliste</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Laster kontakter...</p>
              ) : contacts.length === 0 ? (
                <p className="text-muted-foreground">
                  Ingen kontakter funnet. Legg til din første kontakt for å
                  komme i gang.
                </p>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-4 border rounded-md"
                    >
                      <div>
                        <h3 className="font-medium">{contact.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {contact.email}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {contact.phone}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
