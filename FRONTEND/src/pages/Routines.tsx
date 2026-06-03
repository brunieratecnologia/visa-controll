import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  Clock3,
  Factory,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiRequest } from '@/lib/api'
import { Frequency, Routine, RoutinePayload, Shift } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/use-toast'

type RoutineForm = RoutinePayload
type FormMode = 'create' | 'edit'

const defaultForm: RoutineForm = {
  name: '',
  frequency: '3X_WEEK',
  category: 'CLEANING',
  sector: '',
  shift: 'PRODUCAO',
  isActive: true,
}

const frequencyLabel: Record<Frequency, string> = {
  DAILY: 'Diario',
  '3X_WEEK': '3 vezes por semana',
  WEEKLY: 'Semanal',
}

const categoryLabel: Record<Routine['category'], string> = {
  CLEANING: 'Limpeza',
  MAINTENANCE: 'Manutencao',
  VERIFICATION: 'Verificacao',
}

const shiftLabel: Record<Shift, string> = {
  ABERTURA: 'Abertura',
  PRODUCAO: 'Producao',
  FECHAMENTO: 'Fechamento',
}

export default function Routines() {
  const { currentUser, refreshState } = useAppStore()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [editingRoutineId, setEditingRoutineId] = useState<number | null>(null)
  const [deletingRoutineId, setDeletingRoutineId] = useState<number | null>(null)
  const [form, setForm] = useState<RoutineForm>(defaultForm)

  const loadRoutines = async () => {
    if (!currentUser) return

    setIsLoading(true)
    try {
      const payload = await apiRequest<{ routines: Routine[] }>(`/routines?current_user_id=${currentUser.id}`)
      setRoutines(payload.routines)
    } catch (error) {
      toast({
        title: 'Erro ao carregar rotinas',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!currentUser) return
    void loadRoutines()
  }, [currentUser])

  const filteredRoutines = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return routines.filter((routine) => {
      if (!term) return true

      return (
        routine.name.toLowerCase().includes(term) ||
        routine.sector.toLowerCase().includes(term) ||
        frequencyLabel[routine.frequency].toLowerCase().includes(term) ||
        categoryLabel[routine.category].toLowerCase().includes(term) ||
        shiftLabel[routine.shift].toLowerCase().includes(term) ||
        (routine.isActive ? 'ativo' : 'inativo').includes(term)
      )
    })
  }, [routines, searchTerm])

  const totals = {
    active: routines.filter((routine) => routine.isActive !== false).length,
    inactive: routines.filter((routine) => routine.isActive === false).length,
    total: routines.length,
  }

  const resetForm = () => setForm(defaultForm)

  const openCreate = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) {
      setFormMode('create')
      setEditingRoutineId(null)
      resetForm()
    }
  }

  const openCreateDialog = () => {
    setFormMode('create')
    setEditingRoutineId(null)
    resetForm()
    setIsFormOpen(true)
  }

  const openEditDialog = (routineId: number) => {
    const routine = routines.find((item) => item.id === routineId)
    if (!routine) return

    setFormMode('edit')
    setEditingRoutineId(routineId)
    setForm({
      name: routine.name,
      frequency: routine.frequency,
      category: routine.category,
      sector: routine.sector,
      shift: routine.shift,
      isActive: routine.isActive !== false,
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setFormMode('create')
    setEditingRoutineId(null)
    resetForm()
  }

  const submitRoutine = async () => {
    if (!currentUser) return

    try {
      setIsSubmitting(true)
      const payload = {
        current_user_id: currentUser.id,
        name: form.name.trim(),
        frequency: form.frequency,
        category: form.category,
        sector: form.sector.trim(),
        shift: form.shift,
        is_active: form.isActive,
      }

      if (formMode === 'edit' && editingRoutineId) {
        await apiRequest(`/routines/${editingRoutineId}`, {
          method: 'PUT',
          body: payload,
        })
        toast({
          title: 'Rotina atualizada',
          description: 'As alteracoes foram salvas com sucesso.',
        })
      } else {
        await apiRequest('/routines', {
          method: 'POST',
          body: payload,
        })
        toast({
          title: 'Rotina criada',
          description: 'A nova rotina foi adicionada ao cadastro.',
        })
      }

      await Promise.all([loadRoutines(), refreshState()])
      closeForm()
    } catch (error) {
      toast({
        title: formMode === 'edit' ? 'Erro ao atualizar rotina' : 'Erro ao criar rotina',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteRoutine = async () => {
    if (!currentUser || !deletingRoutineId) return

    try {
      setIsSubmitting(true)
      await apiRequest(`/routines/${deletingRoutineId}`, {
        method: 'DELETE',
        body: {
          current_user_id: currentUser.id,
        },
      })
      toast({
        title: 'Rotina desativada',
        description: 'A rotina foi mantida no historico e saiu da lista ativa.',
      })
      setDeletingRoutineId(null)
      await Promise.all([loadRoutines(), refreshState()])
    } catch (error) {
      toast({
        title: 'Erro ao desativar rotina',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const reactivateRoutine = async (routine: Routine) => {
    if (!currentUser) return

    try {
      setIsSubmitting(true)
      await apiRequest(`/routines/${routine.id}`, {
        method: 'PUT',
        body: {
          current_user_id: currentUser.id,
          name: routine.name,
          frequency: routine.frequency,
          category: routine.category,
          sector: routine.sector,
          shift: routine.shift,
          is_active: true,
        },
      })
      toast({
        title: 'Rotina reativada',
        description: 'A rotina voltou para a lista ativa.',
      })
      await Promise.all([loadRoutines(), refreshState()])
    } catch (error) {
      toast({
        title: 'Erro ao reativar rotina',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formIsValid = Boolean(form.name.trim() && form.sector.trim())
  const dialogTitle = formMode === 'edit' ? 'Editar Rotina' : 'Nova Rotina'
  const dialogDescription =
    formMode === 'edit'
      ? 'Ajuste os dados da rotina sem duplicar o cadastro existente.'
      : 'Cadastre uma nova rotina operacional para uso nas tarefas e relatórios.'

  const formContent = (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Nome da Rotina</Label>
        <Input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Ex.: CONTROLE DE HIGIENIZAÇÃO DAS PAREDES"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            value={form.category}
            onValueChange={(value: Routine['category']) => setForm({ ...form, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLEANING">Limpeza</SelectItem>
              <SelectItem value="VERIFICATION">Verificacao</SelectItem>
              <SelectItem value="MAINTENANCE">Manutencao</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Frequencia</Label>
          <Select
            value={form.frequency}
            onValueChange={(value: Frequency) => setForm({ ...form, frequency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Diario</SelectItem>
              <SelectItem value="3X_WEEK">3 vezes por semana</SelectItem>
              <SelectItem value="WEEKLY">Semanal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Setor</Label>
          <Input
            value={form.sector}
            onChange={(event) => setForm({ ...form, sector: event.target.value })}
            placeholder="Ex.: AREA DE PRODUCAO"
          />
        </div>

        <div className="space-y-2">
          <Label>Turno</Label>
          <Select
            value={form.shift}
            onValueChange={(value: Shift) => setForm({ ...form, shift: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ABERTURA">Abertura</SelectItem>
              <SelectItem value="PRODUCAO">Producao</SelectItem>
              <SelectItem value="FECHAMENTO">Fechamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={form.isActive ? 'ACTIVE' : 'INACTIVE'}
          onValueChange={(value: 'ACTIVE' | 'INACTIVE') =>
            setForm({ ...form, isActive: value === 'ACTIVE' })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Ativa</SelectItem>
            <SelectItem value="INACTIVE">Inativa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        Rotinas inativas permanecem no historico e podem ser reativadas a qualquer momento.
      </p>
    </div>
  )

  if (!currentUser) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Faça login para gerenciar as rotinas configuradas.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-gradient-to-r from-slate-50 via-white to-emerald-50/60 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Cadastro oficial do sistema
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Rotinas Configuradas</h2>
              <p className="max-w-3xl text-muted-foreground">
                Cadastre, edite e desative as rotinas que alimentam tarefas, relatórios e controles da empresa.
              </p>
            </div>
          </div>

          <Dialog open={isFormOpen} onOpenChange={openCreate}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" /> Nova Rotina
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogDescription>{dialogDescription}</DialogDescription>
              </DialogHeader>
              {formContent}
              <DialogFooter>
                <Button variant="outline" onClick={closeForm}>
                  Cancelar
                </Button>
                <Button onClick={() => void submitRoutine()} disabled={!formIsValid || isSubmitting}>
                  {isSubmitting ? 'Salvando...' : formMode === 'edit' ? 'Atualizar' : 'Salvar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de rotinas</p>
                <p className="text-2xl font-bold">{totals.total}</p>
              </div>
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rotinas ativas</p>
                <p className="text-2xl font-bold text-emerald-600">{totals.active}</p>
              </div>
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rotinas inativas</p>
                <p className="text-2xl font-bold text-amber-600">{totals.inactive}</p>
              </div>
              <Trash2 className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Factory className="h-5 w-5 text-primary" />
                Rotinas Operacionais
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Ativas: {totals.active}</Badge>
                <Badge variant="outline">Inativas: {totals.inactive}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nome, setor, categoria ou frequencia..."
                className="border-0 p-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nome da Rotina</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Frequencia</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[56px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        Carregando rotinas...
                      </TableCell>
                    </TableRow>
                  ) : filteredRoutines.length ? (
                    filteredRoutines.map((routine) => (
                      <TableRow key={routine.id}>
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">{routine.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {routine.isActive === false
                                ? 'Registro inativo preservado no historico'
                                : 'Registro ativo no fluxo operacional'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{categoryLabel[routine.category]}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Factory className="h-4 w-4 text-muted-foreground" />
                            <span>{routine.sector}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-muted-foreground" />
                            <span>{shiftLabel[routine.shift]}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{frequencyLabel[routine.frequency]}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={routine.isActive === false ? 'outline' : 'default'}
                            className={routine.isActive === false ? '' : 'bg-success hover:bg-success/80 text-white'}
                          >
                            {routine.isActive === false ? 'Inativa' : 'Ativa'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(routine.id)}>
                                <Pencil className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              {routine.isActive === false ? (
                                <DropdownMenuItem onClick={() => void reactivateRoutine(routine)}>
                                  <ShieldCheck className="mr-2 h-4 w-4" /> Reativar
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeletingRoutineId(routine.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Desativar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        Nenhuma rotina encontrada para o filtro informado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/60">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg">Orientação Operacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Factory className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Cadastro oficial</h3>
                <p className="text-sm text-muted-foreground">
                  Mantenha as rotinas padronizadas para gerar tarefas e relatórios sem duplicidade.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Criar uma nova rotina acrescenta o registro ao cadastro e ao fluxo operacional.</p>
              <p>• Editar permite ajustar setor, turno, frequencia e status sem duplicar nomes.</p>
              <p>• Desativar preserva o historico e remove a rotina da lista ativa do sistema.</p>
            </div>

            <div className="rounded-xl border bg-background p-4 text-sm">
              <p className="font-medium text-foreground">Resumo atual</p>
              <div className="mt-3 grid gap-2">
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="font-semibold">{totals.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ativas</span>
                  <span className="font-semibold text-emerald-600">{totals.active}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Inativas</span>
                  <span className="font-semibold text-amber-600">{totals.inactive}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={deletingRoutineId !== null} onOpenChange={(open) => !open && setDeletingRoutineId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar rotina</DialogTitle>
            <DialogDescription>
              A rotina sera desativada sem apagar o historico operacional. Se precisar, ela pode ser reativada depois pela edicao.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingRoutineId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => void deleteRoutine()} disabled={isSubmitting}>
              {isSubmitting ? 'Processando...' : 'Confirmar desativacao'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
