"use server";

import { Business, CustomerStage, SmsMessage } from "@prisma/client";
import { businessService } from "@/lib/services/business-service";
import { getCurrentUserWorkspaceId } from "@/lib/workspace";

/**
 * Get all customers for the current workspace
 */
export async function getCustomers(): Promise<Business[]> {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();
    return await businessService.getCustomers(workspaceId);
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers");
  }
}

/**
 * Get customer by ID, ensuring it belongs to the current workspace
 */
export async function getCustomerById(id: string): Promise<Business | null> {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();
    return await businessService.getBusinessById(id, workspaceId);
  } catch (error) {
    console.error(`Error fetching customer ${id}:`, error);
    throw new Error("Failed to fetch customer details");
  }
}

/**
 * Update customer details, ensuring it belongs to the current workspace
 */
export async function updateCustomerDetails(
  customerId: string,
  data: any // Use a proper type here
): Promise<Business> {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();
    return await businessService.updateBusiness(customerId, data, workspaceId);
  } catch (error) {
    console.error("Error updating customer:", error);
    throw new Error("Failed to update customer");
  }
}

/**
 * Delete a customer, ensuring it belongs to the current workspace
 */
export async function deleteCustomer(customerId: string): Promise<Business> {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();
    return await businessService.deleteBusiness(customerId, workspaceId);
  } catch (error) {
    console.error("Error deleting customer:", error);
    throw new Error("Failed to delete customer");
  }
}

/**
 * Convert lead to customer with additional data, ensuring it belongs to the current workspace
 */
export async function convertLeadToCustomer(
  leadId: string,
  customerData: any // Define a proper type
): Promise<Business> {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();

    // First verify business belongs to workspace
    const business = await businessService.getBusinessById(leadId, workspaceId);

    if (!business) {
      throw new Error("Lead not found in workspace");
    }

    // Call the convert function with proper arguments
    return await businessService.convertToCustomer(leadId, customerData);
  } catch (error) {
    console.error("Error converting lead to customer:", error);
    throw new Error("Failed to convert lead to customer");
  }
}

/**
 * Send SMS to a customer, ensuring it belongs to the current workspace
 */
export async function sendSmsToCustomer(
  customerId: string,
  content: string
): Promise<SmsMessage> {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();
    // First verify business belongs to workspace
    const business = await businessService.getBusinessById(
      customerId,
      workspaceId
    );

    if (!business) {
      throw new Error("Customer not found in workspace");
    }

    return await businessService.sendSms(customerId, content);
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw new Error("Failed to send SMS");
  }
}

/**
 * Get SMS history for a customer, ensuring it belongs to the current workspace
 */
export async function getSmsHistory(customerId: string): Promise<SmsMessage[]> {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();
    // First verify business belongs to workspace
    const business = await businessService.getBusinessById(
      customerId,
      workspaceId
    );

    if (!business) {
      throw new Error("Customer not found in workspace");
    }

    return await businessService.getSmsHistory(customerId);
  } catch (error) {
    console.error("Error fetching SMS history:", error);
    throw new Error("Failed to fetch SMS history");
  }
}
