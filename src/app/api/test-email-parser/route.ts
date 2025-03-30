import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchEmailsFromGmail } from "@/services/email/providers/gmailProvider";
import { fetchEmailsFromOutlook } from "@/services/email/providers/outlookProvider";
import { processEmail } from "@/services/email/emailProcessor";
import { getServerSession } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await req.json();
    const { provider: providerType, limit = 3 } = body;

    // Validate required fields
    if (!providerType) {
      return NextResponse.json(
        { error: "Provider type is required (google or microsoft)" },
        { status: 400 }
      );
    }

    // Find the user's email provider
    const provider = await prisma.emailProvider.findFirst({
      where: {
        userId: session.user.id,
        provider: providerType === "microsoft" ? "microsoft" : "google",
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: `No ${providerType} provider found for this user` },
        { status: 404 }
      );
    }

    // Fetch emails based on provider type
    let emails = [];

    if (providerType === "microsoft") {
      emails = await fetchEmailsFromOutlook(provider, {
        maxEmails: limit,
        folderName: "inbox",
      });
    } else {
      emails = await fetchEmailsFromGmail(provider, {
        maxEmails: limit,
        labelFilter: ["INBOX"],
      });
    }

    if (emails.length === 0) {
      return NextResponse.json(
        { emails: [], message: "No emails found in inbox" },
        { status: 200 }
      );
    }

    // Process each email and collect results
    const parsedEmails = [];

    for (const email of emails) {
      try {
        // Process the email (will upsert if it already exists)
        const result = await processEmail(
          email.raw,
          session.user.id,
          provider.id
        );

        if (!result.success) {
          console.error(`Failed to process email: ${result.error}`);
          continue;
        }

        // Get the processed email
        const emailSync = await prisma.emailSync.findUnique({
          where: { id: result.emailSyncId },
        });

        if (!emailSync) {
          console.error(`EmailSync not found for ID ${result.emailSyncId}`);
          continue;
        }

        // Add to parsed emails
        parsedEmails.push({
          id: emailSync.id,
          externalId: emailSync.externalId,
          subject: emailSync.subject,
          from: `${emailSync.fromName || ""} <${emailSync.fromEmail}>`,
          to: emailSync.toEmail,
          sentAt: emailSync.sentAt.toISOString(),
          body: emailSync.body,
          threadId: emailSync.threadId,
          htmlBody: emailSync.htmlBody || null,
          importance: emailSync.importance || "normal",
          metadata: emailSync.metadata || null,
          attachments: emailSync.attachments || [],
        });
      } catch (error) {
        console.error("Error processing email:", error);
        // Continue with next email
      }
    }

    return NextResponse.json({
      emails: parsedEmails,
      total: parsedEmails.length,
    });
  } catch (error) {
    console.error("Error in test-email-parser API:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
