"use server";

import { auth } from "@/lib/auth/config";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

// Schema for profile update
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  image: z.string().url().optional().nullable(),
});

// Schema for password change
const passwordSchema = z.object({
  currentPassword: z.string().min(8, "Password must be at least 8 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  revokeOtherSessions: z.boolean().default(false),
});

// Schema for email change
const emailSchema = z.object({
  newEmail: z.string().email("Please provide a valid email address"),
  callbackURL: z.string().default("/settings"),
});

// Schema for 2FA settings
const securitySettingsSchema = z.object({
  twoFactorAuth: z.boolean(),
  sessionTimeout: z.boolean(),
});

/**
 * Update user profile information
 */
export async function updateUserProfile(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Not authenticated" };
    }

    const name = formData.get("name") as string;
    const image = formData.get("image") as string;

    // Validate the data
    const validatedData = profileSchema.parse({ name, image });

    // Update the user
    await auth.api.updateUser({
      body: {
        name: validatedData.name,
        image: validatedData.image,
      },
      headers: await headers(),
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        fieldErrors: error.flatten().fieldErrors,
      };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

/**
 * Change user password
 */
export async function changeUserPassword(formData: FormData) {
  try {
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const revokeOtherSessions = formData.get("revokeOtherSessions") === "true";

    // Validate the data
    const validatedData = passwordSchema.parse({
      currentPassword,
      newPassword,
      revokeOtherSessions,
    });

    // Call the better-auth client's changePassword function
    const result = await auth.api.changePassword({
      body: {
        currentPassword: validatedData.currentPassword,
        newPassword: validatedData.newPassword,
        revokeOtherSessions: validatedData.revokeOtherSessions,
      },
      headers: await headers(),
    });

    if (!result.status) {
      return {
        success: false,
        error: result.message || "Failed to change password",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        fieldErrors: error.flatten().fieldErrors,
      };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to change password",
    };
  }
}

/**
 * Change user email
 */
export async function changeUserEmail(formData: FormData) {
  try {
    const newEmail = formData.get("newEmail") as string;
    const callbackURL = (formData.get("callbackURL") as string) || "/settings";

    // Validate the data
    const validatedData = emailSchema.parse({ newEmail, callbackURL });

    // Call better-auth's changeEmail API
    const result = await auth.api.changeEmail({
      body: {
        newEmail: validatedData.newEmail,
        callbackURL: validatedData.callbackURL,
      },
      headers: await headers(),
    });

    if (!result.status) {
      return {
        success: false,
        error: result.message || "Failed to change email",
      };
    }

    return {
      success: true,
      message: "Verification email sent. Please check your inbox.",
    };
  } catch (error) {
    console.error("Error changing email:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        fieldErrors: error.flatten().fieldErrors,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change email",
    };
  }
}

/**
 * Update security settings
 */
export async function updateSecuritySettings(formData: FormData) {
  try {
    const twoFactorAuth = formData.get("twoFactorAuth") === "true";
    const sessionTimeout = formData.get("sessionTimeout") === "true";

    // Validate the data
    const validatedData = securitySettingsSchema.parse({
      twoFactorAuth,
      sessionTimeout,
    });

    // Here you would handle the 2FA settings through Better Auth
    // For now, we'll just use a placeholder for the response

    // TODO: Implement 2FA settings changes via Better Auth when available

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating security settings:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        fieldErrors: error.flatten().fieldErrors,
      };
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update security settings",
    };
  }
}

/**
 * Delete user account
 */
export async function deleteUserAccount(formData: FormData) {
  try {
    const password = formData.get("password") as string;
    const confirmText = formData.get("confirmText") as string;

    // Verify that user typed the confirmation text correctly
    if (confirmText !== "DELETE") {
      return {
        success: false,
        error: "Please type DELETE to confirm account deletion",
      };
    }

    // Call better-auth's deleteUser API
    const result = await auth.api.deleteUser({
      body: { password },
      headers: await headers(),
    });

    if (!result.success) {
      return {
        success: false,
        error: result.message || "Failed to delete account",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete account",
    };
  }
}

/**
 * List user's accounts (for account linking)
 */
export async function listUserAccounts() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await auth.api.listAccounts({
      headers: await headers(),
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to list accounts",
      };
    }

    return { success: true, accounts: result.accounts };
  } catch (error) {
    console.error("Error listing accounts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list accounts",
    };
  }
}

/**
 * Unlink an account
 */
export async function unlinkUserAccount(formData: FormData) {
  try {
    const providerId = formData.get("providerId") as string;
    const accountId = (formData.get("accountId") as string) || undefined;

    if (!providerId) {
      return { success: false, error: "Provider ID is required" };
    }

    const result = await auth.api.unlinkAccount({
      body: {
        providerId,
        accountId,
      },
      headers: await headers(),
    });

    if (!result.status) {
      return {
        success: false,
        error: result.message || "Failed to unlink account",
      };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error unlinking account:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to unlink account",
    };
  }
}
