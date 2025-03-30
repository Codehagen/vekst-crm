"use client";

import { useState } from "react";
import { sendEmail, getEmailProviderStatus } from "@/app/actions/email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { toast } from "sonner";

interface EmailComposerProps {
  className?: string;
  initialTo?: string;
  initialSubject?: string;
}

export function EmailComposer({
  className,
  initialTo = "",
  initialSubject = "",
}: EmailComposerProps) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hasProvider, setHasProvider] = useState(false);
  const [providerEmail, setProviderEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkEmailProvider = async () => {
      const status = await getEmailProviderStatus();
      setHasProvider(status.connected);
      if (status.email) {
        setProviderEmail(status.email);
      }
    };

    checkEmailProvider();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!to) {
      toast.error("Missing recipient", {
        description: "Please provide a recipient email address",
      });
      return;
    }

    if (!subject) {
      toast.error("Missing subject", {
        description: "Please provide an email subject",
      });
      return;
    }

    if (!body) {
      toast.error("Missing content", {
        description: "Please provide email content",
      });
      return;
    }

    setIsSending(true);

    try {
      const result = await sendEmail({
        to,
        subject,
        body,
        cc,
        bcc,
      });

      toast.success("Email sent", {
        description: "Your email has been sent successfully",
      });

      // Reset form after successful send
      setSubject("");
      setBody("");
      setCc("");
      setBcc("");
      // Don't reset the "to" field to allow for follow-up emails
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send email", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!hasProvider) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Email Composer</CardTitle>
          <CardDescription>
            You need to connect an email provider first
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Compose Email</CardTitle>
          <CardDescription>Send an email from {providerEmail}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc">CC</Label>
            <Input
              id="cc"
              placeholder="cc@example.com"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bcc">BCC</Label>
            <Input
              id="bcc"
              placeholder="bcc@example.com"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write your message here..."
              className="min-h-[200px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={isSending}>
            {isSending ? "Sending..." : "Send Email"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
