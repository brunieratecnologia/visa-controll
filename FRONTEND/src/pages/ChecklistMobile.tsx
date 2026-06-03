import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  AlertTriangle,
  Factory,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Shift, Task } from '@/types'

const shiftLabel: Record<Shift, string> = {
  ABERTURA: 'Abertura',
  PRODUCAO: 'Producao',
  FECHAMENTO: 'Fechamento',
}

export default function ChecklistMobile() {
  const { tasks, completeTask, currentUser } = useAppStore()
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [observation, setObservation] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pendingTasks = useMemo(() => tasks.filter((task) => task.status !== 'COMPLETED'), [tasks])
  const completedTasks = useMemo(() => tasks.filter((task) => task.status === 'COMPLETED'), [tasks])
  const selectedTask = tasks.find((task) => task.id === selectedTaskId)
  const previewUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : ''), [photo])

  const groupedTasks = useMemo(() => {
    const order: Shift[] = ['ABERTURA', 'PRODUCAO', 'FECHAMENTO']

    return order
      .map((shift) => ({
        shift,
        items: pendingTasks.filter((task) => task.routineShift === shift),
      }))
      .filter((group) => group.items.length > 0)
  }, [pendingTasks])

  const stats = {
    total: tasks.length,
    completed: completedTasks.length,
    pending: pendingTasks.filter((task) => task.status === 'PENDING').length,
    late: pendingTasks.filter((task) => task.status === 'LATE').length,
  }

  const closeDialog = () => {
    setSelectedTaskId(null)
    setObservation('')
    setPhoto(null)
  }

  const handleComplete = async () => {
    if (!selectedTaskId) return

    try {
      setIsSubmitting(true)
      await completeTask(selectedTaskId, { observation, photo })
      toast({ title: 'Checklist atualizado', description: 'Item concluido com sucesso.' })
      closeDialog()
    } catch (error) {
      toast({
        title: 'Erro ao salvar checklist',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderTaskCard = (task: Task) => (
    <button key={task.id} type="button" onClick={() => setSelectedTaskId(task.id)} className="text-left">
      <Card className={cn('rounded-3xl transition-all shadow-sm hover:shadow-md', task.status === 'LATE' && 'border-destructive/50 bg-destructive/5')}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={cn('mt-1 rounded-2xl p-3', task.status === 'LATE' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>
              {task.status === 'LATE' ? <AlertTriangle className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold leading-tight">{task.routineName}</h4>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={task.status === 'LATE' ? 'destructive' : 'secondary'}>
                  {task.status === 'LATE' ? 'Atrasada' : 'Pendente'}
                </Badge>
                {task.routineSector && (
                  <span className="inline-flex items-center gap-1">
                    <Factory className="h-3.5 w-3.5" /> {task.routineSector}
                  </span>
                )}
                <span>{format(new Date(task.date), 'dd/MM/yyyy')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  )

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.18em] text-primary-foreground/70">Operacao mobile</p>
            <h2 className="text-2xl font-bold leading-tight">Checklist por setor e turno</h2>
            <p className="text-sm text-primary-foreground/80">
              {currentUser?.name}, finalize os itens do turno com um toque e anexe foto quando precisar.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <ClipboardCheck className="h-8 w-8" />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs text-primary-foreground/70">Programadas</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs text-primary-foreground/70">Concluidas</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs text-primary-foreground/70">Pendentes</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xs text-primary-foreground/70">Atrasadas</p>
            <p className="text-2xl font-bold">{stats.late}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Checklist do turno</h3>
          <p className="text-sm text-muted-foreground">Agrupado por etapa operacional para facilitar o uso no celular.</p>
        </div>

        {groupedTasks.length === 0 ? (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              Todos os itens do checklist foram concluidos hoje.
            </CardContent>
          </Card>
        ) : (
          groupedTasks.map((group) => (
            <section key={group.shift} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-semibold">{shiftLabel[group.shift]}</h4>
                  <p className="text-sm text-muted-foreground">{group.items.length} itens neste bloco.</p>
                </div>
                <Badge variant="outline" className="rounded-full px-3">{group.items.length} tarefas</Badge>
              </div>
              <div className="grid gap-3">{group.items.map(renderTaskCard)}</div>
            </section>
          ))
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold">Ja concluidas</h3>
          <p className="text-sm text-muted-foreground">Resumo rapido do que ja foi enviado neste turno.</p>
        </div>
        <div className="grid gap-3">
          {completedTasks.slice(0, 4).map((task) => (
            <Card key={task.id} className="rounded-3xl bg-success/5 border-success/20">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="rounded-2xl bg-success/10 text-success p-3">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h4 className="font-semibold leading-tight">{task.routineName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {task.routineSector ? `${task.routineSector} • ` : ''}
                    Feito as {task.completedAt ? format(new Date(task.completedAt), 'HH:mm') : '--:--'} por {task.completedBy || 'Equipe'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Dialog open={selectedTaskId !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedTask?.routineName}</DialogTitle>
            <DialogDescription>
              {selectedTask?.routineSector ? `${selectedTask.routineSector} • ` : ''}
              Registre observacoes e foto opcional para concluir este item do checklist no celular.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Observacoes</Label>
              <Textarea
                value={observation}
                onChange={(event) => setObservation(event.target.value)}
                placeholder="Ex: equipamento higienizado, temperatura conferida, equipe orientada..."
                className="min-h-[110px] rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera className="h-4 w-4" /> Foto da execucao
              </Label>
              <Input type="file" accept="image/*" capture="environment" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
              {previewUrl && <img src={previewUrl} alt="Preview da execucao" className="h-44 w-full rounded-2xl object-cover border" />}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button variant="outline" className="w-full rounded-2xl h-12" onClick={closeDialog}>Cancelar</Button>
            <Button className="w-full rounded-2xl h-12 bg-success hover:bg-success/90 text-white" onClick={() => void handleComplete()} disabled={isSubmitting}>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              {isSubmitting ? 'Salvando checklist...' : 'Concluir item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
