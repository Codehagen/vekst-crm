"use server";

import {
  Business,
  BusinessStatus,
  Contact,
  Activity,
  Offer,
} from "@prisma/client";
import { businessService } from "@/lib/services/business-service";
import { BusinessWithRelations } from "@/lib/services/business-service";

export async function getBusinesses(): Promise<Business[]> {
  try {
    return await businessService.getAllBusinesses();
  } catch (error) {
    console.error("Error fetching businesses:", error);
    throw new Error("Failed to fetch businesses");
  }
}

export async function getBusinessById(
  id: string
): Promise<BusinessWithRelations | null> {
  try {
    return await businessService.getBusinessById(id);
  } catch (error) {
    console.error(`Error fetching business ${id}:`, error);
    throw new Error("Failed to fetch business details");
  }
}

export async function getBusinessContacts(
  businessId: string
): Promise<Contact[]> {
  try {
    return await businessService.getBusinessContacts(businessId);
  } catch (error) {
    console.error(`Error fetching contacts for business ${businessId}:`, error);
    throw new Error("Failed to fetch business contacts");
  }
}

export async function getBusinessActivities(
  businessId: string
): Promise<Activity[]> {
  try {
    return await businessService.getBusinessActivities(businessId);
  } catch (error) {
    console.error(
      `Error fetching activities for business ${businessId}:`,
      error
    );
    throw new Error("Failed to fetch business activities");
  }
}

export async function getBusinessOffers(businessId: string): Promise<Offer[]> {
  try {
    return await businessService.getBusinessOffers(businessId);
  } catch (error) {
    console.error(`Error fetching offers for business ${businessId}:`, error);
    throw new Error("Failed to fetch business offers");
  }
}
