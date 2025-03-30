import { headers } from "next/headers";
import { auth } from "./config";

/**
 * Get the authenticated session from the server with proper headers handling
 * Use this in server components and API routes to get the current user session
 */
export async function getServerSession() {
  // In Next.js App Router, we need to pass headers() directly
  // Better Auth's nextCookies plugin will handle this correctly
  return auth.api.getSession({
    headers: await headers(),
  });
}
