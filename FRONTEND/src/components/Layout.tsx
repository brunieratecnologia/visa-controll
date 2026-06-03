import { useEffect } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { MobileNav } from './MobileNav'
import { Header } from './Header'
import { useAppStore } from '@/lib/store'

export default function Layout() {
  const { currentUser, isBootstrapping } = useAppStore()
  const location = useLocation()

  useEffect(() => {
    const titles: Record<string, string> = {
      '/dashboard': 'Visão Geral',
      '/checklist-mobile': 'Checklist Mobile',
      '/tarefas': 'Tarefas Diárias',
      '/funcionarios': 'Gestão de Equipe',
      '/rotinas': 'Configuração de Rotinas',
      '/nao-conformidades': 'Não Conformidades',
      '/relatorios': 'Relatórios Mensais',
    }

    const pageTitle = titles[location.pathname]
    document.title = pageTitle ? `MHMIXX VISA CONTROLL - ${pageTitle}` : 'MHMIXX VISA CONTROLL'
  }, [location.pathname])

  if (isBootstrapping) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-primary">MHMIXX VISA CONTROLL</p>
          <p className="text-sm text-muted-foreground">Carregando dados do sistema...</p>
        </div>
      </div>
    )
  }

  if (location.pathname === '/') {
    if (currentUser) {
      return <Navigate to={currentUser.role === 'ADMIN' ? '/dashboard' : '/checklist-mobile'} replace />
    }
    return <Outlet />
  }

  if (!currentUser) {
    return <Navigate to="/" replace />
  }

  if (currentUser.role === 'EMPLOYEE' && location.pathname === '/dashboard') {
    return <Navigate to="/checklist-mobile" replace />
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30 print:bg-white">
        <AppSidebar className="hidden md:flex" />
        <div className="flex flex-col flex-1 w-full max-w-full overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 animate-fade-in print:p-0 print:overflow-visible">
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          </main>
          <MobileNav className="md:hidden" />
        </div>
      </div>
    </SidebarProvider>
  )
}
