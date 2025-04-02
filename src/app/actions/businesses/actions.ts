"use server";

import { prisma } from "@/lib/db";
import { Business, Contact, Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";

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
 * Get all businesses for the current workspace
 */
export async function getAllBusinesses() {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();

    return prisma.business.findMany({
      where: { workspaceId },
      orderBy: {
        name: "asc",
      },
      include: {
        contacts: {
          where: {
            isPrimary: true,
          },
          take: 1,
        },
        tags: true,
      },
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return [];
  }
}

/**
 * Get a business by ID, ensuring it belongs to the current workspace
 */
export async function getBusinessById(id: string) {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();

    return prisma.business.findFirst({
      where: {
        id,
        workspaceId,
      },
      include: {
        contacts: true,
        tags: true,
        activities: {
          orderBy: {
            date: "desc",
          },
          take: 10,
        },
      },
    });
  } catch (error) {
    console.error(`Error fetching business ${id}:`, error);
    return null;
  }
}

/**
 * Search businesses by name, email, or phone within the current workspace
 */
export async function searchBusinesses(query: string) {
  try {
    const searchQuery = query.trim();
    if (!searchQuery) return [];

    const workspaceId = await getCurrentUserWorkspaceId();

    return prisma.business.findMany({
      where: {
        workspaceId,
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { email: { contains: searchQuery, mode: "insensitive" } },
          { phone: { contains: searchQuery, mode: "insensitive" } },
          { contactPerson: { contains: searchQuery, mode: "insensitive" } },
        ],
      },
      include: {
        contacts: {
          where: {
            isPrimary: true,
          },
          take: 1,
        },
      },
      take: 10,
    });
  } catch (error) {
    console.error("Error searching businesses:", error);
    return [];
  }
}

/**
 * Create a new business in the current workspace
 */
export async function createBusiness(data: Prisma.BusinessCreateInput) {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();

    return prisma.business.create({
      data: {
        ...data,
        workspace: {
          connect: { id: workspaceId },
        },
      },
    });
  } catch (error) {
    console.error("Error creating business:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create business"
    );
  }
}

/**
 * Get primary contact for a business
 */
export async function getPrimaryContact(
  businessId: string
): Promise<Contact | null> {
  try {
    // Verify business belongs to workspace
    const workspaceId = await getCurrentUserWorkspaceId();
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        workspaceId,
      },
      select: { id: true },
    });

    if (!business) {
      throw new Error("Business not found in workspace");
    }

    const primaryContact = await prisma.contact.findFirst({
      where: {
        businessId,
        isPrimary: true,
      },
    });

    return primaryContact;
  } catch (error) {
    console.error(
      `Error fetching primary contact for business ${businessId}:`,
      error
    );
    return null;
  }
}

/**
 * Update a business, ensuring it belongs to the current workspace
 */
export async function updateBusiness(
  id: string,
  data: Prisma.BusinessUpdateInput
) {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();

    // Verify the business belongs to workspace
    const business = await prisma.business.findFirst({
      where: {
        id,
        workspaceId,
      },
      select: { id: true },
    });

    if (!business) {
      throw new Error("Business not found in workspace");
    }

    return prisma.business.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error(`Error updating business ${id}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to update business"
    );
  }
}

/**
 * Delete a business, ensuring it belongs to the current workspace
 */
export async function deleteBusiness(id: string) {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();

    // Verify the business belongs to workspace
    const business = await prisma.business.findFirst({
      where: {
        id,
        workspaceId,
      },
      select: { id: true },
    });

    if (!business) {
      throw new Error("Business not found in workspace");
    }

    return prisma.business.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Error deleting business ${id}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete business"
    );
  }
}
