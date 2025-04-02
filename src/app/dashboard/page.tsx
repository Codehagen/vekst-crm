import { EmailProviderSetup } from "@/components/email/email-provider-setup";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const session = await getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const user = session.user;

  // Get user's workspace information
  const userWithWorkspace = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      workspaceId: true,
      workspace: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome {user.name}</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Email:</span> {user.email}
            </div>
            {user.emailVerified ? (
              <div className="text-green-600">Email verified</div>
            ) : (
              <div className="text-amber-600">Email not verified</div>
            )}
            {userWithWorkspace?.workspace && (
              <div>
                <span className="font-medium">Current Workspace:</span>{" "}
                {userWithWorkspace.workspace.name}
              </div>
            )}
          </CardContent>
        </Card>

        <EmailProviderSetup />

        {/* Add the Workspace Switcher */}
        <WorkspaceSwitcher
          currentWorkspaceId={userWithWorkspace?.workspaceId || undefined}
        />
      </div>
    </div>
  );
}
