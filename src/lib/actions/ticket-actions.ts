"use server";

import { PrismaClient, TicketStatus, Priority } from "@prisma/client";

const prisma = new PrismaClient();

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  businessName: string | null;
  contactName: string | null;
  assignee: string | null;
  creator: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date | null;
  tags: string[];
  commentCount: number;
}

export async function getTickets(): Promise<Ticket[]> {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        business: true,
        contact: true,
        tags: true,
        comments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return tickets.map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status as string,
      priority: ticket.priority as string,
      businessName: ticket.business?.name || null,
      contactName: ticket.contact?.name || null,
      assignee: ticket.assigneeId || null, // In a real app, you'd fetch the actual assignee name
      creator: ticket.creatorId || "system",
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      dueDate: ticket.dueDate,
      tags: ticket.tags.map((tag) => tag.name),
      commentCount: ticket.comments.length,
    }));
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    return [];
  }
}

export async function assignTicket(ticketId: string, assigneeId: string) {
  try {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { assigneeId },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to assign ticket:", error);
    return { success: false, error: "Failed to assign ticket" };
  }
}

export async function updateTicketStatus(ticketId: string, status: string) {
  try {
    const validStatus = status as TicketStatus;

    const updateData: any = {
      status: validStatus,
    };

    // If resolving or closing, set resolvedAt
    if (validStatus === "resolved" || validStatus === "closed") {
      updateData.resolvedAt = new Date();
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update ticket status:", error);
    return { success: false, error: "Failed to update ticket status" };
  }
}

export async function addTicketComment(
  ticketId: string,
  content: string,
  authorId: string,
  isInternal: boolean = false
) {
  try {
    await prisma.ticketComment.create({
      data: {
        content,
        authorId,
        isInternal,
        ticketId,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to add comment:", error);
    return { success: false, error: "Failed to add comment" };
  }
}
