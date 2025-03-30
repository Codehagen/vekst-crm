import { EmailComposer } from "@/components/email/email-composer";
import { EmailProviderSetup } from "@/components/email/email-provider-setup";
import { getEmailProviderStatus } from "@/app/actions/email";
import { fetchGoogleTokenInfo } from "@/app/actions/auth-provider";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Suspense } from "react";

export default async function EmailPage() {
  const session = await getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const emailStatus = await getEmailProviderStatus();

  // If we're just coming back from Google auth (no email provider yet),
  // try to manually save the provider information
  if (!emailStatus.connected) {
    console.log("No email provider connected, attempting manual token fetch");
    const result = await fetchGoogleTokenInfo();
    console.log("Manual token fetch result:", result);

    // If successful, we should trigger a page refresh
    if (result.success) {
      redirect("/dashboard/email");
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Email</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {!emailStatus.connected ? (
          <EmailProviderSetup className="md:col-span-2" />
        ) : (
          <>
            <div className="md:col-span-2">
              <EmailComposer />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
