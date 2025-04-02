"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Send, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface BusinessEmailHistoryProps {
  businessId: string;
}

export function BusinessEmailHistory({
  businessId,
}: BusinessEmailHistoryProps) {
  const [emailMessages, setEmailMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Placeholder for when you implement email functionality
  const openEmailModal = () => {
    toast.info("E-post funksjon", {
      description: "E-postfunksjonalitet vil bli implementert snart.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">E-posthistorikk</h3>
        <Button size="sm" className="gap-1" onClick={openEmailModal}>
          <Plus className="h-4 w-4" />
          <span>Send e-post</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[100px] w-full" />
          ))}
        </div>
      ) : emailMessages.length > 0 ? (
        <div className="space-y-4">
          {emailMessages.map((email) => (
            <Card key={email.id}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="font-medium">{email.recipient}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(email.sentAt).toLocaleDateString("nb-NO", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{email.subject}</div>
                  <p className="text-sm">{email.body}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Status: {email.status}</span>
                    {email.openedAt && (
                      <span>
                        Åpnet:{" "}
                        {new Date(email.openedAt).toLocaleTimeString("nb-NO")}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border p-8 text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Ingen e-posthistorikk</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Send en e-post til denne bedriften for å starte en samtale.
          </p>
          <Button className="mt-4" onClick={openEmailModal}>
            <Send className="h-4 w-4 mr-2" />
            Send første e-post
          </Button>
        </div>
      )}
    </div>
  );
}
