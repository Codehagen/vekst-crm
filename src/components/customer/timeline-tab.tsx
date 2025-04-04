import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  Users,
} from 'lucide-react'
import { TabsContent } from '../ui/tabs'

export default function TimelineTab() {
  return (
    <TabsContent value="timeline" className="flex-1 flex flex-col">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="font-medium">Tidslinje</div>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Legg til
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="relative">
          {/* Today */}
          <div className="sticky top-0  z-10 px-4 py-2 text-sm font-medium text-gray-500 border-b">
            I dag
          </div>

          <div className="relative pl-14 pr-4 py-4">
            <div className="absolute left-2 top-4 flex items-center justify-center w-10">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>
            <div className="mb-1">
              <span className="font-medium">E-post sendt</span> av{' '}
              <span className="font-medium">Alexander Borg</span>
            </div>
            <div className="text-sm text-gray-500 mb-2">
              Tema: Kvartalsrapport
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              10:45
            </div>
          </div>

          <div className="relative pl-14 pr-4 py-4">
            <div className="absolute left-2 top-4 flex items-center justify-center w-10">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mb-1">
              <span className="font-medium">Møte avtalt</span> med{' '}
              <span className="font-medium">Qonto Markedsteam</span>
            </div>
            <div className="text-sm text-gray-500 mb-2">
              Diskusjon om partnerskap - Konferanserom A
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              9:30
            </div>
          </div>

          {/* Yesterday */}
          <div className="sticky top-0  z-10 px-4 py-2 text-sm font-medium text-gray-500 border-b">
            I går
          </div>

          <div className="relative pl-14 pr-4 py-4">
            <div className="absolute left-2 top-4 flex items-center justify-center w-10">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mb-1">
              <span className="font-medium">Dokument oppdatert av</span> by{' '}
              <span className="font-medium">Steffen Alver</span>
            </div>
            <div className="text-sm text-gray-500 mb-2">
              Qonto_Business_Plan_2023.pdf
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              4:15
            </div>
          </div>

          <div className="relative pl-14 pr-4 py-4">
            <div className="absolute left-2 top-4 flex items-center justify-center w-10">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mb-1">
              <span className="font-medium">Aktivitet opprettet</span> av{' '}
              <span className="font-medium">Phillip Jensen</span>
            </div>
            <div className="text-sm text-gray-500 mb-2">
              Qonto Strategimøte - 15 Nov. 2023
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              11:20
            </div>
          </div>

          {/* Last Week */}
          <div className="sticky top-0  z-10 px-4 py-2 text-sm font-medium text-gray-500 border-b">
            Forrige uke
          </div>

          <div className="relative pl-14 pr-4 py-4">
            <div className="absolute left-2 top-4 flex items-center justify-center w-10">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>AP</AvatarFallback>
              </Avatar>
            </div>
            <div className="mb-1">
              <span className="font-medium">Kontakt oppdatert</span> av{' '}
              <span className="font-medium">Josef Panini</span>
            </div>
            <div className="text-sm text-gray-500 mb-2">
              Oppdatert kontaktinfo for Alexander Borg
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              30 okt. 2023
            </div>
          </div>

          <div className="relative pl-14 pr-4 py-4">
            <div className="absolute left-2 top-4 flex items-center justify-center w-10">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>
            <div className="mb-1">
              <span className="font-medium">E-post utsendt</span> til{' '}
              <span className="font-medium">Qonto Team</span>
            </div>
            <div className="text-sm text-gray-500 mb-2">
              Subjekt: Budjsett for Q4
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              28 okt. 2023
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  )
}
