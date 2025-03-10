"use server";

import { Contact } from "@prisma/client";
import { contactService } from "@/lib/services/contact-service";

export async function getContacts(): Promise<Contact[]> {
  try {
    return await contactService.getAllContacts();
  } catch (error) {
    console.error("Error fetching contacts:", error);
    throw new Error("Failed to fetch contacts");
  }
}

export async function getContactById(id: string): Promise<Contact | null> {
  try {
    return await contactService.getContactById(id);
  } catch (error) {
    console.error(`Error fetching contact ${id}:`, error);
    throw new Error("Failed to fetch contact details");
  }
}

export async function getContactsByBusiness(
  businessId: string
): Promise<Contact[]> {
  try {
    return await contactService.getContactsByBusiness(businessId);
  } catch (error) {
    console.error(`Error fetching contacts for business ${businessId}:`, error);
    throw new Error("Failed to fetch business contacts");
  }
}
