"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { importCustomersFromEmailsAction } from "@/app/actions/customer";
import { syncEmails } from "@/app/actions/email";
import {
  AlertCircle,
  Check,
  Loader2,
  Mail,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { checkEmailImportAvailability } from "@/app/actions/customer";

interface ImportEmailWizardProps {
  emailCount?: number;
  needsEmailSetup?: boolean;
  needsEmailSync?: boolean;
  onClose: () => void;
}

export function ImportEmailWizard({
  emailCount: initialEmailCount = 0,
  needsEmailSetup = false,
  needsEmailSync = false,
  onClose,
}: ImportEmailWizardProps) {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(
    needsEmailSetup ? "setup" : needsEmailSync ? "sync" : "settings"
  );

  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncAmount, setSyncAmount] = useState(500);
  const [syncProgress, setSyncProgress] = useState(0);

  // Track email count internally to update after sync
  const [emailCount, setEmailCount] = useState(initialEmailCount);

  // Import settings
  const [minEmailCount, setMinEmailCount] = useState(3);
  const [skipExistingDomains, setSkipExistingDomains] = useState(true);
  const [importAsLeads, setImportAsLeads] = useState(true);
  const [maxResults, setMaxResults] = useState(50);

  // Refresh the email count
  const refreshEmailCount = async () => {
    try {
      const status = await checkEmailImportAvailability();
      if (status.available && status.emailCount) {
        setEmailCount(status.emailCount);
      }
    } catch (error) {
      console.error("Failed to refresh email count:", error);
    }
  };

  // Handle email sync
  const handleSyncEmails = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setError(null);
    setSyncProgress(5); // Start progress

    const progressInterval = setInterval(() => {
      setSyncProgress((prev) => {
        // Randomly increment progress but stay below 90%
        const increment = Math.random() * 10;
        const newValue = prev + increment;
        return newValue < 90 ? newValue : 89;
      });
    }, 1000);

    try {
      const result = await syncEmails({ maxEmails: syncAmount });
      setSyncResult(result);
      setSyncProgress(100); // Complete progress

      if (result.success) {
        // Update the email count
        await refreshEmailCount();
        // Move to next tab after successful sync
        setCurrentTab("settings");
      } else {
        setError(result.error || "Failed to sync emails");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unknown error syncing emails"
      );
    } finally {
      clearInterval(progressInterval);
      setIsSyncing(false);
    }
  };

  // Handle customer import
  const handleImportCustomers = async () => {
    setIsImporting(true);
    setImportResult(null);
    setError(null);

    try {
      const result = await importCustomersFromEmailsAction({
        minEmailCount,
        skipExistingDomains,
        importLeadsOnly: importAsLeads,
        maxResults,
      });

      setImportResult(result);

      if (result.success) {
        // Move to results tab
        setCurrentTab("results");
        // Refresh the page data
        router.refresh();
      } else {
        setError(result.error || "Import failed");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unknown error during import"
      );
    } finally {
      setIsImporting(false);
    }
  };

  // Email setup handler
  const handleSetupEmail = () => {
    router.push("/settings/email");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Importer kunder fra e-post</CardTitle>
        <CardDescription>
          Analyserer e-posthistorikken for å opprette kundeposter
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Feil</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger
              value="setup"
              disabled={!needsEmailSetup && currentTab !== "setup"}
            >
              <Mail className="mr-2 h-4 w-4" />
              E-post oppsett
            </TabsTrigger>
            <TabsTrigger value="sync" disabled={needsEmailSetup}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Synkronisering
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              disabled={needsEmailSetup || currentTab === "results"}
            >
              <Settings className="mr-2 h-4 w-4" />
              Innstillinger
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            <div className="text-center py-6">
              <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-medium">Koble til e-postkonto</h3>
              <p className="text-muted-foreground mt-2 mb-6">
                Du må koble til en e-postkonto for å importere kunder fra
                e-posthistorikken din.
              </p>
              <Button onClick={handleSetupEmail}>
                Sett opp e-post tilkobling
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <div className="text-center py-6">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-medium">Synkroniser e-poster</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                Vi må synkronisere e-postene dine før vi kan importere
                kontakter.
                {emailCount > 0 && (
                  <span className="font-medium block mt-1">
                    Du har {emailCount} e-poster synkronisert.
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={refreshEmailCount}
                      className="ml-2 p-1 h-auto"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </span>
                )}
              </p>

              <div className="mb-6 max-w-sm mx-auto">
                <div className="flex items-center justify-between">
                  <Label htmlFor="syncAmount">
                    Antall e-poster som skal synkroniseres:
                  </Label>
                  <span className="text-sm font-medium">{syncAmount}</span>
                </div>
                <Slider
                  id="syncAmount"
                  min={100}
                  max={2000}
                  step={100}
                  value={[syncAmount]}
                  onValueChange={(values) => setSyncAmount(values[0])}
                  className="my-4"
                />
                <p className="text-xs text-muted-foreground mb-6">
                  Jo flere e-poster du synkroniserer, desto bedre potensielle
                  kunder kan vi finne. Synkronisering av mange e-poster kan ta
                  litt tid.
                </p>
              </div>

              {syncResult?.success && (
                <Alert className="mb-4">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Synkronisert</AlertTitle>
                  <AlertDescription>
                    {syncResult.message ||
                      `Synkroniserte ${syncResult.successCount} e-poster.`}
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={handleSyncEmails} disabled={isSyncing} size="lg">
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Synkroniserer...
                  </>
                ) : (
                  "Synkroniser e-poster"
                )}
              </Button>

              {isSyncing && (
                <div className="mt-4">
                  <Progress value={syncProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Dette kan ta litt tid avhengig av antall e-poster
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minEmails">
                  Minimum antall e-poster ({minEmailCount})
                </Label>
                <Slider
                  id="minEmails"
                  min={1}
                  max={10}
                  step={1}
                  value={[minEmailCount]}
                  onValueChange={(values) => setMinEmailCount(values[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Kontakter må ha minst dette antall e-poster for å bli
                  importert
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxResults">
                  Maksimalt antall kunder ({maxResults})
                </Label>
                <Slider
                  id="maxResults"
                  min={10}
                  max={200}
                  step={10}
                  value={[maxResults]}
                  onValueChange={(values) => setMaxResults(values[0])}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="skipDomains"
                  checked={skipExistingDomains}
                  onCheckedChange={(checked) =>
                    setSkipExistingDomains(checked as boolean)
                  }
                />
                <Label htmlFor="skipDomains" className="font-normal">
                  Hopp over eksisterende domener
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="importLeads"
                  checked={importAsLeads}
                  onCheckedChange={(checked) =>
                    setImportAsLeads(checked as boolean)
                  }
                />
                <Label htmlFor="importLeads" className="font-normal">
                  Importer som leads (ikke kunder)
                </Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {importResult?.success && importResult.stats && (
              <div className="py-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-primary/10 rounded-full p-3">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                </div>

                <h3 className="text-lg font-medium text-center mb-4">
                  Import fullført
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold">
                      {importResult.stats.createdBusinesses}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Kunder opprettet
                    </p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold">
                      {importResult.stats.associatedEmails}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      E-poster tilknyttet
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Analyserte {importResult.stats.totalEmails} e-poster</p>
                  <p>
                    • Behandlet {importResult.stats.processedContacts} kontakter
                  </p>
                  <p>
                    • Hoppet over {importResult.stats.skippedBusinesses}{" "}
                    potensielle kunder
                  </p>
                </div>

                {importResult.stats.errors.length > 0 && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Noen feil oppstod</AlertTitle>
                    <AlertDescription>
                      <p>
                        {importResult.stats.errors.length} feil under import
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          {currentTab === "results" ? "Lukk" : "Avbryt"}
        </Button>

        {currentTab === "settings" && (
          <Button onClick={handleImportCustomers} disabled={isImporting}>
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importerer...
              </>
            ) : (
              "Start import"
            )}
          </Button>
        )}

        {currentTab === "sync" && syncResult?.success && (
          <Button onClick={() => setCurrentTab("settings")}>Neste</Button>
        )}
      </CardFooter>
    </Card>
  );
}
