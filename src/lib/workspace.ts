import { getSession } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * Utility function to get the current user's workspace ID
 * Used across server actions to enforce workspace boundaries
 */
export async function getCurrentUserWorkspaceId(): Promise<string> {
  const session = await getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { workspaceId: true },
  });

  if (!user?.workspaceId) {
    throw new Error("No workspace found for user");
  }

  return user.workspaceId;
}
