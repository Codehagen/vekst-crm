import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Clock,
  FileText,
  Grid3X3,
  List,
  MoreHorizontal,
  Plus,
  Search,
} from 'lucide-react'
import { TabsContent } from '../ui/tabs'

export default function NotesTab() {
  return (
    <TabsContent value="notes" className="flex-1 flex flex-col">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="font-medium">Notater</div>
          <Badge variant="outline" className="rounded-full text-xs font-normal">
            12
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Søk i notater..." className="pl-8" />
          </div>
          <div className="flex border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none rounded-l-md">
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none rounded-r-md bg-gray-100">
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Nytt notat
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">
                  Qonto Partnerskapsstrategi
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rediger</DropdownMenuItem>
                    <DropdownMenuItem>Del</DropdownMenuItem>
                    <DropdownMenuItem>Slett</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>
                Hovedpunkter for det kommende møtet
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <p>1. Diskuter integrasjonstidslinje med Qontos API</p>
              <p>2. Gjennomgå økonomiske prognoser for Q1 2024</p>
              <p>3. Skissere strategi for markedsføringssamarbeid</p>
              <p>4. Ta opp bekymringer rundt regulatorisk samsvar</p>
            </CardContent>
            <CardFooter className="pt-2 text-xs text-gray-500 flex justify-between">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Oppdatert for 2 dager siden
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>4 elementer</span>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">
                  Møtenotater: Qonto-teamet
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rediger</DropdownMenuItem>
                    <DropdownMenuItem>Del</DropdownMenuItem>
                    <DropdownMenuItem>Slett</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>28. okt 2023 - Konferanserom A</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                Alexandre presenterte den nye forretningsplanen for europeisk
                ekspansjon. Steve diskuterte tekniske krav for integrasjonen.
                Phil uttrykte bekymringer om tidslinjens gjennomførbarhet.
              </p>
            </CardContent>
            <CardFooter className="pt-2 text-xs text-gray-500 flex justify-between">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Oppdatert for 1 uke siden
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-[10px]">PS</AvatarFallback>
                </Avatar>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">
                  Qonto Produktanalyse
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rediger</DropdownMenuItem>
                    <DropdownMenuItem>Del</DropdownMenuItem>
                    <DropdownMenuItem>Slett</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>
                Konkurranseanalyse og funksjonssammenligning
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                Qontos bankplattform tilbyr overlegen API-integrasjon
                sammenlignet med konkurrentene. Deres
                flerbrukertilgangskontroller er bransjeledende, men
                prisstrukturen deres er mer kompleks enn nødvendig.
              </p>
            </CardContent>
            <CardFooter className="pt-2 text-xs text-gray-500 flex justify-between">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Oppdatert for 2 uker siden
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-[10px]">SA</AvatarFallback>
                </Avatar>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">
                  Finansielle Prognoser
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rediger</DropdownMenuItem>
                    <DropdownMenuItem>Del</DropdownMenuItem>
                    <DropdownMenuItem>Slett</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>
                Omsetningsprognose Q4 2023 - Q2 2024
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                Basert på nåværende vekstbane og partnerskapet med Qonto,
                forventer vi en økning i omsetning på 32% innen Q2 2024.
                Kostnaden for kundeverving bør reduseres med omtrent 18% takket
                være delte markedsføringsinitiativer.
              </p>
            </CardContent>
            <CardFooter className="pt-2 text-xs text-gray-500 flex justify-between">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Oppdatert for 3 dager siden
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-[10px]">AP</AvatarFallback>
                </Avatar>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">
                  Teknisk Integrasjonsplan
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rediger</DropdownMenuItem>
                    <DropdownMenuItem>Del</DropdownMenuItem>
                    <DropdownMenuItem>Slett</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>
                Veikart for API- og systemintegrasjon
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <p>Fase 1: API-autentisering og grunnleggende datautveksling</p>
              <p>Fase 2: Overvåking av transaksjoner i sanntid</p>
              <p>Fase 3: Automatisert avstemming og rapportering</p>
              <p>Fase 4: White-label UI-komponenter</p>
            </CardContent>
            <CardFooter className="pt-2 text-xs text-gray-500 flex justify-between">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Oppdatert for 5 dager siden
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-[10px]">TC</AvatarFallback>
                </Avatar>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">Juridiske Hensyn</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rediger</DropdownMenuItem>
                    <DropdownMenuItem>Del</DropdownMenuItem>
                    <DropdownMenuItem>Slett</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>Notater om regulatorisk samsvar</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                Må sikre GDPR-samsvar for datadeling med Qonto. Gjennomgå vilkår
                for API-bruk og krav til datalagring. Planlegg møte med juridisk
                team for å diskutere regelverk for grenseoverskridende
                transaksjoner.
              </p>
            </CardContent>
            <CardFooter className="pt-2 text-xs text-gray-500 flex justify-between">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Oppdatert for 1 uke siden
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-[10px]">PS</AvatarFallback>
                </Avatar>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </TabsContent>
  )
}
