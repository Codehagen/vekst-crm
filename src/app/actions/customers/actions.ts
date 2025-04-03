"use server";

import { Business, CustomerStage, SmsMessage } from "@prisma/client";
import { businessService } from "@/lib/services/business-service";
import { getCurrentUserWorkspaceId } from "@/lib/workspace";
import { prisma } from "@/lib/db";

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

/**
 * Delete multiple customers at once with option to delete associated businesses
 */
export async function deleteCustomers(
  customerIds: string[],
  deleteBusinesses: boolean = false
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();

    // Verify all customers belong to workspace
    for (const customerId of customerIds) {
      const customer = await businessService.getBusinessById(
        customerId,
        workspaceId
      );
      if (!customer) {
        throw new Error(`Customer ${customerId} not found in workspace`);
      }
    }

    // If deleteBusinesses is true, we'll delete both the customer records
    // and their associated business records. If false, we'll only delete
    // the customer records but preserve the business entries.

    // Since in our schema, customers are actually businesses with stage="customer",
    // we're just deleting the records directly.
    const deletedCustomers = await prisma.business.deleteMany({
      where: {
        id: {
          in: customerIds,
        },
        workspaceId,
      },
    });

    // If we're also deleting associated businesses, we would implement that here
    // For now, this is a placeholder since the data model may not have this relationship
    if (deleteBusinesses) {
      // Example implementation if there were business associations
      // await prisma.business.deleteMany({
      //   where: {
      //     customerId: {
      //       in: customerIds,
      //     },
      //   },
      // });
      console.log(
        "Deleting associated businesses is enabled but implementation is pending"
      );
    }

    return { success: true, count: deletedCustomers.count };
  } catch (error) {
    console.error("Failed to delete customers:", error);
    return { success: false, count: 0, error: (error as Error).message };
  }
}
