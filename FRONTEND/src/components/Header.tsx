import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Clock } from './Clock'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function Header() {
  const { currentUser, logout } = useAppStore()
  const location = useLocation()
  const navigate = useNavigate()

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Visão Geral'
    if (path === '/checklist-mobile') return 'Checklist Mobile'
    if (path === '/tarefas') return 'Tarefas Diárias'
    if (path === '/funcionarios') return 'Gestão de Equipe'
    if (path === '/rotinas') return 'Configuração de Rotinas'
    if (path === '/nao-conformidades') return 'Não Conformidades'
    if (path === '/relatorios') return 'Relatórios Mensais'
    return ''
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (!currentUser) return null

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 no-print">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-primary hidden sm:block">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:block">
          <Clock />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {currentUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser.role === 'ADMIN' ? 'Administrador' : 'Funcionario'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => void handleLogout()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair do Sistema</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
