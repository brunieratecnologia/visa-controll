import { useMemo, useState } from 'react'
import { Plus, Check, Camera, Image as ImageIcon } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'

export default function Issues() {
  const { issues, addIssue, resolveIssue, currentUser } = useAppStore()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isResolveOpen, setIsResolveOpen] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newIssue, setNewIssue] = useState({
    description: '',
    category: 'EQUIPMENT' as const,
    photo: null as File | null,
  })
  const [resolveAction, setResolveAction] = useState('')
  const [resolvePhoto, setResolvePhoto] = useState<File | null>(null)

  const previewUrl = useMemo(() => (newIssue.photo ? URL.createObjectURL(newIssue.photo) : ''), [newIssue.photo])
  const resolutionPreviewUrl = useMemo(() => (resolvePhoto ? URL.createObjectURL(resolvePhoto) : ''), [resolvePhoto])

  const handleAdd = async () => {
    try {
      setIsSubmitting(true)
      await addIssue({ ...newIssue, status: 'OPEN' })
      setIsAddOpen(false)
      setNewIssue({ description: '', category: 'EQUIPMENT', photo: null })
      toast({ title: 'Ocorrência registrada', description: 'O problema foi salvo com sucesso.' })
    } catch (error) {
      toast({
        title: 'Erro ao registrar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResolve = async () => {
    if (!isResolveOpen) return

    try {
      setIsSubmitting(true)
      await resolveIssue(isResolveOpen, { action: resolveAction, photo: resolvePhoto })
      setIsResolveOpen(null)
      setResolveAction('')
      setResolvePhoto(null)
      toast({ title: 'Ocorrência resolvida', description: 'A ação corretiva foi registrada.' })
    } catch (error) {
      toast({
        title: 'Erro ao resolver',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-destructive">Não Conformidades</h2>
          <p className="text-muted-foreground">Registro de problemas encontrados nas instalações, com foto opcional.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Plus className="mr-2 h-4 w-4" /> Reportar Problema
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
            <DialogTitle>Nova Não Conformidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={newIssue.category}
                  onValueChange={(value: 'EPI' | 'EQUIPMENT' | 'CLEANING' | 'OTHER') =>
                    setNewIssue({ ...newIssue, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EQUIPMENT">Equipamento/Maquina</SelectItem>
                    <SelectItem value="EPI">Falta de EPI</SelectItem>
                    <SelectItem value="CLEANING">Defeito de Limpeza</SelectItem>
                    <SelectItem value="OTHER">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descricao do Problema</Label>
                <Textarea
                  placeholder="Descreva detalhadamente..."
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Camera className="h-4 w-4" /> Foto do evento</Label>
                <Input type="file" accept="image/*" capture="environment" onChange={(e) => setNewIssue({ ...newIssue, photo: e.target.files?.[0] || null })} />
                {previewUrl && <img src={previewUrl} alt="Preview da ocorrencia" className="h-40 w-full rounded-md object-cover border" />}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => void handleAdd()} disabled={!newIssue.description || isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Registrar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {issues.map((issue) => (
          <Card key={issue.id} className={issue.status === 'OPEN' ? 'border-destructive/50' : 'opacity-85'}>
            <CardContent className="p-4 sm:p-6 flex flex-col gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={issue.status === 'OPEN' ? 'destructive' : 'secondary'}>
                    {issue.status === 'OPEN' ? 'Pendente' : 'Resolvido'}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">ID: #{issue.id}</span>
                </div>
                <h3 className="font-semibold text-lg">{issue.description}</h3>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  <span>Reportado por: {issue.reportedBy}</span>
                  <span>Em: {format(new Date(issue.reportedAt), 'dd/MM/yyyy HH:mm')}</span>
                  <span>Categoria: {issue.category}</span>
                </div>
              </div>

              {(issue.photoUrl || issue.resolutionPhotoUrl) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {issue.photoUrl && (
                    <a href={issue.photoUrl} target="_blank" rel="noreferrer" className="block">
                      <img src={issue.photoUrl} alt="Foto da ocorrencia" className="h-44 w-full rounded-md object-cover border" />
                    </a>
                  )}
                  {issue.resolutionPhotoUrl && (
                    <a href={issue.resolutionPhotoUrl} target="_blank" rel="noreferrer" className="block">
                      <img src={issue.resolutionPhotoUrl} alt="Foto da resolucao" className="h-44 w-full rounded-md object-cover border" />
                    </a>
                  )}
                </div>
              )}

              {issue.status === 'RESOLVED' && (
                <div className="p-3 bg-muted rounded-md text-sm border-l-2 border-success">
                  <strong>Ação Corretiva:</strong> {issue.action}
                </div>
              )}

              {issue.status === 'OPEN' && currentUser?.role === 'ADMIN' && (
                <div className="flex items-center shrink-0">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsResolveOpen(issue.id)}>
                    Resolver
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!isResolveOpen} onOpenChange={(open) => !open && setIsResolveOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolver Não Conformidade</DialogTitle>
            <DialogDescription>Descreva a acao corretiva tomada e, se desejar, anexe uma foto.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Textarea
              placeholder="Ex: Troca da borracha de vedacao realizada..."
              value={resolveAction}
              onChange={(e) => setResolveAction(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Foto da resolucao</Label>
              <Input type="file" accept="image/*" capture="environment" onChange={(e) => setResolvePhoto(e.target.files?.[0] || null)} />
              {resolutionPreviewUrl && <img src={resolutionPreviewUrl} alt="Preview da resolucao" className="h-40 w-full rounded-md object-cover border" />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveOpen(null)}>Cancelar</Button>
            <Button onClick={() => void handleResolve()} className="bg-success hover:bg-success/90 text-white" disabled={!resolveAction || isSubmitting}>
              <Check className="mr-2 h-4 w-4" /> {isSubmitting ? 'Salvando...' : 'Marcar Resolvido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
