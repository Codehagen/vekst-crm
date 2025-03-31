import { prisma } from "@/lib/db";
import {
  Business,
  BusinessStatus,
  CustomerStage,
  Contact,
  Activity,
  Offer,
  SmsMessage,
  SmsStatus,
  MessageDirection,
} from "@prisma/client";

export interface CreateBusinessInput {
  name: string;
  orgNumber?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  email: string;
  phone: string;
  website?: string;
  industry?: string;
  numberOfEmployees?: number;
  revenue?: number;
  notes?: string;
  status: BusinessStatus;
  stage: CustomerStage;
  potensiellVerdi?: number;
  tags?: string[];
}

export interface UpdateBusinessInput {
  name?: string;
  orgNumber?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string | null;
  industry?: string | null;
  numberOfEmployees?: number | null;
  revenue?: number | null;
  notes?: string | null;
  status?: BusinessStatus;
  stage?: CustomerStage;
  bilagCount?: number;
  potensiellVerdi?: number | null;
}

// Business with related data
export interface BusinessWithRelations extends Business {
  contacts: Contact[];
  activities: Activity[];
  offers: Offer[];
  tags: { name: string }[];
}

export const businessService = {
  /**
   * Get all businesses
   */
  getAllBusinesses: async (): Promise<Business[]> => {
    return prisma.business.findMany({
      orderBy: {
        name: "asc",
      },
    });
  },

  /**
   * Get businesses by stage
   */
  getBusinessesByStage: async (stage: CustomerStage): Promise<Business[]> => {
    return prisma.business.findMany({
      where: { stage },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  /**
   * Get leads (businesses at early stages: lead, prospect, qualified)
   */
  getLeads: async (): Promise<Business[]> => {
    return prisma.business.findMany({
      where: {
        stage: {
          in: [
            CustomerStage.lead,
            CustomerStage.prospect,
            CustomerStage.qualified,
          ],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  /**
   * Get a business by ID with all related data
   */
  getBusinessById: async (
    id: string
  ): Promise<BusinessWithRelations | null> => {
    return prisma.business.findUnique({
      where: { id },
      include: {
        contacts: true,
        activities: {
          orderBy: {
            date: "desc",
          },
        },
        offers: {
          include: {
            items: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        tags: true,
      },
    });
  },

  /**
   * Create a new business
   */
  createBusiness: async (
    businessData: CreateBusinessInput
  ): Promise<Business> => {
    const { tags, ...rest } = businessData;

    const tagsData = tags
      ? {
          connectOrCreate: tags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        }
      : undefined;

    return prisma.business.create({
      data: {
        ...rest,
        // Connect or create tags
        tags: tagsData,
      },
    });
  },

  /**
   * Update a business
   */
  updateBusiness: async (
    id: string,
    data: UpdateBusinessInput
  ): Promise<Business> => {
    return prisma.business.update({
      where: { id },
      data,
    });
  },

  /**
   * Update business stage - used for lifecycle changes (e.g., lead to customer)
   */
  updateBusinessStage: async (
    id: string,
    stage: CustomerStage
  ): Promise<Business> => {
    return prisma.business.update({
      where: { id },
      data: { stage },
    });
  },

  /**
   * Delete a business
   */
  deleteBusiness: async (id: string): Promise<Business> => {
    return prisma.business.delete({
      where: { id },
    });
  },

  /**
   * Add tags to a business
   */
  addTagsToBusiness: async (
    businessId: string,
    tagNames: string[]
  ): Promise<Business> => {
    return prisma.business.update({
      where: { id: businessId },
      data: {
        tags: {
          connectOrCreate: tagNames.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
    });
  },

  /**
   * Remove a tag from a business
   */
  removeTagFromBusiness: async (
    businessId: string,
    tagName: string
  ): Promise<Business> => {
    const tag = await prisma.tag.findUnique({
      where: { name: tagName },
    });

    if (!tag) {
      throw new Error(`Tag ${tagName} not found`);
    }

    return prisma.business.update({
      where: { id: businessId },
      data: {
        tags: {
          disconnect: { id: tag.id },
        },
      },
    });
  },

  /**
   * Get all contacts for a business
   */
  getBusinessContacts: async (businessId: string): Promise<Contact[]> => {
    return prisma.contact.findMany({
      where: { businessId },
      orderBy: { isPrimary: "desc" },
    });
  },

  /**
   * Get all activities for a business
   */
  getBusinessActivities: async (businessId: string): Promise<Activity[]> => {
    return prisma.activity.findMany({
      where: { businessId },
      orderBy: { date: "desc" },
      include: {
        contact: true,
      },
    });
  },

  /**
   * Get all offers for a business
   */
  getBusinessOffers: async (businessId: string): Promise<Offer[]> => {
    return prisma.offer.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        contact: true,
      },
    });
  },

  /**
   * Get customers (businesses at customer stage)
   */
  getCustomers: async (): Promise<Business[]> => {
    return prisma.business.findMany({
      where: {
        stage: CustomerStage.customer,
      },
      orderBy: {
        name: "asc",
      },
    });
  },

  /**
   * Convert a lead to a customer with additional data
   */
  convertToCustomer: async (
    businessId: string,
    customerData: any
  ): Promise<Business> => {
    return prisma.business.update({
      where: { id: businessId },
      data: {
        stage: CustomerStage.customer,
        customerSince: new Date(),
        ...customerData,
      },
    });
  },

  /**
   * Send SMS to a business
   */
  sendSms: async (businessId: string, content: string): Promise<SmsMessage> => {
    // 1. Get business details
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) throw new Error("Business not found");

    // 2. Call SMS provider API (implementation needed)
    // const smsResponse = await smsProviderClient.sendSms(business.phone, content);

    // 3. Store the SMS in the database
    return prisma.smsMessage.create({
      data: {
        content,
        status: SmsStatus.pending, // Update with actual status when SMS API is implemented
        direction: MessageDirection.outbound,
        businessId,
      },
    });
  },

  /**
   * Get SMS history for a business
   */
  getSmsHistory: async (businessId: string): Promise<SmsMessage[]> => {
    return prisma.smsMessage.findMany({
      where: { businessId },
      orderBy: { sentAt: "desc" },
    });
  },
};
