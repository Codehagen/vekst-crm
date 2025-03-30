import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware, APIError } from "better-auth/api";

const prisma = new PrismaClient();

interface SignInCallbackParams {
  user: {
    id: string;
    email: string;
    [key: string]: any;
  };
  account: {
    provider: string;
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
    [key: string]: any;
  };
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // Based on your schema.prisma
  }),
  secret: process.env.BETTER_AUTH_SECRET as string,
  baseURL: process.env.BETTER_AUTH_URL as string,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Add scopes for email sending permission from email-provider-integration.md
      scopes: ["openid", "email", "profile", "https://mail.google.com/"],
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      // Add scopes for email sending permission from email-provider-integration.md
      scopes: [
        "openid",
        "email",
        "profile",
        "https://outlook.office.com/Mail.Send",
      ],
    },
  },
  plugins: [nextCookies()],
  callbacks: {
    async signIn({ user, account }: SignInCallbackParams) {
      if (account && user) {
        // Store tokens in EmailProvider table for email sending
        // This is from the email provider integration guide
        await prisma.emailProvider.upsert({
          where: {
            userId: user.id,
          },
          update: {
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
          },
          create: {
            userId: user.id,
            provider: account.provider,
            email: user.email!,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
          },
        });
      }
      return true;
    },
  },
  // Add hooks for tracking sign-ins and enforcing security policies
  hooks: {
    // Before hook to check for suspicious activity
    before: createAuthMiddleware(async (ctx) => {
      // Track login attempts for rate limiting
      if (ctx.path === "/sign-in/email") {
        // Safely get the forwarded IP
        const ipAddress = ctx.headers?.get("x-forwarded-for") || "unknown";

        // Could implement IP-based rate limiting here
        // For example, checking a database for too many failed attempts
      }
    }),
    // After hook to track successful auth events
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/sign-in") || ctx.path.startsWith("/sign-up")) {
        const newSession = ctx.context.newSession;
        if (newSession) {
          // Log successful authentication event
          console.info(
            `User ${newSession.user.id} authenticated via ${ctx.path}`
          );

          // Here you could also track this in your analytics system
          // or trigger welcome emails for new users, etc.
        }
      }
    }),
  },
});

export const getSession = auth.api.getSession;
