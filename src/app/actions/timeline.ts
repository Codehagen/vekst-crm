"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";

// Type definitions for timeline events
export interface TimelineEvent {
  id: string;
  type:
    | "business_created"
    | "contact_created"
    | "activity"
    | "email"
    | "sms"
    | "offer_created"
    | "offer_status_changed"
    | "ticket_created"
    | "ticket_updated"
    | "ticket_comment"
    | "status_changed";
  title: string;
  description?: string;
  date: Date;
  icon?: string;
  metadata?: Record<string, any>;
  status?: string;
  href?: string;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
}

// Helper function to normalize the user object for timeline events
function normalizeUserForTimeline(
  user: { id: string; name: string; image?: string | null } | null | undefined
): TimelineEvent["user"] {
  if (!user) return undefined;

  return {
    id: user.id,
    name: user.name || "Unknown",
    image: user.image || undefined,
  };
}

/**
 * Get current user's workspace ID
 */
async function getCurrentUserWorkspaceId(): Promise<string> {
  const session = await getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { workspaceId: true },
  });

  if (!user?.workspaceId) {
    throw new Error("No workspace found for user");
  }

  return user.workspaceId;
}

/**
 * Get timeline events for a business
 */
export async function getBusinessTimeline(
  businessId: string,
  options: {
    limit?: number;
    includeSms?: boolean;
    includeEmails?: boolean;
    includeTickets?: boolean;
    includeActivities?: boolean;
    includeOffers?: boolean;
    includeNotes?: boolean;
    page?: number;
  } = {}
): Promise<TimelineEvent[]> {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();

    // Set defaults
    const {
      limit = 50,
      includeSms = true,
      includeEmails = true,
      includeTickets = true,
      includeActivities = true,
      includeOffers = true,
      includeNotes = true,
      page = 1,
    } = options;

    const skip = (page - 1) * limit;

    // Get current user info for system-generated events
    const session = await getSession({
      headers: await headers(),
    });

    const currentUser = session?.user
      ? normalizeUserForTimeline({
          id: session.user.id,
          name: session.user.name || "System",
          image: session.user.image,
        })
      : undefined;

    // Verify business belongs to workspace
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        workspaceId,
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
        stage: true,
        name: true,
      },
    });

    if (!business) {
      throw new Error("Business not found in workspace");
    }

    // Initialize timeline with business creation
    const timeline: TimelineEvent[] = [
      {
        id: `business-created-${business.id}`,
        type: "business_created",
        title: "Bedrift opprettet",
        description: `${business.name} ble opprettet i systemet`,
        date: business.createdAt,
        status: business.status,
        metadata: {
          businessId: business.id,
          businessName: business.name,
          stage: business.stage,
        },
        href: `/businesses/${business.id}`,
        user: currentUser,
      },
    ];

    // Get all contacts and add their creation events
    const contacts = await prisma.contact.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });

    contacts.forEach((contact) => {
      timeline.push({
        id: `contact-created-${contact.id}`,
        type: "contact_created",
        title: "Kontaktperson lagt til",
        description: `${contact.name} (${
          contact.position || "Ukjent stilling"
        })`,
        date: contact.createdAt,
        metadata: {
          contactId: contact.id,
          contactName: contact.name,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          isPrimary: contact.isPrimary,
        },
        href: `/businesses/${businessId}/contacts/${contact.id}`,
        user: currentUser,
      });
    });

    // Add activities if requested
    if (includeActivities) {
      const activities = await prisma.activity.findMany({
        where: { businessId },
        orderBy: { date: "desc" },
      });

      // Get user data for each activity
      const activityUserIds = activities
        .map((activity) => activity.userId)
        .filter(Boolean);
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: activityUserIds as string[],
          },
        },
        select: {
          id: true,
          name: true,
          image: true,
        },
      });

      // Create a map for quick user lookup
      const userMap = users.reduce<Record<string, (typeof users)[number]>>(
        (acc, user) => {
          acc[user.id] = user;
          return acc;
        },
        {}
      );

      activities.forEach((activity) => {
        const user = activity.userId ? userMap[activity.userId] : null;
        timeline.push({
          id: `activity-${activity.id}`,
          type: "activity",
          title: getActivityTitle(activity.type),
          description: activity.description,
          date: activity.date,
          status: activity.completed ? "completed" : "pending",
          metadata: {
            activityId: activity.id,
            activityType: activity.type,
            outcome: activity.outcome,
          },
          href: `/businesses/${businessId}/activities/${activity.id}`,
          user: normalizeUserForTimeline(user) || currentUser,
        });
      });
    }

    // Add email events if requested
    if (includeEmails) {
      const emails = await prisma.emailSync.findMany({
        where: { businessId },
        orderBy: { sentAt: "desc" },
        take: 50,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
        },
      });

      emails.forEach((email) => {
        const userEmail = email.user?.email || "";
        timeline.push({
          id: `email-${email.id}`,
          type: "email",
          title: email.subject,
          description: truncateHtml(email.body, 120),
          date: email.sentAt,
          metadata: {
            emailId: email.id,
            from: email.fromEmail,
            fromName: email.fromName,
            to: email.toEmail,
            threadId: email.threadId,
            direction: email.fromEmail === userEmail ? "outbound" : "inbound",
          },
          href: `/emails/${email.id}`,
          user: normalizeUserForTimeline(email.user),
        });
      });
    }

    // Add SMS events if requested
    if (includeSms) {
      const smsMessages = await prisma.smsMessage.findMany({
        where: { businessId },
        orderBy: { sentAt: "desc" },
        take: 50,
      });

      smsMessages.forEach((sms) => {
        timeline.push({
          id: `sms-${sms.id}`,
          type: "sms",
          title: `SMS ${sms.direction === "inbound" ? "mottatt" : "sendt"}`,
          description: sms.content,
          date: sms.sentAt,
          status: sms.status,
          metadata: {
            smsId: sms.id,
            direction: sms.direction,
            contactId: sms.contactId,
          },
          user: currentUser,
        });
      });
    }

    // Add offer events if requested
    if (includeOffers) {
      const offers = await prisma.offer.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
        },
      });

      offers.forEach((offer) => {
        // Add offer creation event
        timeline.push({
          id: `offer-created-${offer.id}`,
          type: "offer_created",
          title: "Tilbud opprettet",
          description: `${offer.title} - ${formatCurrency(
            offer.totalAmount,
            offer.currency
          )}`,
          date: offer.createdAt,
          status: offer.status,
          metadata: {
            offerId: offer.id,
            offerTitle: offer.title,
            offerAmount: offer.totalAmount,
            offerCurrency: offer.currency,
            offerItems: offer.items.length,
          },
          href: `/businesses/${businessId}/offers/${offer.id}`,
          user: currentUser,
        });

        // If status was updated after creation, add a status change event
        if (offer.updatedAt > offer.createdAt) {
          timeline.push({
            id: `offer-status-${offer.id}`,
            type: "offer_status_changed",
            title: "Tilbud status endret",
            description: `Status endret til: ${getOfferStatusLabel(
              offer.status
            )}`,
            date: offer.updatedAt,
            status: offer.status,
            metadata: {
              offerId: offer.id,
              offerStatus: offer.status,
            },
            href: `/businesses/${businessId}/offers/${offer.id}`,
            user: currentUser,
          });
        }
      });
    }

    // Add ticket events if requested
    if (includeTickets) {
      const tickets = await prisma.ticket.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        include: {
          comments: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      // Load users for tickets and comments
      const creatorIds = tickets
        .map((t) => t.creatorId)
        .filter(Boolean) as string[];

      const assigneeIds = tickets
        .map((t) => t.assigneeId)
        .filter(Boolean) as string[];

      const commentAuthorIds = tickets.flatMap((t) =>
        t.comments.map((c) => c.authorId)
      );

      const uniqueUserIds = [
        ...new Set([...creatorIds, ...assigneeIds, ...commentAuthorIds]),
      ];

      const users = await prisma.user.findMany({
        where: {
          id: {
            in: uniqueUserIds,
          },
        },
        select: {
          id: true,
          name: true,
          image: true,
        },
      });

      const userMap = users.reduce<Record<string, (typeof users)[number]>>(
        (acc, user) => {
          acc[user.id] = user;
          return acc;
        },
        {}
      );

      tickets.forEach((ticket) => {
        // Add ticket creation event
        const creator = ticket.creatorId ? userMap[ticket.creatorId] : null;
        timeline.push({
          id: `ticket-created-${ticket.id}`,
          type: "ticket_created",
          title: "Support sak opprettet",
          description: ticket.title,
          date: ticket.createdAt,
          status: ticket.status,
          metadata: {
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            ticketPriority: ticket.priority,
          },
          href: `/tickets/${ticket.id}`,
          user: normalizeUserForTimeline(creator) || currentUser,
        });

        // If status changed (resolve date exists)
        if (ticket.resolvedAt) {
          const assignee = ticket.assigneeId
            ? userMap[ticket.assigneeId]
            : null;
          timeline.push({
            id: `ticket-resolved-${ticket.id}`,
            type: "ticket_updated",
            title: "Support sak løst",
            description: `Sak "${ticket.title}" ble løst`,
            date: ticket.resolvedAt,
            status: "resolved",
            metadata: {
              ticketId: ticket.id,
            },
            href: `/tickets/${ticket.id}`,
            user: normalizeUserForTimeline(assignee) || currentUser,
          });
        }

        // Add comments as timeline events
        ticket.comments.forEach((comment) => {
          if (!comment.isInternal) {
            // Only show external comments
            const author = userMap[comment.authorId];
            timeline.push({
              id: `ticket-comment-${comment.id}`,
              type: "ticket_comment",
              title: "Kommentar på support sak",
              description: truncateText(comment.content, 120),
              date: comment.createdAt,
              metadata: {
                ticketId: ticket.id,
                commentId: comment.id,
                authorId: comment.authorId,
              },
              href: `/tickets/${ticket.id}#comment-${comment.id}`,
              user: normalizeUserForTimeline(author) || currentUser,
            });
          }
        });
      });
    }

    // Sort all timeline events by date (newest first)
    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Apply pagination
    return timeline.slice(skip, skip + limit);
  } catch (error) {
    console.error(`Error fetching timeline for business ${businessId}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to load timeline"
    );
  }
}

/**
 * Get timeline events for a contact
 */
export async function getContactTimeline(
  contactId: string,
  options: {
    limit?: number;
    includeSms?: boolean;
    includeEmails?: boolean;
    includeActivities?: boolean;
    page?: number;
  } = {}
): Promise<TimelineEvent[]> {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();

    // Set defaults
    const {
      limit = 50,
      includeSms = true,
      includeEmails = true,
      includeActivities = true,
      page = 1,
    } = options;

    const skip = (page - 1) * limit;

    // Get current user info for system-generated events
    const session = await getSession({
      headers: await headers(),
    });

    const currentUser = session?.user
      ? normalizeUserForTimeline({
          id: session.user.id,
          name: session.user.name || "System",
          image: session.user.image,
        })
      : undefined;

    // Get contact and verify it belongs to a business in workspace
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        business: {
          select: {
            id: true,
            workspaceId: true,
          },
        },
      },
    });

    if (!contact || contact.business.workspaceId !== workspaceId) {
      throw new Error("Contact not found in workspace");
    }

    // Initialize timeline with contact creation
    const timeline: TimelineEvent[] = [
      {
        id: `contact-created-${contact.id}`,
        type: "contact_created",
        title: "Kontaktperson opprettet",
        description: `${contact.name} ble lagt til som kontakt`,
        date: contact.createdAt,
        metadata: {
          contactId: contact.id,
          contactName: contact.name,
          businessId: contact.businessId,
        },
        href: `/businesses/${contact.businessId}/contacts/${contact.id}`,
        user: currentUser,
      },
    ];

    // Add activities if requested
    if (includeActivities) {
      const activities = await prisma.activity.findMany({
        where: { contactId },
        orderBy: { date: "desc" },
      });

      // Get user data for each activity
      const activityUserIds = activities
        .map((activity) => activity.userId)
        .filter(Boolean);
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: activityUserIds as string[],
          },
        },
        select: {
          id: true,
          name: true,
          image: true,
        },
      });

      // Create a map for quick user lookup
      const userMap = users.reduce<Record<string, (typeof users)[number]>>(
        (acc, user) => {
          acc[user.id] = user;
          return acc;
        },
        {}
      );

      activities.forEach((activity) => {
        const user = activity.userId ? userMap[activity.userId] : null;
        timeline.push({
          id: `activity-${activity.id}`,
          type: "activity",
          title: getActivityTitle(activity.type),
          description: activity.description,
          date: activity.date,
          status: activity.completed ? "completed" : "pending",
          metadata: {
            activityId: activity.id,
            activityType: activity.type,
            outcome: activity.outcome,
          },
          href: `/businesses/${contact.businessId}/activities/${activity.id}`,
          user: normalizeUserForTimeline(user) || currentUser,
        });
      });
    }

    // Add email events if requested
    if (includeEmails) {
      const emails = await prisma.emailSync.findMany({
        where: { contactId },
        orderBy: { sentAt: "desc" },
        take: 50,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
        },
      });

      emails.forEach((email) => {
        const userEmail = email.user?.email || "";
        timeline.push({
          id: `email-${email.id}`,
          type: "email",
          title: email.subject,
          description: truncateHtml(email.body, 120),
          date: email.sentAt,
          metadata: {
            emailId: email.id,
            from: email.fromEmail,
            fromName: email.fromName,
            to: email.toEmail,
            threadId: email.threadId,
            direction: email.fromEmail === userEmail ? "outbound" : "inbound",
          },
          href: `/emails/${email.id}`,
          user: normalizeUserForTimeline(email.user),
        });
      });
    }

    // Add SMS events if requested
    if (includeSms) {
      const smsMessages = await prisma.smsMessage.findMany({
        where: { contactId },
        orderBy: { sentAt: "desc" },
        take: 50,
      });

      smsMessages.forEach((sms) => {
        timeline.push({
          id: `sms-${sms.id}`,
          type: "sms",
          title: `SMS ${sms.direction === "inbound" ? "mottatt" : "sendt"}`,
          description: sms.content,
          date: sms.sentAt,
          status: sms.status,
          metadata: {
            smsId: sms.id,
            direction: sms.direction,
            businessId: contact.businessId,
          },
          user: currentUser,
        });
      });
    }

    // Sort all timeline events by date (newest first)
    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Apply pagination
    return timeline.slice(skip, skip + limit);
  } catch (error) {
    console.error(`Error fetching timeline for contact ${contactId}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to load timeline"
    );
  }
}

// Helper functions

function getActivityTitle(type: string): string {
  switch (type) {
    case "call":
      return "Telefonsamtale";
    case "meeting":
      return "Møte";
    case "email":
      return "E-post";
    case "note":
      return "Notat";
    default:
      return "Aktivitet";
  }
}

function getOfferStatusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Utkast";
    case "sent":
      return "Sendt";
    case "accepted":
      return "Akseptert";
    case "rejected":
      return "Avvist";
    case "expired":
      return "Utløpt";
    default:
      return status;
  }
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: currency || "NOK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function truncateHtml(html: string, maxLength: number): string {
  if (!html) return "";

  // Remove HTML tags
  const textOnly = html.replace(/<[^>]*>/g, "");

  // Truncate text
  return truncateText(textOnly, maxLength);
}
