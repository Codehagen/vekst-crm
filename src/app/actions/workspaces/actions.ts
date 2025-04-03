"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Workspace, WorkspaceRole, Prisma, User } from "@prisma/client";
import { headers } from "next/headers";

/**
 * Create a new workspace
 */
export async function createWorkspace(data: {
  name: string;
  orgNumber?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
  logo?: string;
  plan?: string;
}) {
  try {
    const session = await getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        ...data,
        users: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });

    // Update the user to be an admin of this workspace
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        workspaceId: workspace.id,
        workspaceRole: "admin",
      },
    });

    revalidatePath("/dashboard");
    return { success: true, workspace };
  } catch (error) {
    console.error("Error creating workspace:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create workspace",
    };
  }
}

/**
 * Get the current user's workspace
 */
export async function getCurrentWorkspace() {
  try {
    const session = await getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workspace: true },
    });

    if (!user?.workspaceId || !user.workspace) {
      return { success: false, error: "No workspace found for user" };
    }

    return { success: true, workspace: user.workspace };
  } catch (error) {
    console.error("Error getting current workspace:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get workspace",
    };
  }
}

/**
 * Get all users in the current workspace
 */
export async function getWorkspaceUsers() {
  try {
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
      return { success: false, error: "No workspace found for user" };
    }

    const users = await prisma.user.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { name: "asc" },
    });

    return { success: true, users };
  } catch (error) {
    console.error("Error getting workspace users:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get workspace users",
    };
  }
}

/**
 * Update workspace details
 */
export async function updateWorkspace(
  id: string,
  data: Prisma.WorkspaceUpdateInput
) {
  try {
    const session = await getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Check if user has admin permissions for this workspace
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { workspaceId: true, workspaceRole: true },
    });

    if (user?.workspaceId !== id || user.workspaceRole !== "admin") {
      throw new Error("You don't have permission to update this workspace");
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data,
    });

    revalidatePath("/dashboard/settings");
    return { success: true, workspace };
  } catch (error) {
    console.error("Error updating workspace:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update workspace",
    };
  }
}

/**
 * Invite a user to the workspace
 */
export async function inviteUserToWorkspace(
  email: string,
  role: WorkspaceRole = "member"
) {
  try {
    const session = await getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Get current user's workspace
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { workspaceId: true, workspaceRole: true, workspace: true },
    });

    if (!currentUser?.workspaceId || !currentUser.workspace) {
      throw new Error("No workspace found for current user");
    }

    // Check permissions (only admins and managers can invite)
    if (
      currentUser.workspaceRole !== "admin" &&
      currentUser.workspaceRole !== "manager"
    ) {
      throw new Error("You don't have permission to invite users");
    }

    // Check user count against plan limits
    const userCount = await prisma.user.count({
      where: { workspaceId: currentUser.workspaceId },
    });

    if (userCount >= currentUser.workspace.maxUsers) {
      throw new Error(
        `Your plan is limited to ${currentUser.workspace.maxUsers} users. Please upgrade your plan.`
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, workspaceId: true },
    });

    if (existingUser) {
      if (existingUser.workspaceId === currentUser.workspaceId) {
        throw new Error("User is already in this workspace");
      }

      // Update existing user with new workspace
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          workspaceId: currentUser.workspaceId,
          workspaceRole: role,
        },
      });

      // You might want to send a notification to the user here
      return { success: true, message: "User added to workspace" };
    }

    // Create invitation (in a real app, you'd send an email)
    // For now, we'll just log it
    console.log(
      `Invitation sent to ${email} for workspace ${currentUser.workspaceId}`
    );

    // In a real implementation, you'd create an invitation record and send an email
    // await sendInvitationEmail(email, currentUser.workspaceId, role);

    return {
      success: true,
      message: `Invitation sent to ${email}`,
    };
  } catch (error) {
    console.error("Error inviting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to invite user",
    };
  }
}

/**
 * Remove a user from the workspace
 */
export async function removeUserFromWorkspace(userId: string) {
  try {
    const session = await getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Get current user's workspace and role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { workspaceId: true, workspaceRole: true },
    });

    if (!currentUser?.workspaceId) {
      throw new Error("No workspace found for current user");
    }

    // Check permissions (only admins can remove users)
    if (currentUser.workspaceRole !== "admin") {
      throw new Error("You don't have permission to remove users");
    }

    // Check that target user exists and is in same workspace
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { workspaceId: true, workspaceRole: true },
    });

    if (!targetUser || targetUser.workspaceId !== currentUser.workspaceId) {
      throw new Error("User not found in workspace");
    }

    // Don't allow removing the last admin
    if (targetUser.workspaceRole === "admin") {
      const adminCount = await prisma.user.count({
        where: {
          workspaceId: currentUser.workspaceId,
          workspaceRole: "admin",
        },
      });

      if (adminCount <= 1) {
        throw new Error("Cannot remove the last admin from the workspace");
      }
    }

    // Update user to remove workspace association
    await prisma.user.update({
      where: { id: userId },
      data: {
        workspaceId: null,
        workspaceRole: "member", // Reset role
      },
    });

    revalidatePath("/dashboard/settings/team");
    return { success: true, message: "User removed from workspace" };
  } catch (error) {
    console.error("Error removing user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove user",
    };
  }
}

/**
 * Change a user's role in the workspace
 */
export async function updateUserWorkspaceRole(
  userId: string,
  role: WorkspaceRole
) {
  try {
    const session = await getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Get current user's workspace and role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { workspaceId: true, workspaceRole: true },
    });

    if (!currentUser?.workspaceId) {
      throw new Error("No workspace found for current user");
    }

    // Check permissions (only admins can change roles)
    if (currentUser.workspaceRole !== "admin") {
      throw new Error("You don't have permission to change user roles");
    }

    // Check that target user exists and is in same workspace
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { workspaceId: true, workspaceRole: true },
    });

    if (!targetUser || targetUser.workspaceId !== currentUser.workspaceId) {
      throw new Error("User not found in workspace");
    }

    // Don't allow removing the last admin if changing an admin to non-admin
    if (targetUser.workspaceRole === "admin" && role !== "admin") {
      const adminCount = await prisma.user.count({
        where: {
          workspaceId: currentUser.workspaceId,
          workspaceRole: "admin",
        },
      });

      if (adminCount <= 1) {
        throw new Error("Cannot change the role of the last admin");
      }
    }

    // Update user's role
    await prisma.user.update({
      where: { id: userId },
      data: {
        workspaceRole: role,
      },
    });

    revalidatePath("/dashboard/settings/team");
    return { success: true, message: `User role updated to ${role}` };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update user role",
    };
  }
}

/**
 * Switch a user to a different workspace
 */
export async function switchUserWorkspace(workspaceId: string) {
  try {
    const session = await getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Verify the workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Update user's workspace
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        workspaceId,
        // Default to member role when switching to a new workspace
        workspaceRole: "member",
      },
    });

    // Revalidate all pages since workspace context affects all data
    revalidatePath("/");

    return { success: true, workspace };
  } catch (error) {
    console.error("Error switching workspace:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to switch workspace",
    };
  }
}

/**
 * Get all available workspaces
 */
export async function getAllWorkspaces() {
  try {
    const session = await getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // For an actual production system, you might want to limit this to
    // workspaces the user has access to, but for testing we'll fetch all
    const workspaces = await prisma.workspace.findMany({
      orderBy: { name: "asc" },
    });

    return { success: true, workspaces };
  } catch (error) {
    console.error("Error getting all workspaces:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get workspaces",
    };
  }
}
