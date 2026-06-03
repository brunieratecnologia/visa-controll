import { useMemo, useState } from 'react'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, UserRound } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { UserPayload } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { toast } from '@/hooks/use-toast'

const emptyUser: UserPayload = {
  name: '',
  email: '',
  phone: '',
  role: 'EMPLOYEE',
  status: 'ACTIVE',
  password: '',
}

export default function Employees() {
  const { users, currentUser, addUser, updateUser, deleteUser } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<UserPayload>(emptyUser)

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.phone || '').toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [searchTerm, users],
  )

  const resetForm = () => setForm(emptyUser)

  const openCreate = (open: boolean) => {
    setIsAddOpen(open)
    if (!open) resetForm()
  }

  const openEdit = (userId: number | null) => {
    setEditingUserId(userId)
    if (userId === null) {
      resetForm()
      return
    }

    const user = users.find((item) => item.id === userId)
    if (!user) return

    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      password: '',
    })
  }

  const handleCreate = async () => {
    try {
      setIsSubmitting(true)
      const defaultPassword = await addUser(form)
      toast({
        title: 'Colaborador criado',
        description: `Senha inicial definida como ${defaultPassword}.`,
      })
      openCreate(false)
    } catch (error) {
      toast({
        title: 'Erro ao criar colaborador',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingUserId) return

    try {
      setIsSubmitting(true)
      await updateUser(editingUserId, form)
      toast({ title: 'Colaborador atualizado', description: 'As alteracoes foram salvas.' })
      openEdit(null)
    } catch (error) {
      toast({
        title: 'Erro ao atualizar colaborador',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingUserId) return

    try {
      setIsSubmitting(true)
      await deleteUser(deletingUserId)
      toast({ title: 'Colaborador removido', description: 'O registro foi desativado do sistema.' })
      setDeletingUserId(null)
    } catch (error) {
      toast({
        title: 'Erro ao remover colaborador',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formContent = (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Nome Completo</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Celular</Label>
          <Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(12) 99999-9999" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Cargo/Acesso</Label>
          <Select value={form.role} onValueChange={(value: 'ADMIN' | 'EMPLOYEE') => setForm({ ...form, role: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMPLOYEE">Funcionario</SelectItem>
              <SelectItem value="ADMIN">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(value: 'ACTIVE' | 'INACTIVE') => setForm({ ...form, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Ativo</SelectItem>
              <SelectItem value="INACTIVE">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>{editingUserId ? 'Nova senha (opcional)' : 'Senha inicial (opcional)'}</Label>
        <Input type="password" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingUserId ? 'Deixe em branco para manter' : 'Padrao: 123456'} />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Colaboradores</h2>
          <p className="text-muted-foreground">Gerencie equipe, credenciais e acesso via celular.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={openCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Colaborador</DialogTitle>
            </DialogHeader>
            {formContent}
            <DialogFooter>
              <Button variant="outline" onClick={() => openCreate(false)}>Cancelar</Button>
              <Button onClick={() => void handleCreate()} disabled={!form.name || !form.email || isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 bg-card border rounded-lg overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou celular..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0 shadow-none p-0 h-8"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ultimo Acesso</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role === 'ADMIN' ? 'Admin' : 'Operacional'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'} className={user.status === 'ACTIVE' ? 'bg-success hover:bg-success/80 text-white' : ''}>
                      {user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLogin ? format(new Date(user.lastLogin), 'dd/MM/yyyy HH:mm') : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(user.id)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={currentUser?.id === user.id}
                          onClick={() => setDeletingUserId(user.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="border rounded-lg bg-card p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Uso em Celular</h3>
              <p className="text-sm text-muted-foreground">Os colaboradores podem operar pelo navegador do telefone.</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Cadastre o celular para facilitar o suporte e identificacao da equipe.</p>
            <p>Ao editar um colaborador, voce pode redefinir a senha sem recriar o usuario.</p>
            <p>A remocao oculta o colaborador da lista, preservando o historico dos registros.</p>
          </div>
        </div>
      </div>

      <Dialog open={editingUserId !== null} onOpenChange={(open) => !open && openEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Colaborador</DialogTitle>
          </DialogHeader>
          {formContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => openEdit(null)}>Cancelar</Button>
            <Button onClick={() => void handleUpdate()} disabled={!form.name || !form.email || isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Atualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deletingUserId !== null} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover colaborador</DialogTitle>
            <DialogDescription>Essa acao retira o colaborador da lista ativa, preservando o historico ja registrado.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUserId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={isSubmitting}>
              {isSubmitting ? 'Removendo...' : 'Confirmar remocao'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
