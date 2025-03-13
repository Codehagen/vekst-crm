"use server";

import { revalidatePath } from "next/cache";
import { JobApplication, JobApplicationStatus, Activity } from "@prisma/client";
import { jobApplicationService } from "@/lib/services";
import { prisma } from "@/lib/db";

// Get all applications with optional filtering
export async function getApplications(status?: JobApplicationStatus) {
  try {
    let applications;

    if (status) {
      applications = await jobApplicationService.getJobApplicationsByStatus(
        status
      );
    } else {
      applications = await jobApplicationService.getJobApplications();
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
    const application = await jobApplicationService.getJobApplicationById(id);

    if (!application) {
      throw new Error("Application not found");
    }

    // Get activities for this application
    const activities = await prisma.activity.findMany({
      where: { jobApplicationId: id },
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
    const updatedApplication =
      await jobApplicationService.updateJobApplicationStatus(id, status);

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
    const applications = await jobApplicationService.searchJobApplications(
      searchTerm
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
    const updatedApplication = await jobApplicationService.updateJobApplication(
      id,
      {
        notes: note,
      }
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
    const updatedApplication = await jobApplicationService.updateJobApplication(
      id,
      data
    );

    revalidatePath(`/applications/${id}`);
    revalidatePath("/applications");

    return updatedApplication;
  } catch (error) {
    console.error(`Error updating application:`, error);
    throw new Error("Failed to update application");
  }
}
