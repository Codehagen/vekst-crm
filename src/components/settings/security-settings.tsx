"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, KeyRound, Shield } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

const securityFormSchema = z.object({
  twoFactorAuth: z.boolean().default(false),
  sessionTimeout: z.boolean().default(true),
})

type PasswordFormValues = z.infer<typeof passwordFormSchema>
type SecurityFormValues = z.infer<typeof securityFormSchema>

// This can come from your database or API.
const defaultSecurityValues: Partial<SecurityFormValues> = {
  twoFactorAuth: false,
  sessionTimeout: true,
}

export function SecuritySettings() {
  const [isPasswordLoading, setIsPasswordLoading] = useState<boolean>(false)
  const [isSecurityLoading, setIsSecurityLoading] = useState<boolean>(false)

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: defaultSecurityValues,
  })

  function onPasswordSubmit(data: PasswordFormValues) {
    setIsPasswordLoading(true)

    // Simulate API call
    setTimeout(() => {
      console.log(data)
      setIsPasswordLoading(false)
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    }, 1000)
  }

  function onSecuritySubmit(data: SecurityFormValues) {
    setIsSecurityLoading(true)

    // Simulate API call
    setTimeout(() => {
      console.log(data)
      setIsSecurityLoading(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
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
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>Password must be at least 8 characters long.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading ? "Updating..." : "Update password"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Manage your account security preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Security recommendation</AlertTitle>
            <AlertDescription>We recommend enabling two-factor authentication for added security.</AlertDescription>
          </Alert>

          <Form {...securityForm}>
            <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
              <FormField
                control={securityForm.control}
                name="twoFactorAuth"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                      </div>
                      <FormDescription>Add an extra layer of security to your account.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                        <FormLabel className="text-base">Automatic Session Timeout</FormLabel>
                      </div>
                      <FormDescription>Automatically log out after 30 minutes of inactivity.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
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
      </Card>
    </div>
  )
}

