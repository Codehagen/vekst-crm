"use client";

import { useState } from "react";
import { Contact } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Mail,
  Phone,
  MessageSquare,
  UserRound,
  Star,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";

interface BusinessContactsProps {
  businessId: string;
  contacts: Contact[];
}

export function BusinessContacts({
  businessId,
  contacts,
}: BusinessContactsProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Kontakter</h3>
        <Link href={`/businesses/${businessId}/contacts/new`}>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            <span>Legg til kontakt</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
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
                    <span className="flex items-center text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      <Star className="h-3 w-3 mr-1" />
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
        <div className="rounded-md border p-8 text-center">
          <UserRound className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Ingen kontakter ennå</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Legg til kontakter for denne bedriften for å holde oversikt over
            viktige personer.
          </p>
          <Button className="mt-4" asChild>
            <Link href={`/businesses/${businessId}/contacts/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Legg til første kontakt
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
