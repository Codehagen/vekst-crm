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

    // Try to refresh the token if we have a refresh token
    if (
      account.refreshToken &&
      account.accessTokenExpiresAt &&
      account.accessTokenExpiresAt < new Date()
    ) {
      console.log("Access token expired, attempting to refresh...");
      try {
        const refreshResponse = await axios.post(
          "https://oauth2.googleapis.com/token",
          {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: account.refreshToken,
            grant_type: "refresh_token",
          }
        );

        if (refreshResponse.data.access_token) {
          console.log("Token refreshed successfully");

          // Update the account with the new token
          await prisma.account.update({
            where: { id: account.id },
            data: {
              accessToken: refreshResponse.data.access_token,
              accessTokenExpiresAt: refreshResponse.data.expires_in
                ? new Date(Date.now() + refreshResponse.data.expires_in * 1000)
                : null,
            },
          });

          // Use the new token
          account.accessToken = refreshResponse.data.access_token;
        }
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        // Continue with the old token as a fallback
      }
    }

    // Fetch the token info from Google
    try {
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
        accessToken: account.accessToken || "",
        refreshToken: account.refreshToken || undefined,
        expiresAt: account.accessTokenExpiresAt
          ? Math.floor(account.accessTokenExpiresAt.getTime() / 1000)
          : undefined,
        email,
      });

      return { success: true, email };
    } catch (error) {
      console.error("Error fetching user info:", error);
      return {
        success: false,
        error:
          "Invalid access token. Please disconnect and reconnect your Google account.",
      };
    }
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

    // Try to refresh the token if we have a refresh token and it's expired
    if (
      account.refreshToken &&
      account.accessTokenExpiresAt &&
      account.accessTokenExpiresAt < new Date()
    ) {
      console.log("Microsoft access token expired, attempting to refresh...");
      try {
        const params = new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID as string,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET as string,
          refresh_token: account.refreshToken,
          grant_type: "refresh_token",
          scope:
            "openid email profile https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read",
        });

        const refreshResponse = await axios.post(
          "https://login.microsoftonline.com/common/oauth2/v2.0/token",
          params.toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        if (refreshResponse.data.access_token) {
          console.log("Microsoft token refreshed successfully");

          // Update the account with the new token
          await prisma.account.update({
            where: { id: account.id },
            data: {
              accessToken: refreshResponse.data.access_token,
              refreshToken:
                refreshResponse.data.refresh_token || account.refreshToken,
              accessTokenExpiresAt: refreshResponse.data.expires_in
                ? new Date(Date.now() + refreshResponse.data.expires_in * 1000)
                : null,
            },
          });

          // Use the new token
          account.accessToken = refreshResponse.data.access_token;
        }
      } catch (refreshError) {
        console.error("Failed to refresh Microsoft token:", refreshError);
        // Continue with the old token as a fallback
      }
    }

    // Fetch the token info from Microsoft Graph API
    try {
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
        accessToken: account.accessToken || "",
        refreshToken: account.refreshToken || undefined,
        expiresAt: account.accessTokenExpiresAt
          ? Math.floor(account.accessTokenExpiresAt.getTime() / 1000)
          : undefined,
        email,
      });

      return { success: true, email };
    } catch (error) {
      console.error("Error fetching Microsoft user info:", error);
      return {
        success: false,
        error:
          "Invalid access token. Please disconnect and reconnect your Microsoft account.",
      };
    }
  } catch (error) {
    console.error("Error fetching Microsoft token info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Initiate a direct Google OAuth flow with offline access
 * This creates a URL that the user can visit to authorize the app
 */
export async function initiateGoogleOAuthWithOfflineAccess() {
  try {
    const session = await getSession({
      headers: await headers(),
    });

    if (!session || !session.user?.id) {
      return { success: false, error: "No session found" };
    }

    // Define the redirect URI for our callback
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
      : "http://localhost:3000/api/auth/google/callback";

    // Create OAuth URL with offline access and force consent
    const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      redirect_uri: redirectUri,
      response_type: "code",
      access_type: "offline",
      prompt: "consent", // Force consent screen to get refresh token
      scope: [
        "email",
        "profile",
        "openid",
        "https://www.googleapis.com/auth/gmail.modify",
      ].join(" "),
      state: session.user.id, // Pass user ID in state
    });

    const authUrl = `${baseUrl}?${params.toString()}`;

    console.log(`Google OAuth URL generated with redirect URI: ${redirectUri}`);

    return {
      success: true,
      authUrl,
      redirectUri,
      message: "Use this URL to authorize with Google and get a refresh token",
    };
  } catch (error) {
    console.error("Error creating Google OAuth URL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Initiate a direct Microsoft OAuth flow with offline access
 * This creates a URL that the user can visit to authorize the app
 */
export async function initiateMicrosoftOAuthWithOfflineAccess() {
  try {
    const session = await getSession({
      headers: await headers(),
    });

    if (!session || !session.user?.id) {
      return { success: false, error: "No session found" };
    }

    // Define the redirect URI for our callback
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`
      : "http://localhost:3000/api/auth/microsoft/callback";

    // Create OAuth URL with offline access and force consent
    const baseUrl =
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID as string,
      redirect_uri: redirectUri,
      response_type: "code",
      response_mode: "query",
      prompt: "consent", // Force consent screen to get refresh token
      scope: [
        "openid",
        "email",
        "profile",
        "offline_access", // Required for refresh tokens
        "https://graph.microsoft.com/Mail.Read",
        "https://graph.microsoft.com/Mail.ReadWrite",
        "https://graph.microsoft.com/Mail.Send",
        "https://graph.microsoft.com/User.Read",
      ].join(" "),
      state: session.user.id, // Pass user ID in state
    });

    const authUrl = `${baseUrl}?${params.toString()}`;

    console.log(
      `Microsoft OAuth URL generated with redirect URI: ${redirectUri}`
    );

    return {
      success: true,
      authUrl,
      redirectUri,
      message:
        "Use this URL to authorize with Microsoft and get a refresh token",
    };
  } catch (error) {
    console.error("Error creating Microsoft OAuth URL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
