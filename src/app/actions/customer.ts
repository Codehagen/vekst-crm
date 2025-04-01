"use server";

import { getServerSession } from "@/lib/auth/server";
import prisma from "@/lib/db";
import { importCustomersFromEmails } from "@/services/email/customerImport";
import { revalidatePath } from "next/cache";

interface ImportCustomersFromEmailsOptions {
  minEmailCount?: number;
  skipExistingDomains?: boolean;
  importLeadsOnly?: boolean;
  maxResults?: number;
}

/**
 * Server action to import customers from email history
 */
export async function importCustomersFromEmailsAction(
  options: ImportCustomersFromEmailsOptions = {}
) {
  try {
    // Verify authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { emailProvider: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Ensure email provider is connected
    if (!user.emailProvider) {
      return {
        success: false,
        error: "No email provider connected. Please connect your email first.",
      };
    }

    // Run the import process
    const importStats = await importCustomersFromEmails(user.id, options);

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/leads");
    revalidatePath("/customers");

    return {
      success: true,
      stats: importStats,
    };
  } catch (error) {
    console.error("Error importing customers from emails:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if email import is available (has email provider and emails)
 */
export async function checkEmailImportAvailability() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return { available: false, reason: "Not authenticated" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { emailProvider: true },
    });

    if (!user) {
      return { available: false, reason: "User not found" };
    }

    if (!user.emailProvider) {
      return {
        available: false,
        reason: "No email provider connected",
        needsEmailSetup: true,
      };
    }

    // Check if there are any emails synced
    const emailCount = await prisma.emailSync.count({
      where: { userId: user.id },
    });

    if (emailCount === 0) {
      return {
        available: false,
        reason: "No emails synced yet",
        needsEmailSync: true,
      };
    }

    return { available: true, emailCount };
  } catch (error) {
    console.error("Error checking email import availability:", error);
    return {
      available: false,
      reason: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
