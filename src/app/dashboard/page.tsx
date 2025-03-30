import { EmailProviderSetup } from "@/components/email/email-provider-setup";
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

export default async function DashboardPage() {
  const session = await getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const user = session.user;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-6">
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
          </CardContent>
        </Card>

        <EmailProviderSetup />
      </div>
    </div>
  );
}
