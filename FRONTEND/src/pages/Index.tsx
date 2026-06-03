import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function Index() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAppStore()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({ title: 'Erro', description: 'Preencha todos os campos.', variant: 'destructive' })
      return
    }

    try {
      setIsLoading(true)
      await login(email, password)
      navigate('/dashboard')
    } catch (error) {
      toast({
        title: 'Falha no acesso',
        description: error instanceof Error ? error.message : 'Não foi possível autenticar.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-primary/5 -skew-y-6 transform origin-top-left -z-10"></div>

      <div className="w-full max-w-md px-4 animate-slide-up">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-16 w-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">MHMIXX VISA CONTROLL</h1>
          <p className="text-muted-foreground mt-2 font-medium">Gestão sanitária inteligente</p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <CardHeader>
            <CardTitle>Acesso ao Sistema</CardTitle>
            <CardDescription>Insira suas credenciais para continuar.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@mhmixxx.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                <strong>Acesso inicial:</strong> use `admin@mhmixxx.com`, `joao@mhmixxx.com` ou
                `maria@mhmixxx.com` com a senha `123456`.
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full h-12 text-md" disabled={isLoading}>
                {isLoading ? 'Autenticando...' : 'Entrar'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
