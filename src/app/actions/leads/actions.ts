"use server";

import { Business, CustomerStage } from "@prisma/client";
import { businessService } from "@/lib/services/business-service";

export async function getLeads(): Promise<Business[]> {
  try {
    return await businessService.getLeads();
  } catch (error) {
    console.error("Error fetching leads:", error);
    throw new Error("Failed to fetch leads");
  }
}

export async function getLeadById(id: string): Promise<Business | null> {
  try {
    return await businessService.getBusinessById(id);
  } catch (error) {
    console.error(`Error fetching lead ${id}:`, error);
    throw new Error("Failed to fetch lead details");
  }
}

export async function updateLeadStatus(
  leadId: string,
  newStage: CustomerStage
): Promise<Business> {
  try {
    return await businessService.updateBusinessStage(leadId, newStage);
  } catch (error) {
    console.error("Error updating lead status:", error);
    throw new Error("Failed to update lead status");
  }
}
