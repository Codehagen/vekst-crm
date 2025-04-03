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

    if (!user.workspaceId) {
      throw new Error("No workspace found for user");
    }

    // Ensure email provider is connected
    if (!user.emailProvider) {
      return {
        success: false,
        error: "No email provider connected. Please connect your email first.",
      };
    }

    // Log import start with options
    console.log(`Starting email import with options:`, {
      minEmailCount: options.minEmailCount,
      skipExistingDomains: options.skipExistingDomains,
      importLeadsOnly: options.importLeadsOnly,
      maxResults: options.maxResults,
    });

    // Run the import process with workspace ID
    const importStats = await importCustomersFromEmails(
      user.id,
      user.workspaceId,
      options
    );

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/leads");
    revalidatePath("/customers");

    // Get summary of filtered domains for debugging
    const domainSummary = Object.entries(importStats.filteredDomains || {})
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .slice(0, 10) // Take top 10
      .map(([domain, count]) => `${domain}: ${count}`);

    console.log(`Import completed. Top domains found:`, domainSummary);

    return {
      success: true,
      stats: importStats,
      debug: {
        validEmails: importStats.validEmails,
        filteredEmails: importStats.filteredEmails,
        personalEmails: importStats.personalEmails,
        businessEmails: importStats.businessEmails,
        topDomains: domainSummary,
      },
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

/**
 * Import businesses directly from email domains
 * This is a simplified version focusing on quickly creating businesses from domains
 */
export async function importBusinessesFromDomains(options: {
  skipExistingDomains?: boolean;
  importAsLeads?: boolean;
  maxResults?: number;
  transformDomains?: boolean;
  skipFilters?: boolean;
}) {
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

    if (!user.workspaceId) {
      throw new Error("No workspace found for user");
    }

    // Ensure email provider is connected
    if (!user.emailProvider) {
      return {
        success: false,
        error: "No email provider connected. Please connect your email first.",
      };
    }

    const {
      skipExistingDomains = true,
      importAsLeads = true,
      maxResults = 100,
      transformDomains = true,
      skipFilters = false,
    } = options;

    // Get all emails that aren't associated with businesses yet
    const emails = await prisma.emailSync.findMany({
      where: {
        userId: user.id,
        businessId: null,
      },
      select: {
        id: true,
        fromEmail: true,
        fromName: true,
      },
    });

    if (emails.length === 0) {
      return {
        success: false,
        error: "No emails available for import. Please sync emails first.",
      };
    }

    // Extract unique domains and store related email info
    const domainMap: Record<
      string,
      {
        name: string | null;
        emails: string[];
        contacts: Map<string, { name: string; email: string }>;
      }
    > = {};

    for (const email of emails) {
      const domain = extractDomainFromEmail(email.fromEmail);
      if (!domain || (!skipFilters && !isValidEmailForImport(email.fromEmail)))
        continue;

      if (!domainMap[domain]) {
        // Initialize with a properly formatted domain name
        domainMap[domain] = {
          name: transformDomains ? formatDomainAsBusinessName(domain) : null,
          emails: [],
          contacts: new Map(),
        };
      }

      domainMap[domain].emails.push(email.id);

      // Store full contact information with email
      if (email.fromName) {
        domainMap[domain].contacts.set(email.fromEmail, {
          name: email.fromName,
          email: email.fromEmail,
        });
      }
    }

    // Get existing businesses to avoid duplicates
    const existingBusinesses = await prisma.business.findMany({
      select: {
        id: true,
        email: true,
      },
    });

    const existingDomains = skipExistingDomains
      ? new Set(
          existingBusinesses
            .map((b) => extractDomainFromEmail(b.email))
            .filter(Boolean)
        )
      : new Set();

    // Filter out existing domains if option is enabled
    const uniqueDomains = Object.entries(domainMap)
      .filter(([domain]) => !existingDomains.has(domain))
      .slice(0, maxResults);

    // Stats for the result
    const stats = {
      totalEmails: emails.length,
      processedDomains: uniqueDomains.length,
      createdBusinesses: 0,
      createdContacts: 0, // Track created contacts
      associatedEmails: 0,
      skippedDomains: Object.keys(domainMap).length - uniqueDomains.length,
      errors: [] as string[],
    };

    // Create businesses for each unique domain
    for (const [domain, data] of uniqueDomains) {
      try {
        // Try to find a valid email address from this domain
        // First check if we've seen an email in our data
        let fromEmails: string[] = [];
        for (const emailId of data.emails) {
          const email = emails.find((e) => e.id === emailId);
          if (email && email.fromEmail.endsWith(`@${domain}`)) {
            fromEmails.push(email.fromEmail);
          }
        }

        // Use a real email from the domain if available, otherwise create a placeholder
        const businessEmail =
          fromEmails.length > 0
            ? fromEmails[0] // Use the first actual email we found
            : `info@${domain}`; // Use a placeholder as fallback

        const isPlaceholderEmail = fromEmails.length === 0;

        // Check if this is a personal email domain
        const personalEmailDomains = [
          "gmail.com",
          "hotmail.com",
          "outlook.com",
          "yahoo.com",
          "icloud.com",
          "aol.com",
          "protonmail.com",
          "mail.com",
          "live.com",
          "msn.com",
          "me.com",
        ];

        const isPersonalDomain = personalEmailDomains.includes(
          domain.toLowerCase()
        );

        // Get contact person if available
        const contactPerson =
          data.contacts.size > 0
            ? Array.from(data.contacts.values())[0].name
            : "";

        // For personal email domains, use the person's name as the business name
        // For regular domains, format the domain name as before
        const businessName =
          isPersonalDomain && contactPerson
            ? contactPerson
            : transformDomains
            ? data.name || formatDomainAsBusinessName(domain)
            : domain.split(".")[0];

        // Generate notes text based on domain type
        const notesText = isPersonalDomain
          ? `Automatically created from personal email contact. Found in ${data.emails.length} emails.`
          : `Automatically created from business domain ${domain}. Found in ${data.emails.length} emails.`;

        // Add placeholder note if needed
        const finalNotes = isPlaceholderEmail
          ? `${notesText} Email address is a placeholder.`
          : notesText;

        // Create the business
        const business = await prisma.business.create({
          data: {
            name: businessName,
            email: businessEmail,
            phone: "", // Required field
            status: "active",
            stage: importAsLeads ? "lead" : "customer",
            notes: finalNotes,
            // If we have contacts, use the first contact's name as contactPerson
            contactPerson: contactPerson,
            workspace: {
              connect: { id: user.workspaceId },
            },
          },
        });

        // Create contacts from the unique entries we found
        if (data.contacts.size > 0) {
          // Convert Map to Array
          const contacts = Array.from(data.contacts.values());

          // Process primary contact (first in the list)
          if (contacts.length > 0) {
            const primaryContact = contacts[0];

            // Always set the first contact as primary
            await prisma.contact.create({
              data: {
                name: primaryContact.name,
                email: primaryContact.email,
                phone: "", // Required field
                isPrimary: true,
                businessId: business.id,
              },
            });
          }

          // Create additional contacts
          for (let i = 1; i < contacts.length; i++) {
            const contact = contacts[i];

            await prisma.contact.create({
              data: {
                name: contact.name,
                email: contact.email,
                phone: "", // Required field
                isPrimary: false,
                businessId: business.id,
              },
            });
          }

          stats.createdContacts += data.contacts.size;
        }

        // Associate emails with this business
        await prisma.emailSync.updateMany({
          where: { id: { in: data.emails } },
          data: { businessId: business.id },
        });

        stats.associatedEmails += data.emails.length;
        stats.createdBusinesses++;
      } catch (error) {
        stats.errors.push(
          `Failed to create business for ${domain}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    // Revalidate paths
    revalidatePath("/dashboard");
    revalidatePath("/businesses");

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error("Error importing businesses from domains:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extracts domain from an email address
 */
function extractDomainFromEmail(email: string): string | null {
  if (!email || typeof email !== "string") return null;

  // Handle the case where the input might already be a domain
  if (!email.includes("@")) {
    return email.trim();
  }

  const match = email.match(/@([^@]+)$/);
  return match ? match[1].trim() : null;
}

/**
 * Checks if an email is valid for import consideration
 * This function filters out emails that are likely not business-related:
 * 1. Automated emails (no-reply, info, support, etc.)
 * 2. Personal email domains (gmail.com, hotmail.com, etc.)
 *
 * Note: This filter is bypassed when the "Skip filters" option is enabled
 * in the import dialog.
 */
function isValidEmailForImport(email: string): boolean {
  // Skip common no-reply, support, info emails
  const skipPatterns = [
    /noreply|no-reply|donotreply/i,
    /^info@|^support@|^contact@|^hello@|^admin@/i,
    /^notifications@|^updates@|^newsletter@/i,
    /^news@|^marketing@|^sales@/i,
  ];

  for (const pattern of skipPatterns) {
    if (pattern.test(email)) return false;
  }

  // Skip common email services
  const skipDomains = [
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "icloud.com",
    "aol.com",
    "protonmail.com",
    "mail.com",
    "live.com",
    "msn.com",
    "me.com",
  ];

  const domain = extractDomainFromEmail(email);
  if (domain && skipDomains.includes(domain.toLowerCase())) {
    return false;
  }

  return true;
}

/**
 * Formats a domain into a business name
 * e.g., "digital-ocean.com" → "Digital Ocean"
 */
function formatDomainAsBusinessName(domain: string): string {
  // Safety check: If the input has an @ symbol, it's probably an email, not a domain
  if (domain.includes("@")) {
    domain = domain.split("@")[1];
  }

  // Remove common TLDs
  const withoutTld = domain.replace(
    /\.(com|net|org|io|co|app|info|biz|dev|uk|us|eu|ca)$/i,
    ""
  );

  // Extract the main part (typically the domain without subdomain)
  // This handles cases like "example.co.uk" correctly
  const parts = withoutTld.split(".");
  const mainPart =
    parts.length > 1 && parts[parts.length - 1].length <= 3
      ? parts.slice(0, -1).join(".") // Handle country-specific TLDs
      : parts[0];

  // For single-word domains with no separators, ensure proper capitalization
  if (
    !mainPart.includes("-") &&
    !mainPart.includes("_") &&
    !mainPart.includes(".")
  ) {
    // Check for camelCase or internal caps like "ihainvest" or "webtop"
    if (/^[a-z]+$/.test(mainPart)) {
      // Simple lowercase domain - just capitalize first letter
      return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
    }
  }

  // Split by common separators and capitalize each part
  return mainPart
    .split(/[-_.]/)
    .map((part) => {
      // Handle special cases like "MyCompany" or "ABCorp"
      if (/^[A-Z][a-z]+[A-Z]/.test(part)) {
        // Split camelCase - e.g., "MyCompany" -> "My Company"
        return part.replace(/([a-z])([A-Z])/g, "$1 $2");
      }
      // Always capitalize the first letter of each part
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}
