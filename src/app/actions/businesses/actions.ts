"use server";

import { prisma } from "@/lib/db";
import { Business, Contact, Prisma } from "@prisma/client";

/**
 * Get all businesses
 */
export async function getAllBusinesses() {
  return prisma.business.findMany({
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
}

/**
 * Get a business by ID
 */
export async function getBusinessById(id: string) {
  return prisma.business.findUnique({
    where: { id },
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
}

/**
 * Search businesses by name, email, or phone
 */
export async function searchBusinesses(query: string) {
  const searchQuery = query.trim();
  if (!searchQuery) return [];

  return prisma.business.findMany({
    where: {
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
}

/**
 * Get primary contact for a business
 */
export async function getPrimaryContact(
  businessId: string
): Promise<Contact | null> {
  const primaryContact = await prisma.contact.findFirst({
    where: {
      businessId,
      isPrimary: true,
    },
  });

  return primaryContact;
}

/**
 * Update a business
 */
export async function updateBusiness(
  id: string,
  data: Prisma.BusinessUpdateInput
) {
  return prisma.business.update({
    where: { id },
    data,
  });
}

/**
 * Delete a business
 */
export async function deleteBusiness(id: string) {
  return prisma.business.delete({
    where: { id },
  });
}
