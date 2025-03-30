"use client";

import { useSession } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Enhanced auth hook for client components
 * Provides access to the session, user data, loading state, and helper methods
 */
export function useAuth() {
  const { data: session, isPending, error, refetch } = useSession();
  const router = useRouter();

  const isAuthenticated = !!session?.user;

  /**
   * Function to require authentication for a component
   * Will redirect to login if not authenticated
   */
  const requireAuth = useCallback(
    (callback?: () => void) => {
      if (!isAuthenticated && !isPending) {
        router.push("/auth/login");
      } else if (isAuthenticated && callback) {
        callback();
      }
    },
    [isAuthenticated, isPending, router]
  );

  return {
    session,
    user: session?.user,
    isLoading: isPending,
    error,
    isAuthenticated,
    requireAuth,
    refetch,
  };
}
