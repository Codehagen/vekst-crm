'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { updateUserProfile, getUserProfile } from '@/app/actions/user-settings'
import { useSession } from '@/lib/auth/client'
import { toast } from 'sonner'

// Define an extended user type to include the custom fields
interface ExtendedUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
  image?: string | null
  phone?: string
  jobTitle?: string
  company?: string
  workspaceId?: string
  department?: string
  timezone?: string
  bio?: string
  role?: string
}

// Declare session type with extended user
type ExtendedSession = {
  user: ExtendedUser
  token: string | null
}

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: 'Name must be at least 2 characters.',
    })
    .max(30, {
      message: 'Name must not be longer than 30 characters.',
    }),
  email: z
    .string()
    .min(1, { message: 'This field is required.' })
    .email('This is not a valid email.'),
  phone: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function PersonalInfoForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { data: session, isPending } = useSession()

  // Initialize form with empty values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
    mode: 'onChange',
  })

  // Fetch user data directly from server
  useEffect(() => {
    async function fetchUserData() {
      try {
        const result = await getUserProfile()

        if (result.success && result.data) {
          const userData = result.data

          form.reset({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
          })
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserData()
  }, [form])

  // Fallback to session data if available
  useEffect(() => {
    if (session?.user && !form.getValues().phone) {
      // Cast session to ExtendedSession to access custom fields
      const user = session.user as ExtendedUser
      const { name, email } = user
      const phone = user.phone || ''

      // Only reset if we have actual session data
      if (name || email) {
        form.reset({
          name: name || '',
          email: email || '',
          phone,
        })
      }
    }
  }, [session, form])

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)

    try {
      // Create FormData object
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('image', session?.user?.image || '')
      formData.append('phone', data.phone || '')

      // Call the server action
      const result = await updateUserProfile(formData)

      if (result.success) {
        toast.success('Profile updated successfully')
      } else {
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const data = {
    header: 'Personlig Informasjon',
    description:
      'Oppdater din personlige informasjon og hvordan andre ser deg på plattformen.',
  }

  // Show loading state when session is loading
  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{data.header}</CardTitle>
          <CardDescription>{data.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted"></div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="h-4 w-20 rounded bg-muted"></div>
                <div className="h-10 w-full rounded bg-muted"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 rounded bg-muted"></div>
                <div className="h-10 w-full rounded bg-muted"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If no session data is available, show a message
  if (!session?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{data.header}</CardTitle>
          <CardDescription>Vennligst logg inn.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.header}</CardTitle>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={session?.user?.image || ''}
                  alt={session?.user?.name || 'User'}
                />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">
                Profilbildet administreres av autentiseringsleverandøren din. F.eks Gmail
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fullt navn</FormLabel>
                    <FormControl>
                      <Input placeholder="Ola Normann" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-post</FormLabel>
                    <FormControl>
                      <Input placeholder="E-post" disabled {...field} />
                    </FormControl>
                    <FormDescription>
                      Gå til Sikkerhetsfanen for å endre E-posten din.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefonnummer</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Lagrer...' : 'Lagre endringer'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
