import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Check for session cookie directly
  const sessionCookie = request.cookies.get("better-auth.session_token");
  console.log("Session cookie found:", !!sessionCookie);

  if (!sessionCookie || !sessionCookie.value) {
    console.log("No session cookie found, redirecting to auth/login");
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard"], // Apply middleware to specific routes
};
