"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import {
  Mail,
  RefreshCw,
  Star,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { syncEmails, fetchEmails, updateEmail } from "@/app/actions/email";
import { toast } from "sonner";

interface Email {
  id: string;
  externalId: string;
  subject: string;
  body: string;
  htmlBody: string | null;
  sentAt: string;
  fromEmail: string;
  fromName: string | null;
  toEmail: string[];
  isRead: boolean;
  isStarred: boolean;
  threadId: string | null;
  // We don't use these in the UI but might be present in the data
  receivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface EmailThread {
  threadId: string;
  subject: string;
  emails: Email[];
  latestEmail: Email;
  emailCount: number;
}

interface EmailTimelineProps {
  businessId?: string;
  initialEmails?: Email[];
  className?: string;
}

export function EmailTimeline({
  businessId,
  initialEmails,
  className = "",
}: EmailTimelineProps) {
  const [emails, setEmails] = useState<Email[]>(initialEmails || []);
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [isLoading, setIsLoading] = useState(!initialEmails);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedThreadIds, setExpandedThreadIds] = useState<Set<string>>(
    new Set()
  );
  const router = useRouter();

  // Function to organize emails into threads
  const organizeThreads = (emailList: Email[]): EmailThread[] => {
    const threadMap = new Map<string, Email[]>();

    // Group emails by threadId or create single-email threads
    emailList.forEach((email) => {
      const threadId = email.threadId || email.id;
      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, []);
      }
      threadMap.get(threadId)!.push(email);
    });

    // Convert map to array of thread objects
    return Array.from(threadMap.entries()).map(([threadId, threadEmails]) => {
      // Sort emails by sentAt
      const sortedEmails = [...threadEmails].sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
      );

      return {
        threadId,
        subject: sortedEmails[0].subject,
        emails: sortedEmails,
        latestEmail: sortedEmails[0],
        emailCount: sortedEmails.length,
      };
    });
  };

  // Fetch emails using the server action
  const loadEmails = async () => {
    try {
      setIsLoading(true);

      const result = await fetchEmails({
        businessId,
        limit: 50,
        orderBy: "sentAt",
        orderDirection: "desc",
      });

      if (result.success && result.emails) {
        // Convert Date objects to strings for consistency
        const formattedEmails = result.emails.map((email) => ({
          id: email.id,
          externalId: email.externalId,
          subject: email.subject,
          body: email.body,
          htmlBody: email.htmlBody,
          sentAt:
            email.sentAt instanceof Date
              ? email.sentAt.toISOString()
              : String(email.sentAt),
          receivedAt:
            email.receivedAt instanceof Date
              ? email.receivedAt.toISOString()
              : email.receivedAt
              ? String(email.receivedAt)
              : null,
          fromEmail: email.fromEmail,
          fromName: email.fromName,
          toEmail: Array.isArray(email.toEmail) ? email.toEmail : [],
          isRead: Boolean(email.isRead),
          isStarred: Boolean(email.isStarred),
          threadId: email.threadId,
        }));

        setEmails(formattedEmails);
        setThreads(organizeThreads(formattedEmails));
      } else {
        toast.error(result.error || "Failed to fetch emails");
      }
    } catch (error) {
      console.error("Error loading emails:", error);
      toast.error("Failed to load emails. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sync emails and then fetch them
  const syncAndFetchEmails = async () => {
    setIsRefreshing(true);

    try {
      const syncResult = await syncEmails({
        maxEmails: 20,
        businessId,
      });

      if (!syncResult.success) {
        throw new Error(syncResult.error || "Sync failed");
      }

      toast.success(syncResult.message);

      // Fetch emails after sync
      await loadEmails();
    } catch (error) {
      console.error("Error syncing emails:", error);
      toast.error(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle marking email as read/unread
  const handleReadStatus = async (emailId: string, isRead: boolean) => {
    try {
      const result = await updateEmail({
        emailId,
        isRead,
      });

      if (result.success) {
        // Update local state
        setEmails((prevEmails) =>
          prevEmails.map((email) =>
            email.id === emailId ? { ...email, isRead } : email
          )
        );

        // Update threads
        setThreads(
          organizeThreads(
            emails.map((email) =>
              email.id === emailId ? { ...email, isRead } : email
            )
          )
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update email status"
      );
    }
  };

  // Handle starring/unstarring email
  const handleStarredStatus = async (emailId: string, isStarred: boolean) => {
    try {
      const result = await updateEmail({
        emailId,
        isStarred,
      });

      if (result.success) {
        // Update local state
        setEmails((prevEmails) =>
          prevEmails.map((email) =>
            email.id === emailId ? { ...email, isStarred } : email
          )
        );

        // Update threads
        setThreads(
          organizeThreads(
            emails.map((email) =>
              email.id === emailId ? { ...email, isStarred } : email
            )
          )
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update star status"
      );
    }
  };

  // Toggle thread expansion
  const toggleThread = (threadId: string) => {
    setExpandedThreadIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  // Load emails on initial load if no initial data
  useEffect(() => {
    if (!initialEmails) {
      loadEmails();
    } else {
      setThreads(organizeThreads(initialEmails));
    }
  }, [initialEmails]);

  // Render email or thread view
  const renderThread = (thread: EmailThread) => {
    const isExpanded = expandedThreadIds.has(thread.threadId);
    const { latestEmail } = thread;

    return (
      <Card key={thread.threadId} className="mb-3">
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => toggleThread(thread.threadId)}
            >
              <Avatar className="h-8 w-8">
                <span className="text-xs">
                  {latestEmail.fromName
                    ? latestEmail.fromName.substring(0, 2).toUpperCase()
                    : latestEmail.fromEmail.substring(0, 2).toUpperCase()}
                </span>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    {latestEmail.fromName || latestEmail.fromEmail}
                  </CardTitle>
                  {thread.emailCount > 1 && (
                    <Badge variant="outline" className="ml-2">
                      {thread.emailCount}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {thread.subject || "(No subject)"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(latestEmail.sentAt), {
                  addSuffix: true,
                })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStarredStatus(latestEmail.id, !latestEmail.isStarred);
                }}
              >
                <Star
                  className={`h-4 w-4 ${
                    latestEmail.isStarred
                      ? "fill-yellow-400 text-yellow-400"
                      : ""
                  }`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleThread(thread.threadId)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <>
            {thread.emails.map((email) => (
              <CardContent key={email.id} className="pt-2 pb-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div>
                      <span className="font-semibold">From:</span>{" "}
                      {email.fromName
                        ? `${email.fromName} <${email.fromEmail}>`
                        : email.fromEmail}
                    </div>
                    <div className="flex-shrink-0">
                      {new Date(email.sentAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold">To:</span>{" "}
                    {email.toEmail.join(", ")}
                  </div>
                  <div className="mt-4">
                    {email.htmlBody ? (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: email.htmlBody }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">{email.body}</div>
                    )}
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleReadStatus(email.id, !email.isRead)}
                    >
                      Mark as {email.isRead ? "unread" : "read"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            ))}
          </>
        )}

        {!isExpanded && (
          <CardContent className="pt-0 pb-2">
            <p className="text-sm text-muted-foreground truncate">
              {latestEmail.body.substring(0, 120)}
              {latestEmail.body.length > 120 ? "..." : ""}
            </p>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Email Timeline</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={syncAndFetchEmails}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Syncing..." : "Sync Emails"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="mb-3">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-2">
                  <Skeleton className="h-3 w-full my-1" />
                  <Skeleton className="h-3 w-3/4 my-1" />
                </CardContent>
              </Card>
            ))
          ) : threads.length > 0 ? (
            threads.map((thread) => renderThread(thread))
          ) : (
            <div className="text-center py-10">
              <Mail className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No emails found</h3>
              <p className="text-muted-foreground">
                Connect an email provider to sync your emails
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/dashboard/email")}
              >
                Connect Email Provider
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              {threads
                .filter((thread) => !thread.latestEmail.isRead)
                .map((thread) => renderThread(thread))}

              {threads.filter((thread) => !thread.latestEmail.isRead).length ===
                0 && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No unread emails</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="starred" className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              {threads
                .filter((thread) => thread.latestEmail.isStarred)
                .map((thread) => renderThread(thread))}

              {threads.filter((thread) => thread.latestEmail.isStarred)
                .length === 0 && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No starred emails</p>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
