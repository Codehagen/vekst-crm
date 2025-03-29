import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

/**
 * Helper to notify support staff about tickets needing assignment
 */
async function notifyTicketNeedsAssignment(ticketId: string) {
  // In a real implementation, this would send an email, notification, etc.
  console.log(`Ticket ${ticketId} needs business assignment`);

  // Could use a notification service, email, etc.
  return true;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Extract available information
    const {
      name,
      email,
      companyName,
      subject,
      description,
      priority = "medium",
      // other form fields
    } = data;

    // Validate required fields
    if (!subject || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Try to find business match
    const possibleBusinessMatch = await findPossibleBusinessMatch(
      email,
      companyName
    );

    // Create ticket regardless of match
    const ticket = await prisma.ticket.create({
      data: {
        title: subject,
        description,
        status: "unassigned", // Special status for tickets pending business assignment
        priority: priority as "low" | "medium" | "high" | "urgent",
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

    // Send notification to support staff for manual review if needed
    if (!possibleBusinessMatch || possibleBusinessMatch.confidence !== "high") {
      await notifyTicketNeedsAssignment(ticket.id);
    }

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      requiresReview:
        !possibleBusinessMatch || possibleBusinessMatch.confidence !== "high",
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const businessId = searchParams.get("businessId");
    const assigneeId = searchParams.get("assigneeId");

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

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}
