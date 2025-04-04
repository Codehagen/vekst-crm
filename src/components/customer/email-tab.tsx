import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TabsContent } from '@/components/ui/tabs'
import {
    Plus,
    User
} from 'lucide-react'

export default function EmailTab() {
  return (
    <TabsContent value="emails" className="flex-1 flex flex-col mt-0 p-0">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="font-medium">Innboks</div>
          <Badge variant="outline" className="rounded-full text-xs font-normal">
            2
          </Badge>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Opprett
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="border-b p-4 flex items-center gap-3">
          <Avatar className="w-6 h-6">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>
              <User className="p-0.5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="font-medium truncate">Alexandre...</div>
                <Badge
                  variant="outline"
                  className="rounded-full text-xs font-normal">
                  2
                </Badge>
              </div>
              <div className="text-sm text-gray-500">1:30pm</div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
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
              Not shared
            </div>
          </div>
        </div>

        <div className="border-b p-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                <User className="p-0.5" />
              </AvatarFallback>
            </Avatar>
            <Avatar className="w-6 h-6">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                <User className="p-0.5" />
              </AvatarFallback>
            </Avatar>
            <Avatar className="w-6 h-6">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                <User className="p-0.5" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="font-medium truncate">Félix...</div>
                <Badge
                  variant="outline"
                  className="rounded-full text-xs font-normal">
                  4
                </Badge>
              </div>
              <div className="text-sm text-gray-500">4 nov 2023</div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Partnerships</span>
              <span className="text-gray-500 truncate">
                Lorem ipsum dolor sit amet, consectetur adipiscing eli...
              </span>
            </div>
          </div>
        </div>

        <div className="border-b p-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                <User className="p-0.5" />
              </AvatarFallback>
            </Avatar>
            <Avatar className="w-6 h-6">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                <User className="p-0.5" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="font-medium truncate">Steve, A...</div>
                <Badge
                  variant="outline"
                  className="rounded-full text-xs font-normal">
                  7
                </Badge>
              </div>
              <div className="text-sm text-gray-500">3 nov 2023</div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Team Meeting: Qonto</span>
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
                className="text-gray-500">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span className="text-gray-500">Not shared</span>
            </div>
          </div>
        </div>

        <div className="border-b p-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                <User className="p-0.5" />
              </AvatarFallback>
            </Avatar>
            <Avatar className="w-6 h-6">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                <User className="p-0.5" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="font-medium truncate">Tim...</div>
                <Badge
                  variant="outline"
                  className="rounded-full text-xs font-normal">
                  2
                </Badge>
              </div>
              <div className="text-sm text-gray-500">2 nov 2023</div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">
                Discuss: Qonto's Business Plan
              </span>
              <span className="text-gray-500 truncate">
                Lorem ipsum dolor sit amet, consect...
              </span>
            </div>
          </div>
        </div>

        <div className="border-b p-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                <User className="p-0.5" />
              </AvatarFallback>
            </Avatar>
            <Avatar className="w-6 h-6">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                <User className="p-0.5" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="font-medium truncate">Alexandre...</div>
                <Badge
                  variant="outline"
                  className="rounded-full text-xs font-normal">
                  2
                </Badge>
              </div>
              <div className="text-sm text-gray-500">23 oct 2023</div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">
                Feedback on: Qonto Project Proposal
              </span>
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
                className="text-gray-500">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span className="text-gray-500">Not shared</span>
            </div>
          </div>
        </div>

        <div className="border-b p-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                <User className="p-0.5" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="font-medium truncate">Reid...</div>
                <Badge
                  variant="outline"
                  className="rounded-full text-xs font-normal">
                  2
                </Badge>
              </div>
              <div className="text-sm text-gray-500">14 oct 2023</div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">
                Qonto Audit: Your Expertise Needed
              </span>
              <span className="text-gray-500 truncate">
                Lorem ipsum dolor sit amet, c...
              </span>
            </div>
          </div>
        </div>

        <div className="border-b p-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                <User className="p-0.5" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="font-medium truncate">Steve...</div>
                <Badge
                  variant="outline"
                  className="rounded-full text-xs font-normal">
                  14
                </Badge>
              </div>
              <div className="text-sm text-gray-500">12 oct 2023</div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">
                Action Required: Qonto Metrics
              </span>
              <span className="text-gray-500 truncate">
                Lorem ipsum dolor sit amet, conse...
              </span>
            </div>
          </div>
        </div>

        <div className="border-b p-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                <User className="p-0.5" />
              </AvatarFallback>
            </Avatar>
            <Avatar className="w-6 h-6">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                <User className="p-0.5" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="font-medium truncate">Steve, K...</div>
                <Badge
                  variant="outline"
                  className="rounded-full text-xs font-normal">
                  4
                </Badge>
              </div>
              <div className="text-sm text-gray-500">03 oct 2023</div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">
                Qonto: Approve Budget Proposal
              </span>
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
                className="text-gray-500">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span className="text-gray-500">Not shared</span>
            </div>
          </div>
        </div>

        <div className="border-b p-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                <User className="p-0.5" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="font-medium truncate">Roelof...</div>
                <Badge
                  variant="outline"
                  className="rounded-full text-xs font-normal">
                  5
                </Badge>
              </div>
              <div className="text-sm text-gray-500">24 sep 2023</div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Need Input: Qonto Strategy</span>
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
                className="text-gray-500">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span className="text-gray-500">Not shared</span>
            </div>
          </div>
        </div>

        <div className="border-b p-4 flex items-center gap-3">
          <Avatar className="w-6 h-6">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>
              <User className="p-0.5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="font-medium truncate">Chris...</div>
                <Badge
                  variant="outline"
                  className="rounded-full text-xs font-normal">
                  2
                </Badge>
              </div>
              <div className="text-sm text-gray-500">4 sep 2023</div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
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
              Not shared
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  )
}
