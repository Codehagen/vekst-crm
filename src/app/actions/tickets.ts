"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Helper to find possible business matches based on email domain and company name
 */
async function findPossibleBusinessMatch(email: string, companyName: string) {
  if (!email && !companyName) return null;

  const matches = [];
  let confidence = "low";

  // Try to match by email domain if available
  if (email) {
    const domain = email.split("@")[1];
    if (domain) {
      // Match businesses with the same domain in their email or website
      const emailMatches = await prisma.business.findMany({
        where: {
          OR: [
            { email: { contains: domain } },
            { website: { contains: domain } },
          ],
        },
        take: 5,
      });

      if (emailMatches.length === 1) {
        // Single match by domain - high confidence
        return {
          confidence: "high",
          businessId: emailMatches[0].id,
          matches: emailMatches,
        };
      } else if (emailMatches.length > 1) {
        matches.push(...emailMatches);
        confidence = "medium";
      }
    }
  }

  // Try to match by company name
  if (companyName) {
    const nameMatches = await prisma.business.findMany({
      where: {
        name: {
          contains: companyName,
          mode: "insensitive",
        },
      },
      take: 5,
    });

    if (nameMatches.length === 1 && matches.length === 0) {
      // Single match by name only - medium confidence
      return {
        confidence: "medium",
        businessId: nameMatches[0].id,
        matches: nameMatches,
      };
    } else if (nameMatches.length >= 1) {
      // Add any name matches to our results
      for (const match of nameMatches) {
        if (!matches.some((m) => m.id === match.id)) {
          matches.push(match);
        }
      }
    }
  }

  if (matches.length > 0) {
    return {
      confidence,
      businessId: confidence === "medium" ? matches[0].id : null,
      matches,
    };
  }

  return null;
}

export async function getTickets(
  options: {
    status?: string;
    businessId?: string;
    assigneeId?: string;
  } = {}
) {
  const { status, businessId, assigneeId } = options;

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(businessId ? { businessId } : {}),
      ...(assigneeId ? { assigneeId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      business: true,
      tags: true,
    },
  });

  return tickets;
}

export async function getTicket(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      business: true,
      contact: true,
      tags: true,
      comments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return ticket;
}

export async function createTicket(data: {
  name?: string;
  email?: string;
  companyName?: string;
  subject: string;
  description: string;
  priority?: "low" | "medium" | "high" | "urgent";
}) {
  const {
    name,
    email,
    companyName,
    subject,
    description,
    priority = "medium",
  } = data;

  // Validate required fields
  if (!subject || !description) {
    throw new Error("Subject and description are required");
  }

  // Try to find business match
  const possibleBusinessMatch = await findPossibleBusinessMatch(
    email || "",
    companyName || ""
  );

  // Create ticket regardless of match
  const ticket = await prisma.ticket.create({
    data: {
      title: subject,
      description,
      status: "unassigned", // Special status for tickets pending business assignment
      priority: priority,
      // Connect to business if high confidence match
      ...(possibleBusinessMatch?.confidence === "high"
        ? {
            businessId: possibleBusinessMatch.businessId,
            status: "open", // Auto-assign if high confidence
          }
        : {}),
      // Store original submission data
      submitterName: name,
      submitterEmail: email,
      submittedCompanyName: companyName,
    },
  });

  revalidatePath("/tickets");

  return {
    success: true,
    ticketId: ticket.id,
    requiresReview:
      !possibleBusinessMatch || possibleBusinessMatch.confidence !== "high",
  };
}

export async function updateTicket(
  id: string,
  data: {
    status?: string;
    priority?: string;
    businessId?: string;
    assigneeId?: string;
    [key: string]: any;
  }
) {
  // Ensure ticket exists
  const existingTicket = await prisma.ticket.findUnique({
    where: { id },
  });

  if (!existingTicket) {
    throw new Error("Ticket not found");
  }

  // Check if we're resolving the ticket
  if (data.status === "resolved" && existingTicket.status !== "resolved") {
    data.resolvedAt = new Date();
  }

  // Update ticket
  const updatedTicket = await prisma.ticket.update({
    where: { id },
    data: data as any,
    include: {
      business: true,
      tags: true,
    },
  });

  revalidatePath(`/tickets/${id}`);
  revalidatePath("/tickets");

  return updatedTicket;
}

export async function addComment(
  ticketId: string,
  data: {
    content: string;
    isInternal?: boolean;
    authorId?: string;
  }
) {
  const { content, isInternal = false, authorId = "system" } = data;

  // Validate content
  if (!content) {
    throw new Error("Comment content is required");
  }

  // Check if ticket exists
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  // Create the comment
  const comment = await prisma.ticketComment.create({
    data: {
      content,
      isInternal,
      authorId,
      ticketId,
    },
  });

  revalidatePath(`/tickets/${ticketId}`);

  return comment;
}

export async function deleteTicket(id: string) {
  // Delete comments first to avoid foreign key constraint errors
  await prisma.ticketComment.deleteMany({
    where: { ticketId: id },
  });

  // Delete the ticket
  await prisma.ticket.delete({
    where: { id },
  });

  revalidatePath("/tickets");

  return { success: true };
}

export async function searchBusinesses(query: string) {
  if (!query) {
    return [];
  }

  const businesses = await prisma.business.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { website: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      website: true,
      status: true,
    },
    take: 10,
  });

  return businesses;
}
