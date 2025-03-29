import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json([]);
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

    return NextResponse.json(businesses);
  } catch (error) {
    console.error("Error searching businesses:", error);
    return NextResponse.json(
      { error: "Failed to search businesses" },
      { status: 500 }
    );
  }
}
