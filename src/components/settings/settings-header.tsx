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
              <span className="sr-only">Tilbake til dashboard</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Innstillinger</h1>
        </div>
        <p className="text-muted-foreground">Administrer kontoinnstillingene og preferansene dine.</p>
      </div>
    </div>
  )
}

