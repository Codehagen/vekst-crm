import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  // Try to get cookie directly first
  const directCookie = request.cookies.get("better-auth.session_token");

  // Fall back to using getSessionCookie if direct method fails
  const sessionCookie =
    directCookie?.value ||
    getSessionCookie(request, {
      cookieName: "session_token",
      cookiePrefix: "better-auth",
    });

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    // Add other protected routes
  ],
};
