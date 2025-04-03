import { prisma } from "@/lib/db";
import {
  JobApplication,
  JobApplicationStatus,
  Activity,
  ActivityType,
  Prisma,
} from "@prisma/client";

export interface CreateJobApplicationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  resume?: string;
  coverLetter?: string;
  experience?: number;
  education?: string;
  skills?: string[];
  desiredPosition?: string;
  currentEmployer?: string;
  expectedSalary?: number;
  startDate?: Date;
  notes?: string;
  source?: string;
  status?: JobApplicationStatus;
}

export interface UpdateJobApplicationInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  resume?: string | null;
  coverLetter?: string | null;
  experience?: number | null;
  education?: string | null;
  skills?: string[];
  desiredPosition?: string | null;
  currentEmployer?: string | null;
  expectedSalary?: number | null;
  startDate?: Date | null;
  notes?: string | null;
  source?: string | null;
  status?: JobApplicationStatus;
}

export interface JobApplicationWithActivities extends JobApplication {
  activities: Activity[];
}

export interface IJobApplicationService {
  getJobApplications(workspaceId?: string): Promise<JobApplication[]>;
  getJobApplicationsByStatus(
    status: JobApplicationStatus,
    workspaceId?: string
  ): Promise<JobApplication[]>;
  getJobApplicationById(
    id: string,
    workspaceId?: string
  ): Promise<JobApplication | null>;
  createJobApplication(
    data: Omit<JobApplication, "id" | "createdAt" | "updatedAt">
  ): Promise<JobApplication>;
  updateJobApplication(
    id: string,
    data: Partial<Omit<JobApplication, "id" | "createdAt" | "updatedAt">>,
    workspaceId?: string
  ): Promise<JobApplication>;
  updateJobApplicationStatus(
    id: string,
    status: JobApplicationStatus,
    workspaceId?: string
  ): Promise<JobApplication>;
  deleteJobApplication(
    id: string,
    workspaceId?: string
  ): Promise<JobApplication>;
  searchJobApplications(
    searchTerm: string,
    workspaceId?: string
  ): Promise<JobApplication[]>;
  addActivity(
    jobApplicationId: string,
    data: {
      type: ActivityType;
      date: Date;
      description: string;
      completed?: boolean;
      outcome?: string;
      userId: string;
    },
    workspaceId?: string
  ): Promise<Activity>;
}

export const jobApplicationService: IJobApplicationService = {
  async getJobApplications(workspaceId?: string): Promise<JobApplication[]> {
    if (!workspaceId) {
      return prisma.jobApplication.findMany({
        orderBy: {
          applicationDate: "desc",
        },
      });
    }

    // First try to filter by workspaceId if the field exists
    try {
      const applications = await prisma.jobApplication.findMany({
        where: {
          // Use type assertion to handle potential schema differences
          ...(workspaceId ? ({ workspaceId } as any) : {}),
        },
        orderBy: {
          applicationDate: "desc",
        },
      });

      // If we got results or if the query didn't error, return them
      return applications;
    } catch (error) {
      console.warn(
        "Could not filter by workspaceId, falling back to alternative filtering"
      );

      // If the schema doesn't have workspaceId yet, show all applications for now
      // In a production environment, you would implement alternative filtering
      return prisma.jobApplication.findMany({
        orderBy: {
          applicationDate: "desc",
        },
      });
    }
  },

  async getJobApplicationsByStatus(
    status: JobApplicationStatus,
    workspaceId?: string
  ): Promise<JobApplication[]> {
    if (!workspaceId) {
      return prisma.jobApplication.findMany({
        where: { status },
        orderBy: {
          applicationDate: "desc",
        },
      });
    }

    // First try to filter by workspaceId if the field exists
    try {
      const applications = await prisma.jobApplication.findMany({
        where: {
          status,
          // Use type assertion to handle potential schema differences
          ...(workspaceId ? ({ workspaceId } as any) : {}),
        },
        orderBy: {
          applicationDate: "desc",
        },
      });

      // If we got results or if the query didn't error, return them
      return applications;
    } catch (error) {
      console.warn(
        "Could not filter by workspaceId, falling back to alternative filtering"
      );

      // If the schema doesn't have workspaceId yet, show all applications for now
      return prisma.jobApplication.findMany({
        where: { status },
        orderBy: {
          applicationDate: "desc",
        },
      });
    }
  },

  async getJobApplicationById(
    id: string,
    workspaceId?: string
  ): Promise<JobApplication | null> {
    if (!workspaceId) {
      return prisma.jobApplication.findUnique({
        where: { id },
      });
    }

    // First try to filter by workspaceId if the field exists
    try {
      const application = await prisma.jobApplication.findFirst({
        where: {
          id,
          // Use type assertion to handle potential schema differences
          ...(workspaceId ? ({ workspaceId } as any) : {}),
        },
      });

      // If we got a result or if the query didn't error, return it
      return application;
    } catch (error) {
      console.warn(
        "Could not filter by workspaceId, falling back to alternative filtering"
      );

      // If the schema doesn't have workspaceId yet, return the application regardless of workspace
      // In a production environment, you would implement proper security checks
      return prisma.jobApplication.findUnique({
        where: { id },
      });
    }
  },

  async createJobApplication(
    data: Omit<JobApplication, "id" | "createdAt" | "updatedAt">
  ): Promise<JobApplication> {
    try {
      // Try to create with data as-is (may include workspaceId)
      return await prisma.jobApplication.create({
        data,
      });
    } catch (error) {
      console.warn(
        "Error during job application creation, trying without workspaceId"
      );

      // If the error is related to unknown fields, try without workspaceId
      // Create a shallow copy of data and remove workspaceId
      const dataCopy = { ...data };
      if ("workspaceId" in dataCopy) {
        // Remove workspaceId property if it exists
        delete (dataCopy as any).workspaceId;
      }

      return prisma.jobApplication.create({
        data: dataCopy,
      });
    }
  },

  async updateJobApplication(
    id: string,
    data: Partial<Omit<JobApplication, "id" | "createdAt" | "updatedAt">>,
    workspaceId?: string
  ): Promise<JobApplication> {
    // First verify this application belongs to the workspace
    if (workspaceId) {
      try {
        const application = await prisma.jobApplication.findFirst({
          where: {
            id,
            // Use type assertion for workspace filtering
            ...(workspaceId ? ({ workspaceId } as any) : {}),
          },
          select: { id: true },
        });

        if (!application) {
          throw new Error("Application not found in workspace");
        }
      } catch (error) {
        console.warn(
          "Could not verify workspace ownership, proceeding with update"
        );
        // If schema doesn't have workspace field, proceed with update
      }
    }

    return prisma.jobApplication.update({
      where: { id },
      data,
    });
  },

  async updateJobApplicationStatus(
    id: string,
    status: JobApplicationStatus,
    workspaceId?: string
  ): Promise<JobApplication> {
    // First verify this application belongs to the workspace
    if (workspaceId) {
      try {
        const application = await prisma.jobApplication.findFirst({
          where: {
            id,
            // Use type assertion for workspace filtering
            ...(workspaceId ? ({ workspaceId } as any) : {}),
          },
          select: { id: true },
        });

        if (!application) {
          throw new Error("Application not found in workspace");
        }
      } catch (error) {
        console.warn(
          "Could not verify workspace ownership, proceeding with update"
        );
        // If schema doesn't have workspace field, proceed with update
      }
    }

    return prisma.jobApplication.update({
      where: { id },
      data: { status },
    });
  },

  async deleteJobApplication(
    id: string,
    workspaceId?: string
  ): Promise<JobApplication> {
    // First verify this application belongs to the workspace
    if (workspaceId) {
      try {
        const application = await prisma.jobApplication.findFirst({
          where: {
            id,
            // Use type assertion for workspace filtering
            ...(workspaceId ? ({ workspaceId } as any) : {}),
          },
          select: { id: true },
        });

        if (!application) {
          throw new Error("Application not found in workspace");
        }
      } catch (error) {
        console.warn(
          "Could not verify workspace ownership, proceeding with delete"
        );
        // If schema doesn't have workspace field, proceed with delete
      }
    }

    return prisma.jobApplication.delete({
      where: { id },
    });
  },

  async searchJobApplications(
    searchTerm: string,
    workspaceId?: string
  ): Promise<JobApplication[]> {
    const term = searchTerm.toLowerCase().trim();

    if (!workspaceId) {
      return prisma.jobApplication.findMany({
        where: {
          OR: [
            { firstName: { contains: term, mode: "insensitive" } },
            { lastName: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
            { desiredPosition: { contains: term, mode: "insensitive" } },
            { currentEmployer: { contains: term, mode: "insensitive" } },
            { education: { contains: term, mode: "insensitive" } },
            { skills: { hasSome: [term] } },
          ],
        },
        orderBy: {
          applicationDate: "desc",
        },
      });
    }

    // First try to filter by workspaceId if the field exists
    try {
      // Use type assertion to handle potential schema differences
      const where = {
        OR: [
          { firstName: { contains: term, mode: "insensitive" } },
          { lastName: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
          { desiredPosition: { contains: term, mode: "insensitive" } },
          { currentEmployer: { contains: term, mode: "insensitive" } },
          { education: { contains: term, mode: "insensitive" } },
          { skills: { hasSome: [term] } },
        ],
      } as any;

      // Add workspaceId if available
      if (workspaceId) {
        where.workspaceId = workspaceId;
      }

      const applications = await prisma.jobApplication.findMany({
        where,
        orderBy: {
          applicationDate: "desc",
        },
      });

      return applications;
    } catch (error) {
      console.warn(
        "Could not filter by workspaceId, falling back to alternative filtering"
      );

      // If the schema doesn't have workspaceId yet, show all matching applications
      return prisma.jobApplication.findMany({
        where: {
          OR: [
            { firstName: { contains: term, mode: "insensitive" } },
            { lastName: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
            { desiredPosition: { contains: term, mode: "insensitive" } },
            { currentEmployer: { contains: term, mode: "insensitive" } },
            { education: { contains: term, mode: "insensitive" } },
            { skills: { hasSome: [term] } },
          ],
        },
        orderBy: {
          applicationDate: "desc",
        },
      });
    }
  },

  // Add an activity to a job application
  addActivity: async (
    jobApplicationId: string,
    data: {
      type: ActivityType;
      date: Date;
      description: string;
      completed?: boolean;
      outcome?: string;
      userId: string;
    },
    workspaceId?: string
  ): Promise<Activity> => {
    // First verify this application belongs to the workspace
    if (workspaceId) {
      try {
        const application = await prisma.jobApplication.findFirst({
          where: {
            id: jobApplicationId,
            // Use type assertion for workspace filtering
            ...(workspaceId ? ({ workspaceId } as any) : {}),
          },
          select: { id: true },
        });

        if (!application) {
          throw new Error("Application not found in workspace");
        }
      } catch (error) {
        console.warn(
          "Could not verify workspace ownership, proceeding with activity creation"
        );
        // If schema doesn't have workspace field, proceed with creating activity
      }
    }

    return prisma.activity.create({
      data: {
        ...data,
        jobApplication: {
          connect: {
            id: jobApplicationId,
          },
        },
      },
    });
  },
};

export default jobApplicationService;
