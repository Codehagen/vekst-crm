import { prisma } from "@/lib/db";

/**
 * Associate email with business based on email addresses
 * This is a simplified version for testing
 */
export async function associateEmailWithBusiness(
  emailId: string
): Promise<string | null> {
  try {
    const email = await prisma.emailSync.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      console.log(`Email not found: ${emailId}`);
      return null;
    }

    console.log(`Attempting to associate email ${emailId} with business`);

    // Collect all email addresses from the email
    const emailAddresses = [
      email.fromEmail,
      ...email.toEmail,
      ...email.ccEmail,
    ].filter(Boolean);

    // Try to match by exact email address first
    const contactMatch = await prisma.contact.findFirst({
      where: {
        email: { in: emailAddresses },
      },
    });

    if (contactMatch) {
      // Update email with business and contact info
      await prisma.emailSync.update({
        where: { id: emailId },
        data: {
          businessId: contactMatch.businessId,
          contactId: contactMatch.id,
        },
      });

      console.log(
        `Associated email with business ${contactMatch.businessId} via contact match`
      );
      return contactMatch.businessId;
    }

    // Try to match by domain
    const domains = emailAddresses
      .map((address) => {
        const parts = address.split("@");
        return parts.length === 2 ? parts[1].toLowerCase() : null;
      })
      .filter(Boolean);

    // Try to match business by email
    const businessMatch = await prisma.business.findFirst({
      where: {
        email: { in: emailAddresses },
      },
    });

    if (businessMatch) {
      await prisma.emailSync.update({
        where: { id: emailId },
        data: {
          businessId: businessMatch.id,
        },
      });

      console.log(
        `Associated email with business ${businessMatch.id} via business email match`
      );
      return businessMatch.id;
    }

    console.log("No business match found for this email");
    return null;
  } catch (error) {
    console.error("Error associating email with business:", error);
    return null;
  }
}

/**
 * Manually associate email with business
 */
export async function manuallyAssociateEmail(
  emailId: string,
  businessId: string,
  contactId?: string
): Promise<void> {
  await prisma.emailSync.update({
    where: { id: emailId },
    data: {
      businessId,
      contactId: contactId || null,
    },
  });
}
