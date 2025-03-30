"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/auth";
import { usePathname } from "next/navigation";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Auth Guard component for protecting client routes
 * Redirects to login page if user is not authenticated
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isLoading, isAuthenticated, requireAuth } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    requireAuth();
  }, [pathname, requireAuth]);

  if (isLoading) {
    return fallback || <div>Loading authentication...</div>;
  }

  return isAuthenticated ? <>{children}</> : null;
}
