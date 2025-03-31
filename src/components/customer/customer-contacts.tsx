"use client";

import { useEffect, useState } from "react";
import { Contact } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Phone, MessageSquare, UserRound } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface CustomerContactsProps {
  customerId: string;
}

export function CustomerContacts({ customerId }: CustomerContactsProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        // Replace with actual API call when available
        // const data = await getContactsByBusinessId(customerId);
        // Simulate API call for now
        await new Promise((resolve) => setTimeout(resolve, 500));
        const mockContacts: Contact[] = [
          {
            id: "1",
            name: "John Doe",
            email: "john.doe@example.com",
            phone: "+47 123 45 678",
            position: "CEO",
            isPrimary: true,
            notes: "Primary contact for all matters",
            createdAt: new Date(),
            updatedAt: new Date(),
            businessId: customerId,
          },
          {
            id: "2",
            name: "Jane Smith",
            email: "jane.smith@example.com",
            phone: "+47 987 65 432",
            position: "CFO",
            isPrimary: false,
            notes: "Handles financial matters",
            createdAt: new Date(),
            updatedAt: new Date(),
            businessId: customerId,
          },
        ];
        setContacts(mockContacts);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        toast.error("Failed to load contacts");
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [customerId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Kontakter</h3>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          <span>Legg til kontakt</span>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      ) : contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-1">
                      <UserRound className="h-5 w-5 text-muted-foreground" />
                      {contact.name}
                    </CardTitle>
                    <CardDescription>{contact.position}</CardDescription>
                  </div>
                  {contact.isPrimary && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Primær
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-primary hover:underline"
                  >
                    {contact.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-primary hover:underline"
                  >
                    {contact.phone}
                  </a>
                </div>
                {contact.notes && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {contact.notes}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 flex-1"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>E-post</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 flex-1"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>SMS</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-6 text-center">
          <h4 className="font-medium">Ingen kontakter</h4>
          <p className="text-muted-foreground text-sm mt-1">
            Denne kunden har ingen kontaktpersoner ennå.
          </p>
          <Button variant="outline" size="sm" className="mt-4 gap-1">
            <Plus className="h-4 w-4" />
            <span>Legg til kontakt</span>
          </Button>
        </div>
      )}
    </div>
  );
}
