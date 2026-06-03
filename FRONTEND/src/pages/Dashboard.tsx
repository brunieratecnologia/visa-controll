import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, AlertCircle, Activity } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { format } from 'date-fns'

export default function Dashboard() {
  const { dashboard, logs } = useAppStore()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas Hoje</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.stats.total}</div>
            <p className="text-xs text-muted-foreground">Rotinas programadas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.stats.pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando execucao</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{dashboard.stats.late}</div>
            <p className="text-xs text-muted-foreground">Fora do prazo</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive shadow-sm bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Não Conformidades
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{dashboard.stats.issuesOpen}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Execução Semanal</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <ChartContainer
              config={{
                concluidas: { label: 'Concluidas', color: 'hsl(var(--success))' },
                pendentes: { label: 'Pendentes/Atrasadas', color: 'hsl(var(--warning))' },
              }}
              className="h-[300px]"
            >
              <BarChart data={dashboard.weeklyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="concluidas" fill="var(--color-concluidas)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendentes" fill="var(--color-pendentes)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[300px] pr-4">
            <div className="space-y-4">
              {logs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-4 text-sm relative">
                  <div className="mt-0.5 relative z-10 w-2 h-2 rounded-full bg-primary ring-4 ring-background" />
                  <div className="absolute left-[3px] top-3 bottom-[-24px] w-px bg-border last:hidden" />
                  <div className="flex-1 space-y-1">
                    <p className="font-medium leading-none">{log.user}</p>
                    <p className="text-muted-foreground">{log.details}</p>
                    <time className="text-xs text-muted-foreground/70">
                      {format(new Date(log.timestamp), 'HH:mm')}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

