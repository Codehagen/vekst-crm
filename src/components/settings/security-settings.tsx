"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, KeyRound, Shield, Trash } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  changeUserPassword,
  changeUserEmail,
  deleteUserAccount,
  updateSecuritySettings,
} from "@/app/actions/user-settings";
import { useSession } from "@/lib/auth/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    newPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    revokeOtherSessions: z.boolean().default(false),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const emailFormSchema = z.object({
  newEmail: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

const securityFormSchema = z.object({
  twoFactorAuth: z.boolean().default(false),
  sessionTimeout: z.boolean().default(true),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
  confirmText: z.string().refine((val) => val === "DELETE", {
    message: "You must type DELETE to confirm",
  }),
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type EmailFormValues = z.infer<typeof emailFormSchema>;
type SecurityFormValues = z.infer<typeof securityFormSchema>;
type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;

export function SecuritySettings() {
  const { data: session } = useSession();
  const [isPasswordLoading, setIsPasswordLoading] = useState<boolean>(false);
  const [isEmailLoading, setIsEmailLoading] = useState<boolean>(false);
  const [isSecurityLoading, setIsSecurityLoading] = useState<boolean>(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: false,
    },
  });

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      newEmail: "",
    },
  });

  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      twoFactorAuth: false,
      sessionTimeout: true,
    },
  });

  const deleteForm = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: "",
      confirmText: "DELETE",
    },
  });

  async function onPasswordSubmit(data: PasswordFormValues) {
    setIsPasswordLoading(true);

    try {
      const formData = new FormData();
      formData.append("currentPassword", data.currentPassword);
      formData.append("newPassword", data.newPassword);
      formData.append("revokeOtherSessions", String(data.revokeOtherSessions));

      const result = await changeUserPassword(formData);

      if (result.success) {
        toast.success("Password changed successfully");
        passwordForm.reset({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          revokeOtherSessions: false,
        });
      } else {
        toast.error(result.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsPasswordLoading(false);
    }
  }

  async function onEmailSubmit(data: EmailFormValues) {
    setIsEmailLoading(true);

    try {
      const formData = new FormData();
      formData.append("newEmail", data.newEmail);
      formData.append("callbackURL", "/settings");

      const result = await changeUserEmail(formData);

      if (result.success) {
        toast.success(result.message || "Email change initiated");
        emailForm.reset();
      } else {
        toast.error(result.error || "Failed to change email");
      }
    } catch (error) {
      console.error("Error changing email:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsEmailLoading(false);
    }
  }

  async function onSecuritySubmit(data: SecurityFormValues) {
    setIsSecurityLoading(true);

    try {
      const formData = new FormData();
      formData.append("twoFactorAuth", String(data.twoFactorAuth));
      formData.append("sessionTimeout", String(data.sessionTimeout));

      const result = await updateSecuritySettings(formData);

      if (result.success) {
        toast.success("Security settings updated");
      } else {
        toast.error(result.error || "Failed to update security settings");
      }
    } catch (error) {
      console.error("Error updating security settings:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSecurityLoading(false);
    }
  }

  async function onDeleteAccount(data: DeleteAccountFormValues) {
    setIsDeleteLoading(true);

    try {
      const formData = new FormData();
      formData.append("password", data.password);
      formData.append("confirmText", data.confirmText);

      const result = await deleteUserAccount(formData);

      if (result.success) {
        toast.success("Account deleted successfully");
        setDeleteDialogOpen(false);
        // The user will be redirected automatically after account deletion
      } else {
        toast.error(result.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Endre Passord</CardTitle>
          <CardDescription>
            Oppdater ditt passord for å holde kontoen sikker.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passord</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nytt Passord</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormDescription>
                      Passord må være minst 8 karakterer.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verifiser Passord</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="revokeOtherSessions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 mt-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Logg ut fra alle enheter</FormLabel>
                      <FormDescription>
                        Dette valget vil logge deg ut i fra alle nettlesere og
                        enheter bortsett fra nåværende.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading ? "Lagrer..." : "Lagre passord"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>
            Change the email address associated with your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...emailForm}>
            <form
              onSubmit={emailForm.handleSubmit(onEmailSubmit)}
              className="space-y-4"
            >
              <div className="mb-4">
                <p className="text-sm font-medium mb-1">Current Email</p>
                <p className="text-sm text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
              <FormField
                control={emailForm.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter new email address" {...field} />
                    </FormControl>
                    <FormDescription>
                      Changing your email will require verification on the new
                      address.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isEmailLoading}>
                  {isEmailLoading ? "Submitting..." : "Change email"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card> */}

      {/* <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Manage your account security preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Security recommendation</AlertTitle>
            <AlertDescription>
              We recommend enabling two-factor authentication for added
              security.
            </AlertDescription>
          </Alert>

          <Form {...securityForm}>
            <form
              onSubmit={securityForm.handleSubmit(onSecuritySubmit)}
              className="space-y-6"
            >
              <FormField
                control={securityForm.control}
                name="twoFactorAuth"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <FormLabel className="text-base">
                          Two-Factor Authentication
                        </FormLabel>
                      </div>
                      <FormDescription>
                        Add an extra layer of security to your account.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={securityForm.control}
                name="sessionTimeout"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                        <FormLabel className="text-base">
                          Automatic Session Timeout
                        </FormLabel>
                      </div>
                      <FormDescription>
                        Automatically log out after 30 minutes of inactivity.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSecurityLoading}>
                  {isSecurityLoading ? "Saving..." : "Save settings"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card> */}

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Faresone</CardTitle>
          <CardDescription>
            Slett kontoen din og alle dataene dine permanent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-start space-x-4">
              <Trash className="mt-0.5 h-5 w-5 text-destructive" />
              <div className="space-y-2 flex-1">
                <h4 className="font-medium text-destructive">Slett Konto</h4>
                <p className="text-sm text-muted-foreground">
                  Når du sletter kontoen din, er det ingen vei tilbake. Denne
                  handlingen kan ikke angres.
                </p>
                <Dialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Slett konto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Er du helt sikker?</DialogTitle>
                      <DialogDescription>
                        Dette vil permanent slette kontoen din og alle
                        tilknyttede data. Denne handlingen kan ikke angres.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...deleteForm}>
                      <form
                        onSubmit={deleteForm.handleSubmit(onDeleteAccount)}
                        className="space-y-4"
                      >
                        <FormField
                          control={deleteForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Passord</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Skriv inn passordet ditt"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={deleteForm.control}
                          name="confirmText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bekreft sletting</FormLabel>
                              <FormDescription>
                                Vennligst skriv{" "}
                                <span className="font-medium">DELETE</span> for
                                å bekrefte
                              </FormDescription>
                              <FormControl>
                                <Input placeholder="DELETE" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            type="button"
                          >
                            Avbryt
                          </Button>
                          <Button
                            variant="destructive"
                            type="submit"
                            disabled={isDeleteLoading}
                          >
                            {isDeleteLoading ? "Sletter..." : "Slett konto"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
