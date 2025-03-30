import { getServerSession } from "./server";

/**
 * Helper function to create authenticated server actions
 * This function ensures the user is authenticated before executing the action
 *
 * @param action Function to execute if authenticated
 * @returns A server action that checks authentication
 */
export function createAuthenticatedAction<T, R>(
  action: (data: T, userId: string) => Promise<R>
) {
  return async (data: T): Promise<R | { error: string }> => {
    try {
      // Get the auth session using our utility
      const session = await getServerSession();

      if (!session || !session.user?.id) {
        return { error: "Unauthorized: Please log in to continue" };
      }

      // Execute the action with the authenticated user ID
      return await action(data, session.user.id);
    } catch (error) {
      console.error("Authentication error:", error);
      return { error: "An error occurred while processing your request" };
    }
  };
}
