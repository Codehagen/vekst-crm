import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

interface RouteParams {
  params: {
    id: string;
  };
}

// Get a specific ticket
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        business: true,
        contact: true,
        tags: true,
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// Update a ticket
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const data = await request.json();

    // Ensure ticket exists
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: params.id },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check if we're resolving the ticket
    if (data.status === "resolved" && existingTicket.status !== "resolved") {
      data.resolvedAt = new Date();
    }

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: params.id },
      data,
      include: {
        business: true,
        tags: true,
      },
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}

// Delete a ticket
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await prisma.ticketComment.deleteMany({
      where: { ticketId: params.id },
    });

    await prisma.ticket.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      { error: "Failed to delete ticket" },
      { status: 500 }
    );
  }
}
