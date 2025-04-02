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
  // Don't include workspaceId in the input - will be set from current user
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
  // Don't allow updating workspaceId directly
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
   * Get all businesses within a workspace
   */
  getAllBusinesses: async (workspaceId: string): Promise<Business[]> => {
    return prisma.business.findMany({
      where: { workspaceId },
      orderBy: {
        name: "asc",
      },
    });
  },

  /**
   * Get businesses by stage within a workspace
   */
  getBusinessesByStage: async (
    stage: CustomerStage,
    workspaceId: string
  ): Promise<Business[]> => {
    return prisma.business.findMany({
      where: {
        stage,
        workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  /**
   * Get customers within a workspace
   */
  getCustomers: async (workspaceId: string): Promise<Business[]> => {
    return prisma.business.findMany({
      where: {
        stage: CustomerStage.customer,
        workspaceId,
      },
      orderBy: {
        name: "asc",
      },
    });
  },

  /**
   * Get leads (businesses at early stages) within a workspace
   */
  getLeads: async (workspaceId: string): Promise<Business[]> => {
    return prisma.business.findMany({
      where: {
        workspaceId,
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
   * Get a business by ID within a workspace
   */
  getBusinessById: async (
    id: string,
    workspaceId: string
  ): Promise<BusinessWithRelations | null> => {
    return prisma.business.findFirst({
      where: {
        id,
        workspaceId,
      },
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
   * Create a new business within a workspace
   */
  createBusiness: async (
    businessData: CreateBusinessInput,
    workspaceId: string
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
        workspace: {
          connect: { id: workspaceId },
        },
        // Connect or create tags
        tags: tagsData,
      },
    });
  },

  /**
   * Update a business within a workspace
   */
  updateBusiness: async (
    id: string,
    data: UpdateBusinessInput,
    workspaceId: string
  ): Promise<Business> => {
    // First verify business belongs to workspace
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
  },

  /**
   * Update business stage within a workspace
   */
  updateBusinessStage: async (
    id: string,
    stage: CustomerStage,
    workspaceId: string
  ): Promise<Business> => {
    // First verify business belongs to workspace
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
      data: { stage },
    });
  },

  /**
   * Delete a business within a workspace
   */
  deleteBusiness: async (
    id: string,
    workspaceId: string
  ): Promise<Business> => {
    // First verify business belongs to workspace
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
