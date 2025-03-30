"use server";

import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import axios from "axios";

interface SaveProviderData {
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  email: string;
}

/**
 * Server action to directly save email provider data
 * Used as a fallback when the SignIn callback doesn't work
 */
export async function saveEmailProvider(data: SaveProviderData) {
  try {
    const session = await getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Not authenticated");
    }

    console.log(`Manually saving email provider for user: ${session.user.id}`);
    console.log(`Provider: ${data.provider}, Email: ${data.email}`);

    // Upsert the email provider
    await prisma.emailProvider.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        provider: data.provider,
        email: data.email,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt ? new Date(data.expiresAt * 1000) : null,
      },
      create: {
        userId: session.user.id,
        provider: data.provider,
        email: data.email,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt ? new Date(data.expiresAt * 1000) : null,
      },
    });

    console.log("Email provider saved successfully");
    return { success: true };
  } catch (error) {
    console.error("Error saving email provider:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Delete email provider for current user
 * Used to disconnect from the email service
 */
export async function disconnectEmailProvider() {
  try {
    const session = await getSession({
      headers: await headers(),
    });

    if (!session || !session.user?.id) {
      return { success: false, error: "No session found" };
    }

    // Delete the email provider
    await prisma.emailProvider.delete({
      where: {
        userId: session.user.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error disconnecting email provider:", error);

    // If record not found, consider it successful anyway
    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return { success: true };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Directly fetch the current user's Google token information
 * Used to retrieve token data after OAuth flow
 */
export async function fetchGoogleTokenInfo() {
  try {
    const session = await getSession({
      headers: await headers(),
    });

    if (!session || !session.user?.id) {
      return { success: false, error: "No session found" };
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "google",
      },
    });

    if (!account) {
      return { success: false, error: "No Google account found" };
    }

    if (!account.accessToken) {
      return { success: false, error: "No access token found" };
    }

    // Fetch the token info from Google
    const tokenInfoResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${account.accessToken}`
    );

    if (tokenInfoResponse.status !== 200) {
      return {
        success: false,
        error: `Failed to fetch token info: ${tokenInfoResponse.statusText}`,
      };
    }

    const tokenInfo = tokenInfoResponse.data;
    const email = tokenInfo.email;

    if (!email) {
      return { success: false, error: "No email found in token info" };
    }

    // Save the credentials
    await saveEmailProvider({
      provider: "google",
      accessToken: account.accessToken,
      refreshToken: account.refreshToken || undefined,
      expiresAt: account.accessTokenExpiresAt
        ? Math.floor(account.accessTokenExpiresAt.getTime() / 1000)
        : undefined,
      email,
    });

    return { success: true, email };
  } catch (error) {
    console.error("Error fetching Google token info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Directly fetch the current user's Microsoft token information
 * Used to retrieve token data after OAuth flow
 */
export async function fetchMicrosoftTokenInfo() {
  try {
    const session = await getSession({
      headers: await headers(),
    });

    if (!session || !session.user?.id) {
      return { success: false, error: "No session found" };
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "microsoft",
      },
    });

    if (!account) {
      return { success: false, error: "No Microsoft account found" };
    }

    if (!account.accessToken) {
      return { success: false, error: "No access token found" };
    }

    // Fetch the token info from Microsoft Graph API
    const userInfoResponse = await axios.get(
      "https://graph.microsoft.com/v1.0/me",
      {
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
        },
      }
    );

    if (userInfoResponse.status !== 200) {
      return {
        success: false,
        error: `Failed to fetch user info: ${userInfoResponse.statusText}`,
      };
    }

    const userInfo = userInfoResponse.data;
    const email = userInfo.mail || userInfo.userPrincipalName;

    if (!email) {
      return { success: false, error: "No email found in user info" };
    }

    // Save the credentials
    await saveEmailProvider({
      provider: "microsoft",
      accessToken: account.accessToken,
      refreshToken: account.refreshToken || undefined,
      expiresAt: account.accessTokenExpiresAt
        ? Math.floor(account.accessTokenExpiresAt.getTime() / 1000)
        : undefined,
      email,
    });

    return { success: true, email };
  } catch (error) {
    console.error("Error fetching Microsoft token info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
