import { createAuthClient } from "better-auth/react";

// Initialize the auth client for React
export const authClient = createAuthClient();

// Export specific methods for easier usage
export const { signIn, signUp, signOut, useSession } = authClient;
