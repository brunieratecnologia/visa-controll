import { Link, useLocation } from 'react-router-dom'
import { CheckSquare, AlertTriangle, LayoutDashboard, FileText, ClipboardCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

export function MobileNav({ className }: { className?: string }) {
  const location = useLocation()
  const { currentUser } = useAppStore()
  const isAdmin = currentUser?.role === 'ADMIN'

  const items = isAdmin
    ? [
        { title: 'Início', path: '/dashboard', icon: LayoutDashboard },
        { title: 'Checklist', path: '/checklist-mobile', icon: ClipboardCheck },
        { title: 'Relatórios', path: '/relatorios', icon: FileText },
      ]
    : [
        { title: 'Checklist', path: '/checklist-mobile', icon: ClipboardCheck },
        { title: 'Tarefas', path: '/tarefas', icon: CheckSquare },
        { title: 'Reportar', path: '/nao-conformidades', icon: AlertTriangle },
      ]

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe z-50 no-print',
        className,
      )}
    >
      <nav className="flex h-16 items-center justify-around px-4">
        {items.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[64px] transition-colors',
                isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'fill-primary/20')} />
              <span className="text-[10px]">{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
