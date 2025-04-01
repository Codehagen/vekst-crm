"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Mail,
  Calendar,
  Paperclip,
  Star,
  Reply,
  MoreHorizontal,
  Forward,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Check,
  Trash,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchEmails, updateEmail } from "@/app/actions/email";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CustomerEmailHistoryProps {
  customerId: string;
}

interface EmailAttachment {
  name: string;
  size: number;
  type: string;
}

interface Email {
  id: string;
  externalId: string;
  subject: string;
  body: string;
  htmlBody?: string | null;
  fromEmail: string;
  fromName: string | null;
  toEmail: string[];
  sentAt: string | Date;
  isRead: boolean;
  isStarred: boolean;
  attachments?: EmailAttachment[];
  threadId?: string | null;
}

export function CustomerEmailHistory({
  customerId,
}: CustomerEmailHistoryProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  // Function to fetch customer emails
  const loadEmails = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchEmails({
        businessId: customerId,
        limit: 50,
        orderBy: "sentAt",
        orderDirection: "desc",
      });

      if (result.success && result.emails) {
        // Transform API response to match Email interface
        const formattedEmails: Email[] = result.emails.map((email: any) => ({
          id: email.id,
          externalId: email.externalId,
          subject: email.subject,
          body: email.body,
          htmlBody: email.htmlBody,
          fromEmail: email.fromEmail,
          fromName: email.fromName,
          toEmail: Array.isArray(email.toEmail) ? email.toEmail : [],
          sentAt: email.sentAt,
          isRead: Boolean(email.isRead),
          isStarred: Boolean(email.isStarred),
          attachments: email.attachments
            ? JSON.parse(JSON.stringify(email.attachments))
            : [],
          threadId: email.threadId,
        }));

        setEmails(formattedEmails);
      } else {
        setError(result.error || "Kunne ikke hente e-poster");
      }
    } catch (err) {
      console.error("Error fetching emails:", err);
      setError("Det oppstod en feil ved henting av e-poster");
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh emails
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadEmails();
      toast.success("E-poster oppdatert");
    } catch (err) {
      toast.error("Kunne ikke oppdatere e-poster");
    } finally {
      setRefreshing(false);
    }
  };

  // Mark email as read/starred
  const handleUpdateEmail = async (
    emailId: string,
    data: { isRead?: boolean; isStarred?: boolean }
  ) => {
    try {
      const result = await updateEmail({
        emailId,
        ...data,
      });

      if (result.success) {
        // Update local state
        setEmails(
          emails.map((email) =>
            email.id === emailId ? { ...email, ...data } : email
          )
        );

        // Also update selected email if opened
        if (selectedEmail?.id === emailId) {
          setSelectedEmail((prev) => (prev ? { ...prev, ...data } : null));
        }
      }
    } catch (err) {
      console.error("Error updating email:", err);
      toast.error("Kunne ikke oppdatere e-post");
    }
  };

  // Handle opening an email
  const handleOpenEmail = (email: Email) => {
    setSelectedEmail(email);
    setShowEmailDialog(true);

    // Mark as read if not already
    if (!email.isRead) {
      handleUpdateEmail(email.id, { isRead: true });
    }
  };

  // Load emails on component mount
  useEffect(() => {
    loadEmails();
  }, [customerId]);

  // Format file size in human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  // Get icon for attachment based on file type
  const getAttachmentIcon = (type: string) => {
    return <Paperclip className="h-4 w-4" />;
  };

  // Get formatted date
  const getFormattedDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "d. MMMM yyyy, HH:mm", {
      locale: nb,
    });
  };

  // Determine if email is incoming or outgoing
  const isIncomingEmail = (email: Email): boolean => {
    // If the email is from our domain, it's outgoing
    // This is a simplistic approach - in a real app, you would check the user's email domains
    return !email.fromEmail.includes("ourcompany.com");
  };

  // Parse email attachments from metadata
  const getEmailAttachments = (email: Email): EmailAttachment[] => {
    if (email.attachments) return email.attachments;

    // If no attachments property, try to parse from metadata
    return [];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">E-posthistorikk</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            <span>Ny e-post</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Feil</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full" />
          ))}
        </div>
      ) : emails.length > 0 ? (
        <div className="space-y-4">
          {emails.map((email) => (
            <Card
              key={email.id}
              className={`
                ${!email.isRead ? "border-primary/20 bg-primary/5" : ""}
                hover:bg-muted/50 transition-colors duration-200 cursor-pointer
              `}
              onClick={() => handleOpenEmail(email)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                        p-2 rounded-full
                        ${
                          isIncomingEmail(email)
                            ? "bg-muted"
                            : "bg-primary/10 text-primary"
                        }
                      `}
                    >
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-base flex items-center gap-1">
                          {email.subject || "(Ingen emne)"}
                          {email.isStarred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </h4>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <span>
                          {email.fromName || email.fromEmail} &lt;
                          {email.fromEmail}&gt;
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {getFormattedDate(email.sentAt)}
                        </span>
                        {isIncomingEmail(email) ? (
                          <Badge variant="outline" className="ml-1">
                            Mottatt
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-1">
                            Sendt
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2 text-muted-foreground">
                        {email.body}
                      </p>
                      {getEmailAttachments(email).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {getEmailAttachments(email).map(
                            (attachment, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1 bg-muted py-1 px-2 rounded-md text-xs"
                              >
                                {getAttachmentIcon(attachment.type)}
                                <span>{attachment.name}</span>
                                <span className="text-muted-foreground">
                                  ({formatFileSize(attachment.size)})
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Reply className="h-4 w-4" />
                          <span>Svar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Forward className="h-4 w-4" />
                          <span>Videresend</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateEmail(email.id, {
                              isStarred: !email.isStarred,
                            });
                          }}
                        >
                          <Star className="h-4 w-4" />
                          <span>
                            {email.isStarred
                              ? "Fjern stjerne"
                              : "Merk med stjerne"}
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          <span>Åpne i e-postklient</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-md">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="text-lg font-medium">Ingen e-poster funnet</h4>
          <p className="text-muted-foreground mt-1 mb-4">
            Denne kunden har ingen e-poster tilknyttet enda.
          </p>
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            Oppdater
          </Button>
        </div>
      )}

      {/* Email Detail Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col p-0">
          {selectedEmail && (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEmailDialog(false)}
                    className="h-8 w-8"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold">
                    {selectedEmail.subject || "(Ingen emne)"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handleUpdateEmail(selectedEmail.id, {
                        isStarred: !selectedEmail.isStarred,
                      })
                    }
                    className="h-8 w-8"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        selectedEmail.isStarred
                          ? "text-yellow-500 fill-yellow-500"
                          : ""
                      }`}
                    />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Reply className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Forward className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 border-b bg-muted/30">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">Fra:</div>
                    <div>
                      {selectedEmail.fromName || selectedEmail.fromEmail} &lt;
                      {selectedEmail.fromEmail}&gt;
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">Til:</div>
                    <div>{selectedEmail.toEmail.join(", ")}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">Dato:</div>
                    <div>{getFormattedDate(selectedEmail.sentAt)}</div>
                  </div>
                  {getEmailAttachments(selectedEmail).length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="font-medium">Vedlegg:</div>
                      <div className="flex flex-wrap gap-2">
                        {getEmailAttachments(selectedEmail).map(
                          (attachment, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 bg-background py-1 px-2 rounded-md text-xs"
                            >
                              {getAttachmentIcon(attachment.type)}
                              <span>{attachment.name}</span>
                              <span className="text-muted-foreground">
                                ({formatFileSize(attachment.size)})
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Tabs
                defaultValue="text"
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="border-b px-4">
                  <TabsList className="w-fit h-9 mt-2">
                    <TabsTrigger value="text" className="h-8 px-3">
                      Tekst
                    </TabsTrigger>
                    {selectedEmail.htmlBody && (
                      <TabsTrigger value="html" className="h-8 px-3">
                        HTML
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>

                <TabsContent
                  value="text"
                  className="flex-1 overflow-auto p-4 m-0 border-0"
                >
                  <div className="whitespace-pre-wrap">
                    {selectedEmail.body}
                  </div>
                </TabsContent>

                {selectedEmail.htmlBody && (
                  <TabsContent
                    value="html"
                    className="flex-1 overflow-auto p-4 m-0 border-0"
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: selectedEmail.htmlBody,
                      }}
                    />
                  </TabsContent>
                )}
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
