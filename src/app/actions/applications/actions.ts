"use server";

import { revalidatePath } from "next/cache";
import { JobApplication, JobApplicationStatus, Activity } from "@prisma/client";
import { jobApplicationService } from "@/lib/services";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get current user's workspace ID
 */
async function getCurrentUserWorkspaceId(): Promise<string> {
  const session = await getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { workspaceId: true },
  });

  if (!user?.workspaceId) {
    throw new Error("No workspace found for user");
  }

  return user.workspaceId;
}

// Get all applications with optional filtering
export async function getApplications(status?: JobApplicationStatus) {
  try {
    // Get workspace ID for filtering
    const workspaceId = await getCurrentUserWorkspaceId();

    let applications;

    if (status) {
      applications = await jobApplicationService.getJobApplicationsByStatus(
        status,
        workspaceId
      );
    } else {
      applications = await jobApplicationService.getJobApplications(
        workspaceId
      );
    }

    return applications;
  } catch (error) {
    console.error("Error fetching applications:", error);
    throw new Error("Failed to fetch applications");
  }
}

// Get a single application by ID with related activities
export async function getApplicationById(id: string) {
  try {
    // Get workspace ID for filtering
    const workspaceId = await getCurrentUserWorkspaceId();

    const application = await jobApplicationService.getJobApplicationById(
      id,
      workspaceId
    );

    if (!application) {
      throw new Error("Application not found");
    }

    // Get activities for this application
    const activities = await prisma.activity.findMany({
      where: {
        jobApplicationId: id,
      },
      orderBy: { date: "desc" },
    });

    return {
      ...application,
      activities,
    };
  } catch (error) {
    console.error(`Error fetching application ${id}:`, error);
    throw new Error("Failed to fetch application details");
  }
}

// Update application status
export async function updateApplicationStatus(
  id: string,
  status: JobApplicationStatus
) {
  try {
    // Get workspace ID for filtering
    const workspaceId = await getCurrentUserWorkspaceId();

    // Verify application exists and belongs to workspace
    const application = await jobApplicationService.getJobApplicationById(
      id,
      workspaceId
    );

    if (!application) {
      throw new Error("Application not found");
    }

    const updatedApplication =
      await jobApplicationService.updateJobApplicationStatus(
        id,
        status,
        workspaceId
      );

    // Create an activity to log this status change
    await prisma.activity.create({
      data: {
        type: "note",
        date: new Date(),
        description: `Status endret til ${getStatusLabel(status)}`,
        completed: true,
        jobApplicationId: id,
        userId: "system",
      },
    });

    revalidatePath(`/applications/${id}`);
    revalidatePath("/applications");

    return updatedApplication;
  } catch (error) {
    console.error(`Error updating application status:`, error);
    throw new Error("Failed to update application status");
  }
}

// Helper function for status labels
function getStatusLabel(status: JobApplicationStatus): string {
  const statusLabels: Record<JobApplicationStatus, string> = {
    new: "Ny",
    reviewing: "Under vurdering",
    interviewed: "Intervjuet",
    offer_extended: "Tilbud sendt",
    hired: "Ansatt",
    rejected: "Avslått",
  };
  return statusLabels[status];
}

// Add a new activity to an application
export async function addApplicationActivity(
  jobApplicationId: string,
  activityData: Omit<
    Activity,
    | "id"
    | "businessId"
    | "contactId"
    | "jobApplicationId"
    | "createdAt"
    | "updatedAt"
  >
) {
  try {
    // Get workspace ID for filtering
    const workspaceId = await getCurrentUserWorkspaceId();

    // Verify application exists and belongs to workspace
    const application = await jobApplicationService.getJobApplicationById(
      jobApplicationId,
      workspaceId
    );

    if (!application) {
      throw new Error("Application not found");
    }

    const activity = await prisma.activity.create({
      data: {
        ...activityData,
        jobApplicationId,
        userId: activityData.userId || "system",
      },
    });

    revalidatePath(`/applications/${jobApplicationId}`);

    return activity;
  } catch (error) {
    console.error(`Error adding activity to application:`, error);
    throw new Error("Failed to add activity");
  }
}

// Search applications
export async function searchApplications(searchTerm: string) {
  try {
    // Get workspace ID for filtering
    const workspaceId = await getCurrentUserWorkspaceId();

    const applications = await jobApplicationService.searchJobApplications(
      searchTerm,
      workspaceId
    );
    return applications;
  } catch (error) {
    console.error("Error searching applications:", error);
    throw new Error("Failed to search applications");
  }
}

// Add note to an application
export async function addApplicationNote(id: string, note: string) {
  try {
    // Get workspace ID for filtering
    const workspaceId = await getCurrentUserWorkspaceId();

    // Verify application exists and belongs to workspace
    const application = await jobApplicationService.getJobApplicationById(
      id,
      workspaceId
    );

    if (!application) {
      throw new Error("Application not found");
    }

    const updatedApplication = await jobApplicationService.updateJobApplication(
      id,
      {
        notes: note,
      },
      workspaceId
    );

    revalidatePath(`/applications/${id}`);

    return updatedApplication;
  } catch (error) {
    console.error(`Error adding note to application:`, error);
    throw new Error("Failed to add note");
  }
}

// Update application details
export async function updateApplication(
  id: string,
  data: Partial<Omit<JobApplication, "id" | "createdAt" | "updatedAt">>
) {
  try {
    // Get workspace ID for filtering
    const workspaceId = await getCurrentUserWorkspaceId();

    // Verify application exists and belongs to workspace
    const application = await jobApplicationService.getJobApplicationById(
      id,
      workspaceId
    );

    if (!application) {
      throw new Error("Application not found");
    }

    const updatedApplication = await jobApplicationService.updateJobApplication(
      id,
      data,
      workspaceId
    );

    revalidatePath(`/applications/${id}`);
    revalidatePath("/applications");

    return updatedApplication;
  } catch (error) {
    console.error(`Error updating application:`, error);
    throw new Error("Failed to update application");
  }
}

// Create a new application
export async function createApplication(
  data: Omit<JobApplication, "id" | "createdAt" | "updatedAt" | "activities">
) {
  try {
    // Get workspace ID for the new application
    const workspaceId = await getCurrentUserWorkspaceId();

    // Create application with workspace relationship
    // (omit workspaceId if the schema doesn't have it yet)
    const applicationData = {
      ...data,
    } as Omit<JobApplication, "id" | "createdAt" | "updatedAt">;

    // Add workspaceId if the data object accepts it
    try {
      // Type assertion to add workspaceId - this might fail if schema doesn't support it
      (applicationData as any).workspaceId = workspaceId;
    } catch (e) {
      console.warn(
        "Could not add workspaceId to application, schema may not support it yet"
      );
    }

    const application = await jobApplicationService.createJobApplication(
      applicationData
    );

    revalidatePath("/applications");

    return application;
  } catch (error) {
    console.error("Error creating application:", error);
    throw new Error("Failed to create application");
  }
}
