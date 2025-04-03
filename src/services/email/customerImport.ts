import prisma from "@/lib/db";
import type { EmailSync, Business, Contact } from "@prisma/client";

interface ImportStats {
  totalEmails: number;
  processedContacts: number;
  createdBusinesses: number;
  skippedBusinesses: number;
  associatedEmails: number;
  errors: string[];
  filteredEmails: number;
  validEmails: number;
  personalEmails: number;
  businessEmails: number;
  filteredDomains: { [domain: string]: number };
}

interface ImportOptions {
  minEmailCount?: number; // Minimum emails from a contact to create a business
  skipExistingDomains?: boolean; // Skip domains that already exist as businesses
  importLeadsOnly?: boolean; // Import as leads only
  maxResults?: number; // Maximum number of businesses to create
}

/**
 * Analyzes email history and creates new business records for contacts
 */
export async function importCustomersFromEmails(
  userId: string,
  workspaceId: string,
  options: ImportOptions = {}
): Promise<ImportStats> {
  // Set default options
  const {
    minEmailCount = 3,
    skipExistingDomains = true,
    importLeadsOnly = true,
    maxResults = 100,
  } = options;

  // Initialize stats
  const stats: ImportStats = {
    totalEmails: 0,
    processedContacts: 0,
    createdBusinesses: 0,
    skippedBusinesses: 0,
    associatedEmails: 0,
    errors: [],
    filteredEmails: 0,
    validEmails: 0,
    personalEmails: 0,
    businessEmails: 0,
    filteredDomains: {},
  };

  try {
    console.log(`Starting email scan for user ${userId}`);

    // 1. Get count of unassociated emails
    const emailCount = await prisma.emailSync.count({
      where: {
        userId,
        businessId: null, // Only get emails not already associated with a business
      },
    });

    stats.totalEmails = emailCount;
    console.log(`Found ${emailCount} unassociated emails to process`);

    if (emailCount === 0) {
      return stats;
    }

    // For large datasets, process in chunks to avoid memory issues
    const CHUNK_SIZE = 1000;
    let processedEmails = 0;
    const contactMap: Record<
      string,
      { name: string | null; count: number; emailIds: string[] }
    > = {};

    // Process emails in chunks
    while (processedEmails < emailCount) {
      // Get a chunk of emails
      const emails = await prisma.emailSync.findMany({
        where: {
          userId,
          businessId: null,
        },
        take: CHUNK_SIZE,
        skip: processedEmails,
      });

      if (emails.length === 0) break; // No more emails to process

      console.log(`Processing chunk of ${emails.length} emails`);

      // Extract contacts from this chunk
      const chunkContacts = extractContactsFromEmails(emails, stats);

      // Merge into main contact map
      for (const [email, data] of Object.entries(chunkContacts)) {
        if (!contactMap[email]) {
          contactMap[email] = { name: data.name, count: 0, emailIds: [] };
        }
        contactMap[email].count += data.count;
        contactMap[email].emailIds.push(...data.emailIds);

        // If we have a name from this chunk but not in the main map, use it
        if (data.name && !contactMap[email].name) {
          contactMap[email].name = data.name;
        }
      }

      processedEmails += emails.length;
      console.log(`Processed ${processedEmails}/${emailCount} emails so far`);
    }

    console.log(`Total extracted contacts: ${Object.keys(contactMap).length}`);

    // 3. Get existing businesses to avoid duplicates
    const existingBusinesses = await prisma.business.findMany({
      where: {
        workspaceId, // Only check businesses in the current workspace
        OR: [
          { email: { in: Object.keys(contactMap) } },
          // Add domain checking logic here
        ],
      },
    });

    console.log(
      `Found ${existingBusinesses.length} existing businesses to avoid duplicates`
    );

    const existingEmails = new Set(
      existingBusinesses.map((b) => b.email.toLowerCase())
    );
    const existingDomains = skipExistingDomains
      ? new Set(
          existingBusinesses
            .map((b) => extractDomainFromEmail(b.email))
            .filter(Boolean)
        )
      : new Set();

    console.log(
      `Existing emails: ${existingEmails.size}, Existing domains to skip: ${existingDomains.size}`
    );

    // 4. Filter and sort contacts by frequency
    const potentialCustomers = Object.entries(contactMap)
      .filter(([email, data]) => {
        // Skip if the exact email already exists
        if (existingEmails.has(email.toLowerCase())) {
          console.log(`Skipping ${email}: Email already exists in businesses`);
          return false;
        }

        // Skip if the domain already exists and option is enabled
        const domain = extractDomainFromEmail(email);
        if (domain && existingDomains.has(domain)) {
          console.log(`Skipping ${email}: Domain ${domain} already exists`);
          return false;
        }

        // Skip if below minimum email count
        if (data.count < minEmailCount) {
          console.log(
            `Skipping ${email}: Only ${data.count} emails (min: ${minEmailCount})`
          );
          return false;
        }

        console.log(
          `Keeping ${email}: Has ${data.count} emails and meets criteria`
        );
        return true;
      })
      .sort((a, b) => b[1].count - a[1].count) // Sort by email count descending
      .slice(0, maxResults);

    stats.processedContacts = potentialCustomers.length;
    console.log(
      `After filtering, found ${potentialCustomers.length} potential contacts to process`
    );

    // 5. Create businesses for potential customers
    for (const [email, data] of potentialCustomers) {
      try {
        // Check if this is a personal email domain
        const domain = extractDomainFromEmail(email);
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

        const isPersonalEmail = domain
          ? personalEmailDomains.includes(domain.toLowerCase())
          : false;

        if (isPersonalEmail) {
          stats.personalEmails++;
          console.log(
            `Creating personal contact for ${email} - ${
              data.name || "Unknown name"
            }`
          );
        } else {
          stats.businessEmails++;
          console.log(`Creating business for ${email} - ${domain}`);
        }

        // Generate appropriate notes based on type of email
        const notes = isPersonalEmail
          ? `Automatically created from personal email contact. Found in ${data.count} emails.`
          : `Automatically created from business email domain. Found in ${data.count} emails.`;

        // Create the new business
        const newBusiness = await prisma.business.create({
          data: {
            name: data.name || getOrganizationFromEmail(email, data.name),
            email: email,
            phone: "", // Required field but we don't have it from emails
            status: "active",
            stage: importLeadsOnly ? "lead" : "customer",
            notes: notes,
            workspace: {
              connect: { id: workspaceId },
            },
          },
        });

        console.log(
          `Created business ID: ${newBusiness.id} - Name: ${newBusiness.name}`
        );

        // Create a contact if we have a name
        if (data.name) {
          await prisma.contact.create({
            data: {
              name: data.name,
              email: email,
              phone: "", // Required field
              isPrimary: true,
              businessId: newBusiness.id,
            },
          });
          console.log(`Created contact for ${data.name} <${email}>`);
        }

        // Associate all relevant emails with this new business
        // Process in smaller batches to avoid too large transactions
        const ASSOC_BATCH_SIZE = 100;
        for (let i = 0; i < data.emailIds.length; i += ASSOC_BATCH_SIZE) {
          const batchIds = data.emailIds.slice(i, i + ASSOC_BATCH_SIZE);
          await prisma.emailSync.updateMany({
            where: { id: { in: batchIds } },
            data: { businessId: newBusiness.id },
          });
          stats.associatedEmails += batchIds.length;
          console.log(
            `Associated ${batchIds.length} emails with ${newBusiness.name}`
          );
        }

        stats.createdBusinesses++;
      } catch (error) {
        stats.skippedBusinesses++;
        console.error(`Failed to create business for ${email}:`, error);
        stats.errors.push(
          `Failed to create business for ${email}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    console.log("Import completed with stats:", {
      totalEmails: stats.totalEmails,
      validEmails: stats.validEmails,
      filteredEmails: stats.filteredEmails,
      personalEmails: stats.personalEmails,
      businessEmails: stats.businessEmails,
      processedContacts: stats.processedContacts,
      createdBusinesses: stats.createdBusinesses,
      skippedBusinesses: stats.skippedBusinesses,
      associatedEmails: stats.associatedEmails,
      errors: stats.errors.length,
    });

    return stats;
  } catch (error) {
    console.error("Error during import process:", error);
    stats.errors.push(
      `Import process failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    return stats;
  }
}

/**
 * Extracts contact information from a collection of emails
 */
function extractContactsFromEmails(
  emails: EmailSync[],
  stats?: ImportStats
): Record<string, { name: string | null; count: number; emailIds: string[] }> {
  const contacts: Record<
    string,
    { name: string | null; count: number; emailIds: string[] }
  > = {};

  let validCount = 0;
  let filteredCount = 0;
  const domainCounts: Record<string, number> = {};

  for (const email of emails) {
    // Process "From" email addresses
    const fromEmail = email.fromEmail;
    const fromName = email.fromName;
    const domain = extractDomainFromEmail(fromEmail);

    // Track domain statistics
    if (domain && stats) {
      if (!domainCounts[domain]) domainCounts[domain] = 0;
      domainCounts[domain]++;
    }

    if (fromEmail && isValidEmailForImport(fromEmail)) {
      validCount++;
      if (!contacts[fromEmail]) {
        contacts[fromEmail] = {
          name: fromName || null,
          count: 0,
          emailIds: [],
        };
      }

      contacts[fromEmail].count++;
      contacts[fromEmail].emailIds.push(email.id);

      // Update name if we don't have one yet
      if (!contacts[fromEmail].name && fromName) {
        contacts[fromEmail].name = fromName;
      }
    } else if (fromEmail) {
      filteredCount++;
    }

    // We could also process "To", "CC", etc. but that could create too many leads
    // Uncomment if you want to include recipients
    /*
    for (const toEmail of email.toEmail) {
      if (isValidEmailForImport(toEmail)) {
        // Same logic as above
      }
    }
    */
  }

  if (stats) {
    stats.validEmails += validCount;
    stats.filteredEmails += filteredCount;
    stats.filteredDomains = { ...stats.filteredDomains, ...domainCounts };
    console.log(
      `Processed ${emails.length} emails: Valid: ${validCount}, Filtered: ${filteredCount}`
    );
    console.log(
      `Found ${Object.keys(contacts).length} unique contacts in this batch`
    );
  }

  return contacts;
}

/**
 * Checks if an email is valid for import consideration
 * This version is more permissive for debugging purposes.
 * It still filters out system addresses but allows personal emails.
 */
function isValidEmailForImport(email: string): boolean {
  // Skip common no-reply, support, info emails (keep this filter)
  const skipPatterns = [
    /noreply|no-reply|donotreply/i,
    /^info@|^support@|^contact@|^hello@|^admin@/i,
    /^notifications@|^updates@|^newsletter@/i,
    /^news@|^marketing@|^sales@/i,
  ];

  for (const pattern of skipPatterns) {
    if (pattern.test(email)) {
      console.log(`Filtered email by pattern: ${email} (matches ${pattern})`);
      return false;
    }
  }

  // FOR DEBUGGING: Allow all other emails including personal domains
  return true;

  /* 
  // NOTE: Original filtering code - commented out for debugging
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
  */
}

/**
 * Extracts domain from an email address
 */
function extractDomainFromEmail(email: string): string | null {
  const match = email.match(/@([^@]+)$/);
  return match ? match[1] : null;
}

/**
 * Generates organization name from email domain or returns the contact name for personal emails
 */
function getOrganizationFromEmail(
  email: string,
  contactName: string | null = null
): string {
  const domain = extractDomainFromEmail(email);

  if (!domain) return contactName || "Unknown Organization";

  // List of common personal email domains - these should use the person's name directly
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

  // If this is a personal email domain and we have a contact name, use that directly
  if (personalEmailDomains.includes(domain.toLowerCase()) && contactName) {
    return contactName;
  }

  // If this is a personal email but we don't have a name, use a generic name with username
  if (personalEmailDomains.includes(domain.toLowerCase())) {
    const username = email.split("@")[0];
    return `${username.charAt(0).toUpperCase() + username.slice(1)}`;
  }

  // Otherwise, proceed with formatting the domain as a business name
  // Remove common TLDs
  const withoutTld = domain.replace(
    /\.(com|net|org|io|co|app|info|biz|dev|uk|us|eu|ca)$/i,
    ""
  );

  // Extract the main part of the domain (remove subdomains)
  const parts = withoutTld.split(".");
  const mainPart = parts[0];

  // For single-word domains with no separators, ensure proper capitalization
  if (!mainPart.includes("-") && !mainPart.includes("_")) {
    // Simple word - just capitalize first letter
    return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
  }

  // Capitalize and clean up the domain name for multi-part domains
  return mainPart
    .split(/[.-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
