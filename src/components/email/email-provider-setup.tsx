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
} from "@/app/actions/auth-provider";
import {
  IconBrandGoogle,
  IconBrandWindows,
  IconCheck,
  IconMail,
  IconRefresh,
  IconAlertCircle,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface EmailProviderSetupProps {
  className?: string;
}

interface TokenResult {
  success: boolean;
  email?: string;
  error?: string;
}

export function EmailProviderSetup({ className }: EmailProviderSetupProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
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
          <Button
            onClick={disconnectProvider}
            variant="destructive"
            size="sm"
            className="mt-2"
            disabled={isDisconnecting}
          >
            <IconTrash className="mr-2 h-4 w-4" />
            {isDisconnecting ? "Disconnecting..." : "Disconnect Email Provider"}
          </Button>
        </CardContent>
      ) : (
        <CardContent className="space-y-4">
          <Button
            onClick={connectGmail}
            className="w-full"
            variant="outline"
            disabled={isConnecting}
          >
            <IconBrandGoogle className="mr-2 h-4 w-4" />
            {isConnecting ? "Connecting..." : "Connect Gmail"}
          </Button>
          <Button
            onClick={connectOutlook}
            className="w-full"
            variant="outline"
            disabled={isConnecting}
          >
            <IconBrandWindows className="mr-2 h-4 w-4" />
            Connect Outlook
          </Button>

          <div className="pt-2 border-t mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              If you're having trouble connecting, try these options:
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  onClick={checkProviderStatus}
                  variant="ghost"
                  size="sm"
                  disabled={isRefreshing}
                >
                  <IconRefresh className="mr-1 h-4 w-4" />
                  Refresh Status
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={manuallyFetchGoogleTokens}
                  variant="ghost"
                  size="sm"
                  disabled={isRefreshing}
                >
                  <IconBrandGoogle className="mr-1 h-4 w-4" />
                  Manual Gmail Connect
                </Button>
                <Button
                  onClick={manuallyFetchMicrosoftTokens}
                  variant="ghost"
                  size="sm"
                  disabled={isRefreshing}
                >
                  <IconBrandWindows className="mr-1 h-4 w-4" />
                  Manual Outlook Connect
                </Button>
              </div>
            </div>
          </div>
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
