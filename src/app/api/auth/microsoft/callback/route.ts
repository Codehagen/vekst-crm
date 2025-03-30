import { NextResponse } from "next/server";
import axios from "axios";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // This should be the user ID
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  console.log("Microsoft OAuth callback received", {
    hasCode: !!code,
    hasState: !!state,
    error: error || "none",
  });

  try {
    // Handle error
    if (error) {
      console.error("Microsoft OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        `${url.origin}/dashboard/email?error=${encodeURIComponent(
          errorDescription || error
        )}`
      );
    }

    // Validate params
    if (!code) {
      console.error("No authorization code provided");
      return NextResponse.redirect(
        `${url.origin}/dashboard/email?error=no_code`
      );
    }

    // If the state is a valid user ID, use it directly
    // Otherwise, try to get the user ID from the session
    let userId = state;

    // If state is not a valid user ID or we can't find the user,
    // try to get user from session
    if (!userId || !(await prisma.user.findUnique({ where: { id: userId } }))) {
      console.log(
        "State is not a valid user ID or user not found, trying session"
      );
      try {
        const session = await getSession({ headers: request.headers });
        if (session?.user?.id) {
          userId = session.user.id;
          console.log("Found user ID from session:", userId);
        } else {
          console.error("No user ID in session");
          return NextResponse.redirect(
            `${url.origin}/dashboard/email?error=not_authenticated`
          );
        }
      } catch (sessionError) {
        console.error("Error getting session:", sessionError);
        return NextResponse.redirect(
          `${url.origin}/dashboard/email?error=session_error`
        );
      }
    }

    // Exchange code for tokens
    console.log("Exchanging code for tokens...");
    try {
      // We need to use application/x-www-form-urlencoded for the token request
      const params = new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID as string,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET as string,
        code,
        grant_type: "authorization_code",
        redirect_uri: url.origin + "/api/auth/microsoft/callback",
        scope: [
          "openid",
          "email",
          "profile",
          "offline_access",
          "https://graph.microsoft.com/Mail.Read",
          "https://graph.microsoft.com/Mail.ReadWrite",
          "https://graph.microsoft.com/Mail.Send",
          "https://graph.microsoft.com/User.Read",
        ].join(" "),
      });

      const tokenResponse = await axios.post(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const tokens = tokenResponse.data;
      console.log("Microsoft OAuth tokens received:", {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in,
      });

      if (!tokens.access_token) {
        console.error("No access token received from Microsoft");
        return NextResponse.redirect(
          `${url.origin}/dashboard/email?error=no_access_token`
        );
      }

      // Get user email from Microsoft Graph API
      console.log("Fetching user info from Microsoft Graph API...");
      const userInfoResponse = await axios.get(
        "https://graph.microsoft.com/v1.0/me",
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }
      );

      const userInfo = userInfoResponse.data;
      const email = userInfo.mail || userInfo.userPrincipalName;

      if (!email) {
        console.error("No email found in Microsoft user info");
        return NextResponse.redirect(
          `${url.origin}/dashboard/email?error=no_email`
        );
      }

      console.log(`Successfully retrieved email: ${email}`);

      // Calculate token expiration
      const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null;

      // Update the user's EmailProvider record
      console.log("Updating EmailProvider record...");
      await prisma.emailProvider.upsert({
        where: {
          userId,
        },
        update: {
          provider: "microsoft",
          email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null, // Important: Keep existing refresh token if not provided
          expiresAt,
        },
        create: {
          userId,
          provider: "microsoft",
          email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          expiresAt,
        },
      });

      console.log("EmailProvider record updated successfully");

      // Update the Better Auth account if it exists
      console.log("Checking for existing account record...");
      const account = await prisma.account.findFirst({
        where: {
          userId,
          providerId: "microsoft",
        },
      });

      if (account) {
        console.log("Updating existing account record...");
        await prisma.account.update({
          where: { id: account.id },
          data: {
            accessToken: tokens.access_token,
            // Only update refresh token if we got a new one
            ...(tokens.refresh_token
              ? { refreshToken: tokens.refresh_token }
              : {}),
            accessTokenExpiresAt: expiresAt,
          },
        });
        console.log("Account record updated successfully");
      } else {
        console.log("No existing account record found");
      }

      // Redirect back to the dashboard with success
      console.log("OAuth flow completed successfully, redirecting...");
      return NextResponse.redirect(
        `${
          url.origin
        }/dashboard/email?success=true&provider=microsoft&email=${encodeURIComponent(
          email
        )}`
      );
    } catch (tokenError) {
      console.error("Error exchanging code for tokens:", tokenError);
      return NextResponse.redirect(
        `${url.origin}/dashboard/email?error=${encodeURIComponent(
          "Failed to exchange code for tokens"
        )}`
      );
    }
  } catch (error) {
    console.error("Error handling Microsoft OAuth callback:", error);
    return NextResponse.redirect(
      `${url.origin}/dashboard/email?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unknown error"
      )}`
    );
  }
}
