import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Check for session cookie in both production and development formats
  const devCookie = request.cookies.get("better-auth.session_token");
  const prodCookie = request.cookies.get("__Secure-better-auth.session_token");

  const sessionCookie = prodCookie || devCookie;

  console.log("Dev cookie found:", !!devCookie);
  console.log("Production cookie found:", !!prodCookie);
  console.log("Session cookie found:", !!sessionCookie);

  if (!sessionCookie || !sessionCookie.value) {
    console.log("No session cookie found, redirecting to auth/login");
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/settings"], // Apply middleware to specific routes
};
