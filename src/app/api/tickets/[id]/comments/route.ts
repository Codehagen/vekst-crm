import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: {
    id: string;
  };
}

// Add a comment to a ticket
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const {
      content,
      isInternal = false,
      authorId = "system",
    } = await request.json();

    // Validate content
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Create the comment
    const comment = await prisma.ticketComment.create({
      data: {
        content,
        isInternal,
        authorId,
        ticketId: params.id,
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}

// Get all comments for a ticket
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const comments = await prisma.ticketComment.findMany({
      where: { ticketId: params.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
