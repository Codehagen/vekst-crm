"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  Loader2,
  AlertCircle,
  Building2,
  RefreshCw,
  X,
  ArrowRight,
  Mail,
  Globe,
  Database,
  Info,
  FolderOpen,
} from "lucide-react";
import { importBusinessesFromDomains } from "@/app/actions/customer";
import { syncEmails } from "@/app/actions/email";
import { checkEmailImportAvailability } from "@/app/actions/customer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DomainImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DomainImportDialog({
  open,
  onOpenChange,
}: DomainImportDialogProps) {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<
    "import" | "preview" | "results"
  >("import");

  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailCount, setEmailCount] = useState(0);
  const [needsSync, setNeedsSync] = useState(false);
  const [checkingEmailStatus, setCheckingEmailStatus] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [availableFolders, setAvailableFolders] = useState<string[]>([
    "Inbox",
    "Sent",
    "Archive",
    "Important",
  ]);

  // Import settings
  const [skipExistingDomains, setSkipExistingDomains] = useState(true);
  const [importAsLeads, setImportAsLeads] = useState(true);
  const [transformDomains, setTransformDomains] = useState(true);
  const [skipFilters, setSkipFilters] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<string[]>(["Inbox"]);
  const [minEmailCount, setMinEmailCount] = useState(2);

  // Check email status on load
  useEffect(() => {
    if (open) {
      checkEmailStatus();
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentTab("import");
      setImportResult(null);
      setPreviewData(null);
      setError(null);
      setProgress(0);
    }
  }, [open]);

  // Check if emails are available for import
  const checkEmailStatus = async () => {
    setCheckingEmailStatus(true);
    try {
      const status = await checkEmailImportAvailability();

      if (!status.available) {
        if (status.needsEmailSetup) {
          setError("You need to connect your email account first.");
        } else if (status.needsEmailSync || status.emailCount === 0) {
          setNeedsSync(true);
          setEmailCount(0);
        }
      } else {
        setEmailCount(status.emailCount || 0);
        setNeedsSync(false);
        // In a real implementation, we would fetch available folders here
        // setAvailableFolders(status.folders || []);
      }
    } catch (error) {
      setError("Failed to check email status.");
    } finally {
      setCheckingEmailStatus(false);
    }
  };

  // Start email sync
  const handleSyncEmails = async () => {
    setIsSyncing(true);
    setError(null);
    setProgress(5);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment = Math.random() * 10;
        const newValue = prev + increment;
        return newValue < 90 ? newValue : 89;
      });
    }, 1000);

    try {
      const result = await syncEmails({
        maxEmails: 500,
        folders: selectedFolders,
      });
      if (result.success) {
        setProgress(100);
        await checkEmailStatus();
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

  // Toggle folder selection
  const toggleFolder = (folder: string) => {
    setSelectedFolders((current) => {
      if (current.includes(folder)) {
        return current.filter((f) => f !== folder);
      } else {
        return [...current, folder];
      }
    });
  };

  // Generate preview data
  const handleGeneratePreview = async () => {
    setPreviewData({
      // This would be populated with actual preview data from the server
      // For now we'll use mock data
      loading: true,
    });

    // Mock preview data - in a real implementation, this would be a server action
    setTimeout(() => {
      setPreviewData({
        loading: false,
        domains: [
          {
            domain: "acme-corp.com",
            businessName: "Acme Corp",
            emailCount: 12,
          },
          {
            domain: "tech-innovators.io",
            businessName: "Tech Innovators",
            emailCount: 8,
          },
          {
            domain: "global-shipping.net",
            businessName: "Global Shipping",
            emailCount: 5,
          },
          {
            domain: "sunrise-media.co",
            businessName: "Sunrise Media",
            emailCount: 3,
          },
        ],
        stats: {
          totalDomains: 23,
          estimatedNewBusinesses: 19,
          skippedDomains: 4,
        },
      });
      setCurrentTab("preview");
    }, 800);
  };

  // Start domain-based business import
  const handleImportBusinesses = async () => {
    setIsImporting(true);
    setImportResult(null);
    setError(null);
    setProgress(10);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment = Math.random() * 8;
        const newValue = prev + increment;
        return newValue < 95 ? newValue : 94;
      });
    }, 800);

    try {
      const result = await importBusinessesFromDomains({
        skipExistingDomains,
        importAsLeads,
        transformDomains,
        skipFilters,
        folders: selectedFolders,
        minEmailCount,
      });

      setImportResult(result);
      setProgress(100);

      if (result.success) {
        setCurrentTab("results");
        router.refresh();
      } else {
        setError(result.error || "Import failed");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unknown error during import"
      );
    } finally {
      clearInterval(progressInterval);
      setIsImporting(false);
    }
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-6 px-1">
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
            currentTab === "import"
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          <Mail className="h-5 w-5" />
        </div>
        <span className="text-xs">Connect</span>
      </div>

      <div className="h-0.5 flex-1 bg-muted mx-1" />

      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
            currentTab === "preview"
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          <Globe className="h-5 w-5" />
        </div>
        <span className="text-xs">Extract</span>
      </div>

      <div className="h-0.5 flex-1 bg-muted mx-1" />

      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
            currentTab === "results"
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          <Database className="h-5 w-5" />
        </div>
        <span className="text-xs">Import</span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Businesses from Email Domains</DialogTitle>
          <DialogDescription>
            Quickly create businesses from your email contacts' domains.
          </DialogDescription>
        </DialogHeader>

        <StepIndicator />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs
          value={currentTab}
          onValueChange={(value) =>
            setCurrentTab(value as "import" | "preview" | "results")
          }
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="preview" disabled={!previewData}>
              Preview
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!importResult?.success}>
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4 py-2">
            {checkingEmailStatus ? (
              <div className="space-y-2 py-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : needsSync || emailCount === 0 ? (
              <div className="text-center py-4">
                <RefreshCw className="h-10 w-10 mx-auto mb-4 text-primary/70" />
                <h3 className="text-lg font-medium mb-2">Sync emails first</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We need to sync your emails before we can import businesses
                  from domains.
                </p>

                <div className="mb-4 p-3 border rounded-md">
                  <Label className="mb-2 block text-sm font-medium">
                    Select email folders to sync:
                  </Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {availableFolders.map((folder) => (
                      <div key={folder} className="flex items-center space-x-2">
                        <Checkbox
                          id={`folder-${folder}`}
                          checked={selectedFolders.includes(folder)}
                          onCheckedChange={() => toggleFolder(folder)}
                        />
                        <Label
                          htmlFor={`folder-${folder}`}
                          className="font-normal"
                        >
                          {folder}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSyncEmails}
                  disabled={isSyncing || selectedFolders.length === 0}
                  className="w-full"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    "Sync Emails Now"
                  )}
                </Button>
                {isSyncing && (
                  <div className="mt-4">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      This may take a minute...
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-md flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email status</p>
                    <p className="text-sm text-muted-foreground">
                      {emailCount} emails available for analysis
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncEmails}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="space-y-4 border p-4 rounded-md">
                  <h3 className="text-sm font-medium">Import Settings</h3>

                  <div className="space-y-5">
                    <div className="space-y-3">
                      <Label htmlFor="emailFolders" className="text-sm">
                        Email folders to analyze
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                          >
                            <div className="flex items-center">
                              <FolderOpen className="mr-2 h-4 w-4" />
                              <span>
                                {selectedFolders.length === 0
                                  ? "Select folders"
                                  : selectedFolders.length === 1
                                  ? `1 folder selected`
                                  : `${selectedFolders.length} folders selected`}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground ml-2">
                              {selectedFolders.length > 0 &&
                                selectedFolders.join(", ")}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56">
                          <div className="space-y-2">
                            {availableFolders.map((folder) => (
                              <div
                                key={folder}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`folder-select-${folder}`}
                                  checked={selectedFolders.includes(folder)}
                                  onCheckedChange={() => toggleFolder(folder)}
                                />
                                <Label
                                  htmlFor={`folder-select-${folder}`}
                                  className="font-normal"
                                >
                                  {folder}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="minEmails" className="text-sm">
                          Minimum emails from domain
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Only create businesses from domains with at
                                least this many emails
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={minEmailCount.toString()}
                          onValueChange={(value) =>
                            setMinEmailCount(parseInt(value))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select threshold" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Email count threshold</SelectLabel>
                              <SelectItem value="1">1 email</SelectItem>
                              <SelectItem value="2">2 emails</SelectItem>
                              <SelectItem value="3">3 emails</SelectItem>
                              <SelectItem value="5">5 emails</SelectItem>
                              <SelectItem value="10">10 emails</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <TooltipProvider>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="skipDomains"
                          checked={skipExistingDomains}
                          onCheckedChange={(checked) =>
                            setSkipExistingDomains(checked as boolean)
                          }
                        />
                        <Label htmlFor="skipDomains" className="font-normal">
                          Skip existing domains
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground ml-1 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              When enabled, domains already associated with
                              businesses in your CRM will be skipped to avoid
                              duplicates.
                            </p>
                          </TooltipContent>
                        </Tooltip>
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
                          Import as leads (not customers)
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground ml-1 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Mark newly created businesses as leads rather than
                              established customers. This helps with sales
                              pipeline management.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="transformDomains"
                          checked={transformDomains}
                          onCheckedChange={(checked) =>
                            setTransformDomains(checked as boolean)
                          }
                        />
                        <Label
                          htmlFor="transformDomains"
                          className="font-normal"
                        >
                          Format domains as business names
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground ml-1 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Automatically convert domains into business names.
                              For example, "acme-corp.com" becomes "Acme Corp".
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="skipFilters"
                          checked={skipFilters}
                          onCheckedChange={(checked) =>
                            setSkipFilters(checked as boolean)
                          }
                        />
                        <Label htmlFor="skipFilters" className="font-normal">
                          Skip filters
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground ml-1 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Import from personal email domains and service
                              email addresses that are normally skipped.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleGeneratePreview}
                    disabled={isImporting || previewData?.loading}
                    variant="outline"
                    className="flex-1"
                  >
                    {previewData?.loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating preview...
                      </>
                    ) : (
                      "Preview Results"
                    )}
                  </Button>

                  <Button
                    onClick={handleImportBusinesses}
                    disabled={isImporting}
                    className="flex-1"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating businesses...
                      </>
                    ) : (
                      "Start Import"
                    )}
                  </Button>
                </div>

                {isImporting && (
                  <div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Analyzing domains and creating businesses...
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="py-2">
            {previewData?.loading ? (
              <div className="space-y-2 py-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              previewData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold">
                          {previewData.stats.totalDomains}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total domains found
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold">
                          {previewData.stats.estimatedNewBusinesses}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Businesses to create
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold">
                          {previewData.stats.skippedDomains}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Domains to skip
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-muted px-4 py-2 font-medium text-sm">
                      Sample domains (showing {previewData.domains.length} of{" "}
                      {previewData.stats.totalDomains})
                    </div>
                    <div className="divide-y">
                      {previewData.domains.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="px-4 py-3 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">{item.businessName}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.domain}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.emailCount} emails
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Alert variant="default" className="bg-muted/50">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      This is a preview of the businesses that will be created.
                      Ready to proceed?
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleImportBusinesses}
                    disabled={isImporting}
                    className="w-full"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating businesses...
                      </>
                    ) : (
                      "Create Businesses"
                    )}
                  </Button>
                </div>
              )
            )}
          </TabsContent>

          <TabsContent value="results">
            {importResult?.success && importResult.stats && (
              <div className="py-2">
                <div className="flex items-center justify-center my-3">
                  <div className="bg-primary/10 rounded-full p-3">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-muted rounded-md p-3 text-center">
                    <p className="text-2xl font-bold">
                      {importResult.stats.createdBusinesses}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Businesses created
                    </p>
                  </div>

                  <div className="bg-muted rounded-md p-3 text-center">
                    <p className="text-2xl font-bold">
                      {importResult.stats.createdContacts || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Contacts created
                    </p>
                  </div>

                  <div className="bg-muted rounded-md p-3 text-center">
                    <p className="text-2xl font-bold">
                      {importResult.stats.skippedDomains}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Domains skipped
                    </p>
                  </div>
                </div>

                {importResult.stats.associatedEmails > 0 && (
                  <Alert variant="default" className="mb-3">
                    <Check className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>
                      Associated {importResult.stats.associatedEmails} emails
                      with new businesses.
                    </AlertDescription>
                  </Alert>
                )}

                {importResult.stats.errors.length > 0 && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Some errors occurred</AlertTitle>
                    <AlertDescription>
                      {importResult.stats.errors.length} errors while creating
                      businesses.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {currentTab === "results" ? "Close" : "Cancel"}
          </Button>

          {currentTab === "results" && (
            <Button onClick={() => router.push("/businesses")}>
              View Businesses
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
