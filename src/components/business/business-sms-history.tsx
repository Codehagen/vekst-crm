"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Send, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface BusinessSmsHistoryProps {
  businessId: string;
}

export function BusinessSmsHistory({ businessId }: BusinessSmsHistoryProps) {
  const [smsMessages, setSmsMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Placeholder for when you implement SMS functionality
  const openSmsModal = () => {
    toast.info("SMS funksjon", {
      description: "SMS-funksjonalitet vil bli implementert snart.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">SMS-historikk</h3>
        <Button size="sm" className="gap-1" onClick={openSmsModal}>
          <Plus className="h-4 w-4" />
          <span>Send SMS</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[100px] w-full" />
          ))}
        </div>
      ) : smsMessages.length > 0 ? (
        <div className="space-y-4">
          {smsMessages.map((sms) => (
            <Card key={sms.id}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="font-medium">{sms.recipient}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(sms.sentAt).toLocaleDateString("nb-NO", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <p className="text-sm">{sms.body}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Status: {sms.status}</span>
                    {sms.deliveredAt && (
                      <span>
                        Levert:{" "}
                        {new Date(sms.deliveredAt).toLocaleTimeString("nb-NO")}
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
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Ingen SMS-historikk</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Send en SMS til denne bedriften for å starte en samtale.
          </p>
          <Button className="mt-4" onClick={openSmsModal}>
            <Send className="h-4 w-4 mr-2" />
            Send første SMS
          </Button>
        </div>
      )}
    </div>
  );
}
