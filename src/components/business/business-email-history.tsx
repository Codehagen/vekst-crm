"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mail,
  Send,
  Plus,
  ExternalLink,
  MailOpen,
  Calendar,
  User,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fetchBusinessEmails } from "@/app/actions/email";
import { nb } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Email {
  id: string;
  subject: string;
  body: string;
  htmlBody?: string;
  fromEmail: string;
  fromName?: string;
  toEmail: string[];
  sentAt: Date;
  isRead: boolean;
  business?: { id: string; name: string } | null;
  contact?: { id: string; name: string; email: string } | null;
}

interface BusinessEmailHistoryProps {
  businessId: string;
}

export function BusinessEmailHistory({
  businessId,
}: BusinessEmailHistoryProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [contactCount, setContactCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"all" | "received" | "sent">(
    "all"
  );

  // Fetch emails when component mounts or businessId changes
  useEffect(() => {
    fetchEmails();
  }, [businessId]);

  // Fetch business emails
  const fetchEmails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchBusinessEmails(businessId, {
        limit: 100,
        orderBy: "sentAt",
        orderDirection: "desc",
      });

      if (result.success) {
        setEmails(result.emails);
        setBusinessName(result.businessName || "");
        setContactCount(result.contactCount || 0);
      } else {
        setError(result.error || "Failed to load emails");
      }
    } catch (error) {
      setError("An error occurred while fetching emails");
      console.error("Error fetching emails:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder for when you implement email functionality
  const openEmailModal = () => {
    toast.info("Email functionality", {
      description: "Email sending functionality will be implemented soon.",
    });
  };

  // Filter emails based on active tab
  const filteredEmails = emails.filter((email) => {
    if (activeTab === "all") return true;
    if (activeTab === "received") {
      return !email.fromEmail.includes(
        "@" + extractDomain(businessName.toLowerCase())
      );
    }
    if (activeTab === "sent") {
      return email.fromEmail.includes(
        "@" + extractDomain(businessName.toLowerCase())
      );
    }
    return true;
  });

  // Helper to extract domain
  const extractDomain = (name: string): string => {
    // Simple conversion for demo purposes
    return name.replace(/\s+/g, "").toLowerCase() + ".com";
  };

  // Format date
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "d. MMMM yyyy, HH:mm", { locale: nb });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Email History</h3>
          {contactCount > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing emails for {businessName} and {contactCount} contact
              {contactCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Button size="sm" className="gap-1" onClick={openEmailModal}>
          <Plus className="h-4 w-4" />
          <span>Send Email</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 text-center border border-destructive/20 bg-destructive/10 rounded-md">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={fetchEmails}
          >
            Try Again
          </Button>
        </div>
      )}

      {!error && (
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-[100px] w-full" />
                ))}
              </div>
            ) : filteredEmails.length > 0 ? (
              <div className="space-y-4">
                {filteredEmails.map((email) => (
                  <Card
                    key={email.id}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Mail
                              className={`h-4 w-4 ${
                                email.isRead
                                  ? "text-muted-foreground"
                                  : "text-primary"
                              }`}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium flex items-center gap-1">
                                {email.fromName ||
                                  email.fromEmail.split("@")[0]}
                                {!email.isRead && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 px-1.5 py-0 text-xs"
                                  >
                                    New
                                  </Badge>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" /> {email.fromEmail}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(email.sentAt)}
                          </div>
                        </div>

                        <div className="text-sm font-medium">
                          {email.subject}
                        </div>

                        <p className="text-sm line-clamp-2">
                          {email.body?.substring(0, 120)}
                          {email.body?.length > 120 ? "..." : ""}
                        </p>

                        <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                          <div className="flex gap-2">
                            <span className="flex items-center gap-1">
                              <MailOpen className="h-3 w-3" />
                              To: {email.toEmail.join(", ")}
                            </span>
                          </div>

                          {email.contact && (
                            <Badge
                              variant="outline"
                              className="text-xs font-normal"
                            >
                              {email.contact.name}
                            </Badge>
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
                <h3 className="mt-4 text-lg font-medium">No email history</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                  Send an email to this business to start a conversation or sync
                  emails if you have existing communication.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button onClick={openEmailModal}>
                    <Send className="h-4 w-4 mr-2" />
                    Send first email
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
