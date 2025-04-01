import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function SettingsHeader() {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to dashboard</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>
    </div>
  )
}

