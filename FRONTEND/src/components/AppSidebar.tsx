import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  ClipboardCheck,
  Users,
  Settings,
  AlertTriangle,
  FileText,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function AppSidebar({ className }: { className?: string }) {
  const location = useLocation()
  const { currentUser } = useAppStore()
  const isAdmin = currentUser?.role === 'ADMIN'

  const navItems = [
    { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, adminOnly: true },
    { title: 'Checklist Mobile', path: '/checklist-mobile', icon: ClipboardCheck, adminOnly: false },
    { title: 'Tarefas', path: '/tarefas', icon: CheckSquare, adminOnly: false },
    {
      title: 'Não Conformidades',
      path: '/nao-conformidades',
      icon: AlertTriangle,
      adminOnly: false,
    },
    { title: 'Funcionários', path: '/funcionarios', icon: Users, adminOnly: true },
    { title: 'Rotinas', path: '/rotinas', icon: Settings, adminOnly: true },
    { title: 'Relatórios Mensais', path: '/relatorios', icon: FileText, adminOnly: true },
  ]

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <Sidebar className={cn('border-r no-print', className)}>
      <SidebarHeader className="p-4 border-b h-16 flex items-center justify-center bg-primary text-primary-foreground">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <ShieldCheck className="h-6 w-6" />
          <span>MHMIXX VISA CONTROLL</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.path} tooltip={item.title}>
                    <Link to={item.path} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
