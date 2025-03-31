"use server";

import { Business, CustomerStage, SmsMessage } from "@prisma/client";
import { businessService } from "@/lib/services/business-service";

/**
 * Get all customers
 */
export async function getCustomers(): Promise<Business[]> {
  try {
    return await businessService.getCustomers();
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers");
  }
}

/**
 * Get customer by ID
 */
export async function getCustomerById(id: string): Promise<Business | null> {
  try {
    return await businessService.getBusinessById(id);
  } catch (error) {
    console.error(`Error fetching customer ${id}:`, error);
    throw new Error("Failed to fetch customer details");
  }
}

/**
 * Update customer details
 */
export async function updateCustomerDetails(
  customerId: string,
  data: any // Use a proper type here
): Promise<Business> {
  try {
    return await businessService.updateBusiness(customerId, data);
  } catch (error) {
    console.error("Error updating customer:", error);
    throw new Error("Failed to update customer");
  }
}

/**
 * Delete a customer
 */
export async function deleteCustomer(customerId: string): Promise<Business> {
  try {
    return await businessService.deleteBusiness(customerId);
  } catch (error) {
    console.error("Error deleting customer:", error);
    throw new Error("Failed to delete customer");
  }
}

/**
 * Convert lead to customer with additional data
 */
export async function convertLeadToCustomer(
  leadId: string,
  customerData: any // Define a proper type
): Promise<Business> {
  try {
    return await businessService.convertToCustomer(leadId, customerData);
  } catch (error) {
    console.error("Error converting lead to customer:", error);
    throw new Error("Failed to convert lead to customer");
  }
}

/**
 * Send SMS to a customer
 */
export async function sendSmsToCustomer(
  customerId: string,
  content: string
): Promise<SmsMessage> {
  try {
    return await businessService.sendSms(customerId, content);
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw new Error("Failed to send SMS");
  }
}

/**
 * Get SMS history for a customer
 */
export async function getSmsHistory(customerId: string): Promise<SmsMessage[]> {
  try {
    return await businessService.getSmsHistory(customerId);
  } catch (error) {
    console.error("Error fetching SMS history:", error);
    throw new Error("Failed to fetch SMS history");
  }
}
