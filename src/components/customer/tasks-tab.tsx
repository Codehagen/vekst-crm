import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertCircle,
  Calendar,
  Clock,
  Filter,
  MoreHorizontal,
  Plus,
  Tag,
} from 'lucide-react'
import { TabsContent } from '../ui/tabs'

export default function TasksTab() {
  return (
    <TabsContent value="tasks" className="flex-1 flex flex-col">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="font-medium">Oppgaver</div>
          <Badge variant="outline" className="rounded-full text-xs font-normal">
            8
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Ny oppgave
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 border-b">
          <div className="font-medium mb-2">Utgått</div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-red-500">
              <Checkbox id="task1" className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <label htmlFor="task1" className="font-medium cursor-pointer">
                  Ferdigstill Qontos finansielle analyse
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-xs text-red-600 font-medium">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Utgikk for 2 dager siden
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Tag className="h-3 w-3 mr-1" />
                    Finans
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>PS</AvatarFallback>
                </Avatar>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rediger</DropdownMenuItem>
                    <DropdownMenuItem>Tildel</DropdownMenuItem>
                    <DropdownMenuItem>Slett</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="font-medium mb-2">I dag</div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <Checkbox id="task2" className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <label htmlFor="task2" className="font-medium cursor-pointer">
                  Sett opp møte med Qontos styre
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    I dag, 17:00
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Tag className="h-3 w-3 mr-1" />
                    Møte
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>AP</AvatarFallback>
                </Avatar>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rediger</DropdownMenuItem>
                    <DropdownMenuItem>Tildel</DropdownMenuItem>
                    <DropdownMenuItem>Slett</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <Checkbox id="task3" className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <label htmlFor="task3" className="font-medium cursor-pointer">
                  Gjennomgå Qontos Q4 resultatsmålinger
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    I dag, 15:00
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Tag className="h-3 w-3 mr-1" />
                    Analyse
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>SA</AvatarFallback>
                </Avatar>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rediger</DropdownMenuItem>
                    <DropdownMenuItem>Tildel</DropdownMenuItem>
                    <DropdownMenuItem>Slett</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="font-medium mb-2">Kommende</div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <Checkbox id="task4" className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <label htmlFor="task4" className="font-medium cursor-pointer">
                Forbered presentasjon for Qonto partnerskapsforslag
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    I morgen, 10:00
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Tag className="h-3 w-3 mr-1" />
                    Presentasjon
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>TC</AvatarFallback>
                </Avatar>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rediger</DropdownMenuItem>
                    <DropdownMenuItem>Tildel</DropdownMenuItem>
                    <DropdownMenuItem>Slett</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <Checkbox id="task5" className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <label htmlFor="task5" className="font-medium cursor-pointer">
                Følg opp med Qonto-teamet om budsjettgodkjenning
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    10 nov. 2023
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Tag className="h-3 w-3 mr-1" />
                    Finans
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>PS</AvatarFallback>
                </Avatar>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rediger</DropdownMenuItem>
                    <DropdownMenuItem>Tildel</DropdownMenuItem>
                    <DropdownMenuItem>Slett</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <Checkbox id="task6" className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <label htmlFor="task6" className="font-medium cursor-pointer">
                Utkast til kontrakt for Qonto strategisk partnerskap
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    15 nov. 2023
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Tag className="h-3 w-3 mr-1" />
                    Justis
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>AP</AvatarFallback>
                </Avatar>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rediger</DropdownMenuItem>
                    <DropdownMenuItem>Tildel</DropdownMenuItem>
                    <DropdownMenuItem>Slett</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  )
}
