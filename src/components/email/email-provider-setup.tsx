"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";

interface EmailProviderSetupProps {
  className?: string;
}

export function EmailProviderSetup({ className }: EmailProviderSetupProps) {
  const connectGmail = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  const connectOutlook = async () => {
    await authClient.signIn.social({
      provider: "microsoft",
      callbackURL: "/dashboard",
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Connect Email Provider</CardTitle>
        <CardDescription>
          Connect your email to send messages directly from your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={connectGmail} className="w-full" variant="outline">
          Connect Gmail
        </Button>
        <Button onClick={connectOutlook} className="w-full" variant="outline">
          Connect Outlook
        </Button>
      </CardContent>
    </Card>
  );
}
