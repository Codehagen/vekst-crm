"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/lib/auth-client";

export function UserProfile() {
  const { user, isLoading, isAuthenticated, requireAuth } = useAuth();
  const router = useRouter();

  // This will redirect to login if not authenticated
  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading profile...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/login");
        },
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Name</p>
          <p>{user?.name}</p>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Email</p>
          <p>{user?.email}</p>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Email Verification</p>
          {user?.emailVerified ? (
            <p className="text-green-600">Verified</p>
          ) : (
            <p className="text-amber-600">Not verified</p>
          )}
        </div>

        <Button onClick={handleLogout} variant="outline">
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}
