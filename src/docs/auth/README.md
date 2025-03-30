# Authentication System

This document provides a comprehensive guide to the authentication system implemented in our application using Better Auth.

## Overview

Our authentication system is built around [Better Auth](https://better-auth.io), which provides a flexible and secure framework for handling user authentication. This includes:

- Email and password authentication
- Social login (Google, Microsoft)
- Session management
- Protected routes via middleware

## Folder Structure

```
src/
├── lib/
│   ├── auth-utils.ts     # Server-side utilities
│   ├── auth-actions.ts   # Authenticated server actions
│   ├── auth.ts           # Main auth configuration
│   └── auth-client.ts    # Client-side auth utilities
│
├── hooks/
│   └── auth/
│       ├── index.ts      # Re-exports hooks
│       └── use-auth.ts   # Main auth hook for client components
│
├── components/
│   └── auth/
│       ├── index.ts         # Re-exports components
│       ├── user-profile.tsx # User profile display
│       ├── login-form.tsx   # Reusable login form
│       └── auth-guard.tsx   # Client-side route protection
│
└── docs/
    └── auth/
        └── README.md     # This documentation
```

## Server-Side Authentication

### Getting the User Session

To get the current user's session in server components or API routes:

```tsx
import { getServerSession } from "@/lib/auth-utils";

export default async function ServerComponent() {
  const session = await getServerSession();
  
  if (session) {
    // User is authenticated
    const { user } = session;
    return <div>Welcome {user.name}!</div>;
  }
  
  // Handle unauthenticated state
  return <div>Please log in</div>;
}
```

### Redirecting Unauthenticated Users

To protect server components by redirecting unauthenticated users:

```tsx
import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect("/auth/login");
  }
  
  // Proceed with authenticated content
  return <div>Protected content</div>;
}
```

### Authenticated Server Actions

To create server actions that require authentication:

```tsx
import { createAuthenticatedAction } from "@/lib/auth-actions";

export const updateUserProfile = createAuthenticatedAction(
  async (data: { name: string; bio: string }, userId: string) => {
    // This only runs if the user is authenticated
    // userId contains the authenticated user's ID
    
    // Perform database operations
    const updatedUser = await db.user.update({
      where: { id: userId },
      data,
    });
    
    return updatedUser;
  }
);

// Usage in components
const result = await updateUserProfile({ 
  name: "New Name", 
  bio: "My updated bio" 
});
```

## Client-Side Authentication

### The useAuth Hook

The `useAuth` hook provides access to authentication state in client components:

```tsx
"use client";

import { useAuth } from "@/hooks/auth";

export function ProfileButton() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <button>Sign In</button>;
  }
  
  return <div>Welcome, {user?.name}</div>;
}
```

### Authentication Operations

Authentication operations for client components:

```tsx
import { signIn, signUp, signOut } from "@/lib/auth-client";

// Sign in with email/password
await signIn.email({
  email: "user@example.com",
  password: "yourpassword",
  callbackURL: "/dashboard",
});

// Sign in with social provider
await signIn.social({
  provider: "google",
  callbackURL: "/dashboard",
});

// Sign up with email/password
await signUp.email({
  email: "user@example.com",
  password: "yourpassword",
  name: "John Doe",
  callbackURL: "/dashboard",
});

// Sign out
await signOut({
  fetchOptions: {
    onSuccess: () => {
      // Handle successful sign out
    }
  }
});
```

### Protecting Client Routes

Use the `AuthGuard` component to protect client-side routes:

```tsx
"use client";

import { AuthGuard } from "@/components/auth";

export default function ClientProtectedPage() {
  return (
    <AuthGuard fallback={<div>Loading auth state...</div>}>
      <div>This content is only visible to authenticated users</div>
    </AuthGuard>
  );
}
```

### Requiring Authentication

To redirect users if not authenticated:

```tsx
"use client";

import { useAuth } from "@/hooks/auth";
import { useEffect } from "react";

export function ProtectedComponent() {
  const { requireAuth } = useAuth();
  
  useEffect(() => {
    requireAuth(() => {
      // Optional callback that runs if authenticated
      console.log("User is authenticated!");
    });
  }, [requireAuth]);
  
  return <div>Protected content</div>;
}
```

## Reusable Components

### User Profile Component

Display user information with the `UserProfile` component:

```tsx
import { UserProfile } from "@/components/auth";

export default function ProfilePage() {
  return (
    <div>
      <h1>Your Profile</h1>
      <UserProfile />
    </div>
  );
}
```

### Login Form Component

Use the pre-built `LoginForm` component for login pages:

```tsx
import { LoginForm } from "@/components/auth";

export default function LoginPage() {
  return (
    <div>
      <h1>Sign In</h1>
      <LoginForm 
        redirectUrl="/dashboard" 
        onSuccess={() => console.log("Logged in!")} 
      />
    </div>
  );
}
```

## Middleware for Route Protection

The application uses middleware to automatically protect routes:

```tsx
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request, {
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
```

## Extending the System

### Adding New Auth Providers

To add a new social provider, update the auth configuration:

```tsx
// src/lib/auth.ts
export const auth = betterAuth({
  // ... existing config
  socialProviders: {
    // Existing providers
    google: { /* ... */ },
    
    // Add new provider
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      scopes: ["user:email"],
    },
  },
});
```

### Custom Auth Hooks

Create custom hooks by building on top of the `useAuth` hook:

```tsx
"use client";

import { useAuth } from "@/hooks/auth";
import { useRouter } from "next/navigation";

export function useAuthWithRedirect(redirectUrl: string = "/auth/login") {
  const auth = useAuth();
  const router = useRouter();
  
  const redirectToLogin = useCallback(() => {
    router.push(redirectUrl);
  }, [router, redirectUrl]);
  
  return {
    ...auth,
    redirectToLogin,
  };
}
```

## Security Considerations

- All sensitive auth operations use HTTPS
- Password hashing uses secure algorithms (scrypt)
- Session cookies use HttpOnly, Secure flags
- CSRF protection is implemented
- Rate limiting on auth endpoints prevents brute force

## Troubleshooting

### Session Not Available

If the session isn't available when expected:

1. Check that the route is protected by middleware
2. Ensure `getServerSession()` is called correctly
3. Verify cookies are being passed properly

### Auth Hook Not Working

If the auth hook isn't working:

1. Ensure the component is marked with `"use client"`
2. Check that the auth client is properly initialized
3. Verify the component is wrapped in the correct providers

## Further Reading

- [Better Auth Documentation](https://better-auth.io)
- [Next.js Authentication Guide](https://nextjs.org/docs/authentication)
- [React Hooks Documentation](https://react.dev/reference/react/hooks) 