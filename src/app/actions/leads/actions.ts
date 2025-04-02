"use server";

import { Business, CustomerStage, BusinessStatus } from "@prisma/client";
import { businessService } from "@/lib/services/business-service";
import { getCurrentUserWorkspaceId } from "@/lib/workspace";

/**
 * Get all leads for the current workspace
 */
export async function getLeads(): Promise<Business[]> {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();
    return await businessService.getLeads(workspaceId);
  } catch (error) {
    console.error("Error fetching leads:", error);
    throw new Error("Failed to fetch leads");
  }
}

/**
 * Get lead by ID, ensuring it belongs to the current workspace
 */
export async function getLeadById(id: string): Promise<Business | null> {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();
    return await businessService.getBusinessById(id, workspaceId);
  } catch (error) {
    console.error(`Error fetching lead ${id}:`, error);
    throw new Error("Failed to fetch lead details");
  }
}

/**
 * Update lead status, ensuring it belongs to the current workspace
 */
export async function updateLeadStatus(
  leadId: string,
  newStage: CustomerStage
): Promise<Business> {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();
    return await businessService.updateBusinessStage(
      leadId,
      newStage,
      workspaceId
    );
  } catch (error) {
    console.error("Error updating lead status:", error);
    throw new Error("Failed to update lead status");
  }
}

/**
 * Create a new lead in the current workspace
 */
export async function createLead(data: {
  name: string;
  email: string;
  phone: string;
  status: BusinessStatus;
  orgNumber?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  website?: string;
  industry?: string;
  numberOfEmployees?: number;
  revenue?: number;
  notes?: string;
  potensiellVerdi?: number;
}): Promise<Business> {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();

    // Make sure it's a lead
    const leadData = {
      ...data,
      stage: CustomerStage.lead,
    };

    return await businessService.createBusiness(leadData, workspaceId);
  } catch (error) {
    console.error("Error creating lead:", error);
    throw new Error("Failed to create lead");
  }
}
