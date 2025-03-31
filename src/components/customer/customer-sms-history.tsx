"use client";

import { useEffect, useState } from "react";
import { MessageDirection, SmsMessage, SmsStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  MessageSquare,
  ArrowDown,
  ArrowUp,
  CheckCheck,
  Clock,
  AlertCircle,
  Send,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Input } from "@/components/ui/input";

interface CustomerSmsHistoryProps {
  customerId: string;
}

export function CustomerSmsHistory({ customerId }: CustomerSmsHistoryProps) {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        // Replace with actual API call when available
        // const data = await getSmsHistoryByBusinessId(customerId);
        // Simulate API call for now
        await new Promise((resolve) => setTimeout(resolve, 700));
        const mockMessages: SmsMessage[] = [
          {
            id: "1",
            content:
              "Hei! Bare en påminnelse om at vi har et møte neste uke om kontraktfornyelsen.",
            sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
            status: "delivered" as SmsStatus,
            direction: "outbound" as MessageDirection,
            businessId: customerId,
            contactId: null,
          },
          {
            id: "2",
            content: "Takk for påminnelsen. Vi gleder oss til møtet!",
            sentAt: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 30
            ), // 30 min after first message
            status: "delivered" as SmsStatus,
            direction: "inbound" as MessageDirection,
            businessId: customerId,
            contactId: null,
          },
          {
            id: "3",
            content:
              "Vi har sendt deg kontraktforslaget på e-post. Kan du bekrefte at du har mottatt det?",
            sentAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
            status: "delivered" as SmsStatus,
            direction: "outbound" as MessageDirection,
            businessId: customerId,
            contactId: null,
          },
        ];
        setMessages(mockMessages);
      } catch (error) {
        console.error("Error fetching SMS history:", error);
        toast.error("Failed to load SMS history");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [customerId]);

  const getSmsStatusIcon = (status: SmsStatus) => {
    switch (status) {
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-green-500" />;
      case "sent":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "pending":
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case "failed":
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  const getSmsStatusText = (status: SmsStatus) => {
    switch (status) {
      case "delivered":
        return "Levert";
      case "sent":
        return "Sendt";
      case "pending":
        return "Venter";
      case "failed":
        return "Feilet";
      default:
        return status;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Add message to local state
      const newSmsMessage: SmsMessage = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        sentAt: new Date(),
        status: "pending" as SmsStatus,
        direction: "outbound" as MessageDirection,
        businessId: customerId,
        contactId: null,
      };

      setMessages((prev) => [...prev, newSmsMessage]);
      setNewMessage("");

      // Simulate message being delivered after a delay
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newSmsMessage.id
              ? { ...msg, status: "delivered" as SmsStatus }
              : msg
          )
        );
      }, 2000);
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast.error("Failed to send SMS");
    } finally {
      setSending(false);
    }
  };

  // Sort messages by date (oldest first)
  const sortedMessages = [...messages].sort(
    (a, b) => a.sentAt.getTime() - b.sentAt.getTime()
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">SMS-historikk</h3>
      </div>

      <div className="flex-1 overflow-y-auto mb-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[80px] w-full" />
            ))}
          </div>
        ) : sortedMessages.length > 0 ? (
          <div className="space-y-3">
            {sortedMessages.map((message) => {
              const isInbound = message.direction === "inbound";

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isInbound ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`
                    max-w-[80%] rounded-lg p-3
                    ${
                      isInbound
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    }
                  `}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <div
                      className={`
                      flex items-center gap-1 text-xs mt-1
                      ${
                        isInbound
                          ? "text-muted-foreground"
                          : "text-primary-foreground/70"
                      }
                    `}
                    >
                      <div className="flex items-center gap-1">
                        {isInbound ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUp className="h-3 w-3" />
                        )}
                        <span>
                          {formatDistanceToNow(message.sentAt, {
                            addSuffix: true,
                            locale: nb,
                          })}
                        </span>
                      </div>
                      {!isInbound && (
                        <div className="flex items-center gap-1 ml-1">
                          {getSmsStatusIcon(message.status)}
                          <span>{getSmsStatusText(message.status)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-6 text-center">
            <h4 className="font-medium">Ingen meldinger</h4>
            <p className="text-muted-foreground text-sm mt-1">
              Det er ingen SMS-historikk for denne kunden ennå.
            </p>
            <Button variant="outline" size="sm" className="mt-4 gap-1">
              <Plus className="h-4 w-4" />
              <span>Send første melding</span>
            </Button>
          </div>
        )}
      </div>

      <Card className="mt-auto">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Skriv melding..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="pr-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                {newMessage.length}/160
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="gap-1"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
