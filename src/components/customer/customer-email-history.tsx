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

interface CustomerEmailHistoryProps {
  customerId: string;
}

interface Email {
  id: string;
  subject: string;
  body: string;
  fromEmail: string;
  fromName: string;
  sentAt: Date;
  isRead: boolean;
  isStarred: boolean;
  attachments: {
    name: string;
    size: number;
    type: string;
  }[];
  direction: "incoming" | "outgoing";
}

export function CustomerEmailHistory({
  customerId,
}: CustomerEmailHistoryProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoading(true);
        // Replace with actual API call when available
        // const data = await getEmailsByBusinessId(customerId);
        // Simulate API call for now
        await new Promise((resolve) => setTimeout(resolve, 800));
        const mockEmails: Email[] = [
          {
            id: "1",
            subject: "Kontraktfornyelse 2023/2024",
            body: "Hei,\n\nVi ønsker å starte prosessen med å fornye kontrakten deres som utløper neste måned. Vedlagt finner dere forslag til ny kontrakt med oppdaterte betingelser.\n\nMvh,\nKundeservice",
            fromEmail: "support@ourcompany.com",
            fromName: "Kundeservice",
            sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
            isRead: true,
            isStarred: true,
            attachments: [
              {
                name: "kontrakt_fornyelse.pdf",
                size: 1456789,
                type: "application/pdf",
              },
            ],
            direction: "outgoing",
          },
          {
            id: "2",
            subject: "Re: Kontraktfornyelse 2023/2024",
            body: "Hei,\n\nTakk for tilsendt kontraktsforslag. Vi har noen spørsmål angående prisbetingelsene i punkt 3.2. Kan vi ta et møte om dette neste uke?\n\nMvh,\nJohn Doe\nCEO, Customer Company",
            fromEmail: "john.doe@customer.com",
            fromName: "John Doe",
            sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
            isRead: true,
            isStarred: false,
            attachments: [],
            direction: "incoming",
          },
          {
            id: "3",
            subject: "Kvartalsrapport Q1",
            body: "Hei,\n\nVedlagt finner dere kvartalsrapporten for Q1 som viser bruken av våre tjenester i perioden januar-mars.\n\nLa oss vite om dere har spørsmål til rapporten.\n\nMvh,\nAccount Manager",
            fromEmail: "account@ourcompany.com",
            fromName: "Account Manager",
            sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
            isRead: false,
            isStarred: false,
            attachments: [
              {
                name: "q1_rapport.xlsx",
                size: 2345678,
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              },
              {
                name: "presentasjon.pptx",
                size: 3456789,
                type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              },
            ],
            direction: "outgoing",
          },
        ];
        setEmails(mockEmails);
      } catch (error) {
        console.error("Error fetching emails:", error);
        toast.error("Failed to load email history");
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
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

  // Sort emails by date (newest first)
  const sortedEmails = [...emails].sort(
    (a, b) => b.sentAt.getTime() - a.sentAt.getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">E-posthistorikk</h3>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          <span>Ny e-post</span>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full" />
          ))}
        </div>
      ) : sortedEmails.length > 0 ? (
        <div className="space-y-4">
          {sortedEmails.map((email) => (
            <Card
              key={email.id}
              className={`
              ${!email.isRead ? "border-primary/20 bg-primary/5" : ""}
              hover:bg-muted/50 transition-colors duration-200
            `}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                      p-2 rounded-full
                      ${
                        email.direction === "incoming"
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
                          {email.subject}
                          {email.isStarred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </h4>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <span>
                          {email.fromName} &lt;{email.fromEmail}&gt;
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(email.sentAt, "d. MMMM yyyy, HH:mm", {
                            locale: nb,
                          })}
                        </span>
                        {email.direction === "incoming" ? (
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
                      {email.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {email.attachments.map((attachment, index) => (
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
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                        <DropdownMenuItem className="flex items-center gap-2">
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
        <div className="rounded-md border border-dashed p-6 text-center">
          <h4 className="font-medium">Ingen e-poster</h4>
          <p className="text-muted-foreground text-sm mt-1">
            Det er ingen e-posthistorikk for denne kunden ennå.
          </p>
          <Button variant="outline" size="sm" className="mt-4 gap-1">
            <Plus className="h-4 w-4" />
            <span>Send første e-post</span>
          </Button>
        </div>
      )}
    </div>
  );
}
