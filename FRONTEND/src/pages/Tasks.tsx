import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, Clock, AlertCircle, ChevronRight, PenLine, Camera, Pencil, Trash2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Tasks() {
  const { tasks, completeTask, updateTask, currentUser } = useAppStore()
  const [selectedTask, setSelectedTask] = useState<number | null>(null)
  const [editingCompletedTask, setEditingCompletedTask] = useState<number | null>(null)
  const [observation, setObservation] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const previewUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : ''), [photo])
  const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED')
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED')

  const resetForm = () => {
    setObservation('')
    setPhoto(null)
    setRemovePhoto(false)
  }

  const closeDialog = () => {
    setSelectedTask(null)
    setEditingCompletedTask(null)
    resetForm()
  }

  const openCompletedEditor = (taskId: number) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return

    setEditingCompletedTask(taskId)
    setObservation(task.observation || '')
    setPhoto(null)
    setRemovePhoto(false)
  }

  const handleComplete = async () => {
    if (!selectedTask) return

    try {
      setIsSubmitting(true)
      await completeTask(selectedTask, { observation, photo })
      toast({ title: 'Tarefa finalizada', description: 'O registro foi salvo com o horario atual.' })
      closeDialog()
    } catch (error) {
      toast({
        title: 'Erro ao concluir tarefa',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingCompletedTask) return

    try {
      setIsSubmitting(true)
      await updateTask(editingCompletedTask, { observation, photo, removePhoto })
      toast({ title: 'Tarefa atualizada', description: 'As alteracoes foram salvas com sucesso.' })
      closeDialog()
    } catch (error) {
      toast({
        title: 'Erro ao atualizar tarefa',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'COMPLETED') return <CheckCircle2 className="h-6 w-6 text-success" />
    if (status === 'LATE') return <AlertCircle className="h-6 w-6 text-destructive animate-pulse-slow" />
    return <Clock className="h-6 w-6 text-warning" />
  }

  const TaskList = ({ items, completed }: { items: typeof tasks; completed?: boolean }) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          Nenhuma tarefa encontrada.
        </div>
      ) : (
        items.map((task) => (
          <Card
            key={task.id}
            className={`cursor-pointer transition-all hover:shadow-md ${task.status === 'LATE' ? 'border-destructive/50 bg-destructive/5' : ''}`}
            onClick={() => !completed && setSelectedTask(task.id)}
          >
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <StatusIcon status={task.status} />
                <div>
                  <h3 className="font-semibold text-lg leading-tight mb-1">{task.routineName}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                    {task.status === 'COMPLETED' ? (
                      <>
                        <span>
                          Feito as {format(new Date(task.completedAt!), 'HH:mm')} por {task.completedBy}
                        </span>
                        {task.photoUrl && (
                          <a href={task.photoUrl} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
                            Ver foto
                          </a>
                        )}
                      </>
                    ) : (
                      <Badge variant={task.status === 'LATE' ? 'destructive' : 'secondary'}>
                        {task.status === 'LATE' ? 'Atrasada' : 'Pendente'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {task.status !== 'COMPLETED' ? (
                <Button variant="ghost" size="icon" className="shrink-0 h-12 w-12 rounded-full bg-primary/5 text-primary">
                  <ChevronRight className="h-6 w-6" />
                </Button>
              ) : currentUser?.role === 'ADMIN' ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={(event) => {
                    event.stopPropagation()
                    openCompletedEditor(task.id)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  const activeTaskData = tasks.find((t) => t.id === selectedTask)
  const editingTaskData = tasks.find((t) => t.id === editingCompletedTask)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tarefas do Dia</h2>
          <p className="text-muted-foreground">Acompanhe as rotinas sanitarias programadas e registre foto pelo celular quando necessario.</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 mb-6">
          <TabsTrigger value="pending" className="text-base">Pendentes ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="completed" className="text-base">Concluidas ({completedTasks.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <TaskList items={pendingTasks} />
        </TabsContent>
        <TabsContent value="completed">
          <TaskList items={completedTasks} completed />
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">{activeTaskData?.routineName}</DialogTitle>
            <DialogDescription>Marque esta tarefa como concluida e, se desejar, anexe uma foto do processo.</DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <PenLine className="h-4 w-4" /> Observacoes (Opcional)
              </label>
              <Textarea
                placeholder="Ex: Utilizado produto quimico X..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2"><Camera className="h-4 w-4" /> Foto da execucao</Label>
              <Input type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
              {previewUrl && <img src={previewUrl} alt="Preview da tarefa" className="h-40 w-full rounded-md object-cover border" />}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full h-12" onClick={closeDialog}>Cancelar</Button>
            <Button className="w-full h-12 bg-success hover:bg-success/90 text-white text-lg" onClick={() => void handleComplete()} disabled={isSubmitting}>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              {isSubmitting ? 'Salvando...' : 'Finalizar Tarefa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCompletedTask} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Editar tarefa concluida</DialogTitle>
            <DialogDescription>
              {editingTaskData?.routineName}. Somente administradores podem ajustar observacoes e foto depois da conclusao.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Observacoes</Label>
              <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} className="min-h-[100px]" />
            </div>
            {editingTaskData?.photoUrl && !removePhoto && (
              <div className="space-y-2">
                <Label>Foto atual</Label>
                <img src={editingTaskData.photoUrl} alt="Foto atual da tarefa" className="h-40 w-full rounded-md object-cover border" />
                <Button type="button" variant="outline" className="w-full" onClick={() => setRemovePhoto(true)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Remover foto atual
                </Button>
              </div>
            )}
            {removePhoto && (
              <div className="rounded-md border border-dashed border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                A foto atual sera removida ao salvar.
              </div>
            )}
            <div className="space-y-2">
              <Label>Nova foto (opcional)</Label>
              <Input type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
              {previewUrl && <img src={previewUrl} alt="Nova foto da tarefa" className="h-40 w-full rounded-md object-cover border" />}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full" onClick={closeDialog}>Cancelar</Button>
            <Button className="w-full" onClick={() => void handleUpdate()} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar alteracoes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
