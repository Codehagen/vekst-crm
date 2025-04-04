import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckSquare,
  FileText,
  Folder,
  Mail
} from 'lucide-react'
import { notFound } from 'next/navigation'

import { getCustomerById } from '@/app/actions/customers/actions'
import { PageHeader } from '@/components/page-header'
import { ChurnRiskLevel } from '@prisma/client'
import { RiTimeLine } from '@remixicon/react'
import EmailTab from '@/components/customer/email-tab'
import TimelineTab from '@/components/customer/timeline-tab'
import TasksTab from '@/components/customer/tasks-tab'
import NotesTab from '@/components/customer/notes-tab'
import FilesTab from '@/components/customer/files-tab'

interface CustomerDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailsPage({
  params,
}: CustomerDetailsPageProps) {
  const customerId = (await params).id
  const customer = await getCustomerById(customerId)

  if (!customer) {
    return notFound()
  }

  const getRiskBadge = (risk: ChurnRiskLevel | null) => {
    if (!risk) return null

    const riskBadges: Record<
      string,
      {
        label: string
        variant: 'default' | 'outline' | 'secondary' | 'destructive' | 'success'
      }
    > = {
      low: { label: 'Lav churn risiko', variant: 'success' },
      medium: { label: 'Medium churn risiko', variant: 'secondary' },
      high: { label: 'Høy churn risiko', variant: 'default' },
      critical: { label: 'Kritisk churn risiko', variant: 'destructive' },
    }

    const { label, variant } = riskBadges[risk] || {
      label: risk,
      variant: 'outline',
    }

    return (
      <Badge variant={variant as any} className="ml-2">
        {label}
      </Badge>
    )
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('nb-NO')
  }

  return (
    <>
      <PageHeader
        items={[
          { label: 'CRM System', href: '/' },
          { label: 'Kunder', href: '/customers' },
        ]}
      />
      <div className="flex h-screen w-full overflow-hidden border-t">
        {/* Middle Panel - Company Details */}
        <div className="w-[320px] border-r flex flex-col">
          <div className="p-6 flex flex-col items-center border-b">
            <div className="w-16 h-16 bg-black rounded flex items-center justify-center text-white text-2xl mb-2">
              Q
            </div>
            <div className="text-xl font-medium">Qonto</div>
            <div className="text-sm text-gray-500">Added 2 years ago</div>
          </div>

          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                URL
              </div>
              <Badge variant="outline" className="text-xs px-2 py-1 rounded">qonto.com</Badge>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Account Owner
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Avatar className="w-5 h-5">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-[10px]">PS</AvatarFallback>
                </Avatar>
                Phil Schiller
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                ICP
              </div>
              <div className="flex items-center gap-1 text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-500">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                True
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Revenue
              </div>
              <div className="text-sm">$500,000</div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
                LinkedIn
              </div>
              <Badge variant="outline" className="text-xs px-2 py-1 rounded">
                linkedin.com/company/qonto
              </Badge>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
                Twitter
              </div>
              <Badge variant="outline" className="text-xs px-2 py-1 rounded">@qonto</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M12 3v12" />
                  <path d="m8 11 4 4 4-4" />
                  <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
                </svg>
                More
              </div>
            </div>
          </div>

          <div className="p-4 border-b">
            <div className="font-medium mb-2">Holdings</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-white text-xs">
                  Q
                </div>
                <label htmlFor="holdings" className="text-sm">
                  Global Holdings
                </label>
              </div>
            </div>
          </div>

          <div className="p-4 border-b">
            <div className="font-medium mb-2">Opportunities</div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-white text-xs">
                Q
              </div>
              <div className="text-sm">Qonto</div>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="font-medium">People</div>
              <div className="text-xs text-gray-500">All (12)</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-[10px]">AP</AvatarFallback>
                </Avatar>
                <div className="text-sm">Alexandre Prot</div>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-[10px]">SA</AvatarFallback>
                </Avatar>
                <div className="text-sm">Steve Anavi</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Inbox */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="emails" className="flex flex-col gap-0">
            <div className="border-b">
              <TabsList className="justify-start bg-transparent p-0 rounded-none [&>*]:border-x-0 [&>*]:border-t-0 [&>*]:px-5 [&>*]:py-2">
                <TabsTrigger
                  value="timeline"
                  className="data-[state=active]:border-b-2 dark:data-[state=active]:bg-background data-[state=active]:bg-primary-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-primary-foreground data-[state=active]:border-primary rounded-none">
                  <RiTimeLine className="h-4 w-4 mr-2" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger
                  value="tasks"
                  className="data-[state=active]:border-b-2 dark:data-[state=active]:bg-background data-[state=active]:bg-primary-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-primary-foreground data-[state=active]:border-primary rounded-none">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="data-[state=active]:border-b-2 dark:data-[state=active]:bg-background data-[state=active]:bg-primary-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-primary-foreground data-[state=active]:border-primary rounded-none">
                  <FileText className="h-4 w-4 mr-2" />
                  Notes
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="data-[state=active]:border-b-2 dark:data-[state=active]:bg-background data-[state=active]:bg-primary-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-primary-foreground data-[state=active]:border-primary rounded-none">
                  <Folder className="h-4 w-4 mr-2" />
                  Files
                </TabsTrigger>
                <TabsTrigger
                  value="emails"
                  className="data-[state=active]:border-b-2 dark:data-[state=active]:bg-background data-[state=active]:bg-primary-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-primary-foreground data-[state=active]:border-primary rounded-none">
                  <Mail className="h-4 w-4 mr-2" />
                  Emails
                </TabsTrigger>
              </TabsList>
            </div>
            <TimelineTab/>
            <TasksTab/>
            <NotesTab/>
            <FilesTab/>
            <EmailTab/>
   
          </Tabs>
        </div>
      </div>
    </>
  )
}
