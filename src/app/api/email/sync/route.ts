import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  processEmail,
  batchProcessEmails,
} from "@/services/email/emailProcessor";
import { fetchEmailsFromGmail } from "@/services/email/providers/gmailProvider";
import { fetchEmailsFromOutlook } from "@/services/email/providers/outlookProvider";
import { getServerSession } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { emailProvider: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has connected an email provider
    if (!user.emailProvider) {
      return NextResponse.json(
        { error: "No email provider connected" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { maxEmails = 50, syncFrom } = body;

    // Convert syncFrom to Date if provided
    const syncFromDate = syncFrom ? new Date(syncFrom) : undefined;

    // Prepare options
    const options = {
      maxEmails,
      syncFrom: syncFromDate,
      labelFilter: ["INBOX"], // Default to inbox for Gmail
      folderFilter: ["inbox"], // Default to inbox for Outlook
    };

    // Fetch emails based on provider type
    let rawEmails: { id: string; raw: string }[] = [];

    if (user.emailProvider.provider === "google") {
      rawEmails = await fetchEmailsFromGmail(user.emailProvider, options);
    } else if (user.emailProvider.provider === "microsoft") {
      rawEmails = await fetchEmailsFromOutlook(user.emailProvider, options);
    } else {
      return NextResponse.json(
        { error: "Unsupported email provider" },
        { status: 400 }
      );
    }

    // Process emails
    const results = await Promise.all(
      rawEmails.map((email) =>
        processEmail(email.raw, user.id, user.emailProvider!.id)
      )
    );

    // Count successes and failures
    const successes = results.filter((result) => result.success).length;
    const failures = results.filter((result) => !result.success).length;

    return NextResponse.json({
      success: true,
      message: `Synced ${successes} emails successfully (${failures} failed)`,
      totalProcessed: rawEmails.length,
      successCount: successes,
      failureCount: failures,
    });
  } catch (error) {
    console.error("Error syncing emails:", error);
    return NextResponse.json(
      {
        error: "Failed to sync emails",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// For scheduled jobs or manual triggers via GET request
export async function GET(request: NextRequest) {
  try {
    // Check for API key authentication for scheduled jobs
    const apiKey = request.headers.get("x-api-key");
    const scheduledJobKey = process.env.EMAIL_SYNC_API_KEY;

    // If API key is provided, verify it
    if (apiKey) {
      if (apiKey !== scheduledJobKey) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      }

      // For scheduled jobs, sync emails for all users with active providers
      const usersWithProviders = await prisma.user.findMany({
        where: {
          emailProvider: {
            isNot: null,
          },
        },
        include: {
          emailProvider: true,
        },
      });

      // Process each user's emails
      const results = await Promise.all(
        usersWithProviders.map(async (user) => {
          if (!user.emailProvider)
            return { userId: user.id, success: false, processed: 0 };

          try {
            // Fetch emails based on provider type
            let rawEmails: { id: string; raw: string }[] = [];

            if (user.emailProvider.provider === "google") {
              rawEmails = await fetchEmailsFromGmail(user.emailProvider, {
                maxEmails: 20,
              });
            } else if (user.emailProvider.provider === "microsoft") {
              rawEmails = await fetchEmailsFromOutlook(user.emailProvider, {
                maxEmails: 20,
              });
            }

            // Process the emails
            const processResults = await batchProcessEmails(
              rawEmails.map((email) => email.raw),
              user.id,
              user.emailProvider.id
            );

            return {
              userId: user.id,
              success: true,
              processed: processResults.length,
              succeeded: processResults.filter((r) => r.success).length,
            };
          } catch (error) {
            console.error(`Error syncing emails for user ${user.id}:`, error);
            return {
              userId: user.id,
              success: false,
              processed: 0,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })
      );

      return NextResponse.json({
        success: true,
        message: "Scheduled email sync completed",
        results,
      });
    } else {
      // For manual triggers, require authentication
      const session = await getServerSession();
      if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Redirect to POST handler with default parameters
      const response = await POST(
        new Request(request.url, {
          method: "POST",
          headers: request.headers,
          body: JSON.stringify({ maxEmails: 20 }),
        })
      );

      return response;
    }
  } catch (error) {
    console.error("Error in scheduled email sync:", error);
    return NextResponse.json(
      {
        error: "Failed to run scheduled email sync",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
