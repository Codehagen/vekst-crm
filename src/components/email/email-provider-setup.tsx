"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";
import { getEmailProviderStatus } from "@/app/actions/email";
import {
  fetchGoogleTokenInfo,
  fetchMicrosoftTokenInfo,
  disconnectEmailProvider,
  initiateGoogleOAuthWithOfflineAccess,
  initiateMicrosoftOAuthWithOfflineAccess,
} from "@/app/actions/auth-provider";
import {
  IconBrandGoogle,
  IconBrandWindows,
  IconCheck,
  IconMail,
  IconRefresh,
  IconAlertCircle,
  IconTrash,
  IconExternalLink,
  IconDownload,
  IconX,
  IconPaperclip,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface EmailProviderSetupProps {
  className?: string;
}

interface TokenResult {
  success: boolean;
  email?: string;
  error?: string;
}

interface ParsedEmail {
  id: string;
  subject: string;
  from: string;
  to: string[];
  sentAt: string;
  body: string;
  threadId?: string;
  htmlBody?: string;
  importance?: string;
  metadata?: any;
  attachments?: any[];
}

export function EmailProviderSetup({ className }: EmailProviderSetupProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isFetchingEmails, setIsFetchingEmails] = useState(false);
  const [parsedEmails, setParsedEmails] = useState<ParsedEmail[]>([]);
  const [providerStatus, setProviderStatus] = useState<{
    connected: boolean;
    provider?: string;
    email?: string;
  }>({ connected: false });

  const checkProviderStatus = async () => {
    setIsRefreshing(true);
    try {
      const status = await getEmailProviderStatus();
      setProviderStatus(status);
    } catch (error) {
      console.error("Failed to get provider status:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkProviderStatus();
  }, []);

  const connectGmail = async () => {
    setIsConnecting(true);
    try {
      toast.info("Redirecting to Google authentication...");

      // We'll try both methods - the Better Auth callback and our manual method
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard/email",
        scopes: [
          "email",
          "profile",
          "openid",
          "https://www.googleapis.com/auth/gmail.modify",
        ],
      });
    } catch (error) {
      console.error("Failed to connect Gmail:", error);
      toast.error("Failed to connect Gmail", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
      setIsConnecting(false);
    }
  };

  const connectOutlook = async () => {
    setIsConnecting(true);
    try {
      toast.info("Redirecting to Microsoft authentication...");

      await authClient.signIn.social({
        provider: "microsoft",
        callbackURL: "/dashboard/email",
        scopes: [
          "email",
          "profile",
          "openid",
          "Mail.Send",
          "Mail.Read",
          "Mail.ReadWrite",
          "User.Read",
        ],
      });
    } catch (error) {
      console.error("Failed to connect Outlook:", error);
      toast.error("Failed to connect Outlook", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
      setIsConnecting(false);
    }
  };

  const manuallyFetchGoogleTokens = async () => {
    setIsRefreshing(true);
    try {
      toast.info("Manually fetching Google token information...");

      const result = (await fetchGoogleTokenInfo()) as TokenResult;

      if (result.success) {
        toast.success("Successfully connected Gmail", {
          description: result.email
            ? `Connected to ${result.email}`
            : "Connection successful",
        });
        await checkProviderStatus();
      } else {
        toast.error("Failed to fetch Google token information", {
          description: result.error || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error manually fetching Google tokens:", error);
      toast.error("Error fetching Google tokens", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const manuallyFetchMicrosoftTokens = async () => {
    setIsRefreshing(true);
    try {
      toast.info("Manually fetching Microsoft token information...");

      const result = (await fetchMicrosoftTokenInfo()) as TokenResult;

      if (result.success) {
        toast.success("Successfully connected Outlook", {
          description: result.email
            ? `Connected to ${result.email}`
            : "Connection successful",
        });
        await checkProviderStatus();
      } else {
        toast.error("Failed to fetch Microsoft token information", {
          description: result.error || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error manually fetching Microsoft tokens:", error);
      toast.error("Error fetching Microsoft tokens", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const disconnectProvider = async () => {
    setIsDisconnecting(true);
    try {
      toast.info("Disconnecting email provider...");

      const result = await disconnectEmailProvider();

      if (result.success) {
        toast.success("Successfully disconnected email provider");
        await checkProviderStatus();
        // Clear any fetched emails when disconnecting
        setParsedEmails([]);
      } else {
        toast.error("Failed to disconnect email provider", {
          description: result.error || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error disconnecting email provider:", error);
      toast.error("Error disconnecting email provider", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const initiateDirectGoogleAuth = async () => {
    setIsConnecting(true);
    try {
      toast.info("Generating Google OAuth URL with offline access...");

      const result = await initiateGoogleOAuthWithOfflineAccess();

      if (result.success && result.authUrl) {
        toast.success("OAuth URL generated", {
          description:
            "A new tab will open for authorization with offline access.",
        });

        // Open the URL in a new tab
        window.open(result.authUrl, "_blank");

        // Start polling for provider connection
        toast.info(
          "After authorizing, return here and check connection status",
          {
            duration: 8000,
          }
        );
      } else {
        toast.error("Failed to generate OAuth URL", {
          description: result.error || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error initiating direct Google auth:", error);
      toast.error("Error initiating Google auth", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const initiateDirectMicrosoftAuth = async () => {
    setIsConnecting(true);
    try {
      toast.info("Generating Microsoft OAuth URL with offline access...");

      const result = await initiateMicrosoftOAuthWithOfflineAccess();

      if (result.success && result.authUrl) {
        toast.success("OAuth URL generated", {
          description:
            "A new tab will open for authorization with offline access.",
        });

        // Open the URL in a new tab
        window.open(result.authUrl, "_blank");

        // Start polling for provider connection
        toast.info(
          "After authorizing, return here and check connection status",
          {
            duration: 8000,
          }
        );
      } else {
        toast.error("Failed to generate OAuth URL", {
          description: result.error || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error initiating direct Microsoft auth:", error);
      toast.error("Error initiating Microsoft auth", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchAndParseEmails = async () => {
    if (!providerStatus.connected) {
      toast.error("No email provider connected");
      return;
    }

    setIsFetchingEmails(true);
    setParsedEmails([]);

    try {
      const response = await fetch("/api/test-email-parser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: providerStatus.provider,
          limit: 3, // Fetch top 3 emails
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch emails");
      }

      const data = await response.json();
      setParsedEmails(data.emails);
      toast.success(`Successfully fetched ${data.emails.length} emails`);
    } catch (error) {
      console.error("Error fetching and parsing emails:", error);
      toast.error("Failed to fetch and parse emails", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsFetchingEmails(false);
    }
  };

  useEffect(() => {
    if (!providerStatus.connected) {
      const interval = setInterval(async () => {
        const status = await getEmailProviderStatus();
        if (status.connected) {
          setProviderStatus(status);
          setIsConnecting(false);
          toast.success("Email provider connected", {
            description: `Connected to ${status.email}`,
          });
          clearInterval(interval);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [providerStatus.connected]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Connect Email Provider</CardTitle>
        <CardDescription>
          Connect your email to send messages directly from your account
        </CardDescription>
      </CardHeader>

      {providerStatus.connected ? (
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-md bg-primary/5 border">
            <div className="bg-primary/10 h-10 w-10 rounded-full flex items-center justify-center">
              <IconMail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {providerStatus.provider === "google" ? "Gmail" : "Outlook"}{" "}
                Connected
              </p>
              <p className="text-sm text-muted-foreground">
                {providerStatus.email}
              </p>
            </div>
            <IconCheck className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-sm text-muted-foreground">
            You can now send emails directly from your account. Use the email
            composer to send messages.
          </p>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={fetchAndParseEmails}
              variant="outline"
              disabled={isFetchingEmails}
              className="w-full"
            >
              <IconDownload className="mr-2 h-4 w-4" />
              {isFetchingEmails
                ? "Fetching Emails..."
                : "Test Email Parsing (Last 3 Emails)"}
            </Button>

            <Button
              onClick={disconnectProvider}
              variant="destructive"
              size="sm"
              disabled={isDisconnecting}
            >
              <IconTrash className="mr-2 h-4 w-4" />
              {isDisconnecting
                ? "Disconnecting..."
                : "Disconnect Email Provider"}
            </Button>
          </div>

          {/* Email preview section */}
          {parsedEmails.length > 0 && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Parsed Emails</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setParsedEmails([])}
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {parsedEmails.map((email) => (
                  <Card
                    key={email.id}
                    className="overflow-hidden border shadow-sm"
                  >
                    <CardHeader className="bg-muted/30 px-4 py-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base font-medium">
                            {email.subject}
                          </CardTitle>
                          {email.importance &&
                            email.importance !== "normal" && (
                              <Badge
                                variant={
                                  email.importance === "high"
                                    ? "destructive"
                                    : "outline"
                                }
                                className="ml-2 text-xs"
                              >
                                {email.importance}
                              </Badge>
                            )}
                        </div>
                        {email.threadId && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Thread: {email.threadId.substring(0, 8)}...
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground text-xs flex flex-col space-y-0.5">
                        <div className="grid grid-cols-[4rem_1fr] gap-1">
                          <span className="font-medium">From:</span>
                          <span>{email.from}</span>
                        </div>
                        <div className="grid grid-cols-[4rem_1fr] gap-1">
                          <span className="font-medium">To:</span>
                          <span>
                            {Array.isArray(email.to)
                              ? email.to.join(", ")
                              : email.to}
                          </span>
                        </div>
                        <div className="grid grid-cols-[4rem_1fr] gap-1">
                          <span className="font-medium">Date:</span>
                          <span>{new Date(email.sentAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-3">
                      <div className="flex flex-col gap-3">
                        <Tabs defaultValue="text" className="w-full">
                          <TabsList className="grid w-full grid-cols-3 h-8">
                            <TabsTrigger value="text" className="text-xs">
                              Text Content
                            </TabsTrigger>
                            <TabsTrigger value="html" className="text-xs">
                              HTML View
                            </TabsTrigger>
                            <TabsTrigger value="details" className="text-xs">
                              Details
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="text">
                            <div className="border rounded-md">
                              <ScrollArea className="h-48 w-full rounded p-2 text-xs">
                                <div className="whitespace-pre-wrap">
                                  {email.body}
                                </div>
                              </ScrollArea>
                            </div>
                          </TabsContent>
                          <TabsContent value="html">
                            <div className="border rounded-md">
                              {email.htmlBody ? (
                                <div className="h-48 overflow-auto">
                                  <iframe
                                    srcDoc={email.htmlBody}
                                    title="Email HTML Content"
                                    className="w-full h-full border-0"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-48 text-xs text-muted-foreground">
                                  No HTML content available
                                </div>
                              )}
                            </div>
                          </TabsContent>
                          <TabsContent value="details">
                            <div className="border rounded-md">
                              <ScrollArea className="h-48 w-full rounded p-2 text-xs">
                                <div className="space-y-2">
                                  {email.metadata && (
                                    <>
                                      <div className="font-medium text-sm">
                                        Thread Info
                                      </div>
                                      <div className="grid grid-cols-2 gap-1 text-xs pl-2">
                                        <span className="text-muted-foreground">
                                          Method:
                                        </span>
                                        <span>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger className="flex items-center gap-1 cursor-help">
                                                {email.metadata.threadInfo
                                                  ?.method || "N/A"}
                                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                              </TooltipTrigger>
                                              <TooltipContent
                                                side="right"
                                                className="w-80 p-3"
                                              >
                                                <p className="font-semibold">
                                                  Thread Identification Methods:
                                                </p>
                                                <ul className="text-xs mt-1 space-y-1 list-disc pl-4">
                                                  <li>
                                                    <span className="font-medium">
                                                      gmail_thread_id (1.0)
                                                    </span>
                                                    : Uses Gmail's native thread
                                                    ID - most reliable
                                                  </li>
                                                  <li>
                                                    <span className="font-medium">
                                                      reference_headers (0.9)
                                                    </span>
                                                    : Uses
                                                    References/In-Reply-To
                                                    headers that directly link
                                                    emails
                                                  </li>
                                                  <li>
                                                    <span className="font-medium">
                                                      subject_match (0.6)
                                                    </span>
                                                    : Groups by similar subject
                                                    lines, less reliable
                                                  </li>
                                                  <li>
                                                    <span className="font-medium">
                                                      message_id_fallback (1.0)
                                                    </span>
                                                    : No thread found, created a
                                                    new thread with this message
                                                    only
                                                  </li>
                                                </ul>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </span>

                                        <span className="text-muted-foreground">
                                          Confidence:
                                        </span>
                                        <span>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger className="flex items-center gap-1 cursor-help">
                                                {email.metadata.threadInfo
                                                  ?.confidence || "N/A"}
                                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                              </TooltipTrigger>
                                              <TooltipContent
                                                side="right"
                                                className="w-72"
                                              >
                                                <p className="text-xs">
                                                  Confidence value (0-1)
                                                  indicates reliability of
                                                  thread identification. Higher
                                                  values mean greater certainty
                                                  that emails are properly
                                                  grouped.
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </span>
                                      </div>
                                    </>
                                  )}

                                  {email.attachments &&
                                    email.attachments.length > 0 && (
                                      <>
                                        <div className="font-medium text-sm mt-3">
                                          Attachments
                                        </div>
                                        <div className="pl-2">
                                          {email.attachments.map(
                                            (attachment, i) => (
                                              <div
                                                key={i}
                                                className="flex items-center gap-2 text-xs"
                                              >
                                                <IconPaperclip className="h-3 w-3" />
                                                <span>
                                                  {attachment.filename}
                                                </span>
                                                <span className="text-muted-foreground">
                                                  (
                                                  {Math.round(
                                                    attachment.size / 1024
                                                  )}{" "}
                                                  KB)
                                                </span>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </>
                                    )}

                                  {email.metadata?.contentInfo && (
                                    <>
                                      <div className="font-medium text-sm mt-3">
                                        Content Analysis
                                      </div>
                                      <div className="grid grid-cols-2 gap-1 text-xs pl-2">
                                        <span className="text-muted-foreground">
                                          Reply Style:
                                        </span>
                                        <span>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger className="flex items-center gap-1 cursor-help">
                                                {email.metadata.contentInfo
                                                  .replyStyle || "N/A"}
                                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                              </TooltipTrigger>
                                              <TooltipContent
                                                side="right"
                                                className="w-72"
                                              >
                                                <p className="text-xs">
                                                  <span className="font-medium">
                                                    Reply styles:
                                                  </span>
                                                  <ul className="list-disc pl-4 mt-1">
                                                    <li>
                                                      <span className="font-medium">
                                                        top
                                                      </span>
                                                      : Reply appears above
                                                      quoted text
                                                    </li>
                                                    <li>
                                                      <span className="font-medium">
                                                        bottom
                                                      </span>
                                                      : Reply appears below
                                                      quoted text
                                                    </li>
                                                    <li>
                                                      <span className="font-medium">
                                                        inline
                                                      </span>
                                                      : Reply intermixed with
                                                      quoted text
                                                    </li>
                                                    <li>
                                                      <span className="font-medium">
                                                        unknown
                                                      </span>
                                                      : Could not determine
                                                      style
                                                    </li>
                                                  </ul>
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </span>

                                        <span className="text-muted-foreground">
                                          Has Quoted Content:
                                        </span>
                                        <span>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger className="flex items-center gap-1 cursor-help">
                                                {email.metadata.contentInfo
                                                  .hasQuotedContent
                                                  ? "Yes"
                                                  : "No"}
                                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                              </TooltipTrigger>
                                              <TooltipContent side="right">
                                                <p className="text-xs">
                                                  Indicates whether the email
                                                  contains text quoted from
                                                  previous messages
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </span>

                                        <span className="text-muted-foreground">
                                          Has Signature:
                                        </span>
                                        <span>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger className="flex items-center gap-1 cursor-help">
                                                {email.metadata.contentInfo
                                                  .hasSignature
                                                  ? "Yes"
                                                  : "No"}
                                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                              </TooltipTrigger>
                                              <TooltipContent side="right">
                                                <p className="text-xs">
                                                  Indicates whether a signature
                                                  block was detected (e.g.,
                                                  "Best regards, Name")
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </span>

                                        <span className="text-muted-foreground">
                                          Has Disclaimer:
                                        </span>
                                        <span>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger className="flex items-center gap-1 cursor-help">
                                                {email.metadata.contentInfo
                                                  .hasDisclaimer
                                                  ? "Yes"
                                                  : "No"}
                                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                              </TooltipTrigger>
                                              <TooltipContent side="right">
                                                <p className="text-xs">
                                                  Indicates whether a legal
                                                  disclaimer was detected (e.g.,
                                                  confidentiality notices)
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </ScrollArea>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {isFetchingEmails && (
            <div className="space-y-3">
              <Skeleton className="w-full h-32" />
              <Skeleton className="w-full h-32" />
              <Skeleton className="w-full h-32" />
            </div>
          )}
        </CardContent>
      ) : (
        <CardContent className="space-y-4">
          <Button
            onClick={initiateDirectGoogleAuth}
            className="w-full"
            variant="outline"
            disabled={true}
          >
            <IconBrandGoogle className="mr-2 h-4 w-4" />
            {isConnecting ? "Connecting..." : "Connect Gmail (Coming Soon)"}
          </Button>
          <Button
            onClick={initiateDirectMicrosoftAuth}
            className="w-full"
            variant="outline"
            disabled={isConnecting}
          >
            <IconBrandWindows className="mr-2 h-4 w-4" />
            {isConnecting ? "Connecting..." : "Connect Outlook"}
          </Button>
        </CardContent>
      )}

      {providerStatus.connected && (
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Your email credentials are securely stored and only used to send
            emails on your behalf.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
