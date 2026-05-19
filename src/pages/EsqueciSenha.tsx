import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Hammer, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Verificar se o email existe na tabela usuarios
      const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('nome')
        .eq('email', email)
        .single()

      if (userError || !user) {
        toast({
          title: 'Email não encontrado',
          description: 'Email não encontrado no sistema',
          variant: 'destructive'
        })
        return
      }

      // 2. Inserir solicitação
      const { error: insertError } = await supabase
        .from('solicitacoes_senha')
        .insert({
          email,
          nome: user.nome
        })

      if (insertError) throw insertError

      setIsSuccess(true)

    } catch (error: any) {
      toast({
        title: 'Erro ao enviar solicitação',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white shadow-2xl">
          <CardHeader className="space-y-4 flex flex-col items-center pt-8">
            <div className="bg-amber-500/10 p-3 rounded-full mb-2">
              <Hammer className="h-10 w-10 text-amber-500" />
            </div>
            <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
            <CardTitle className="text-2xl font-bold tracking-tight text-center text-white">Solicitação Enviada!</CardTitle>
            <CardDescription className="text-zinc-400 text-center text-base">
              Sua solicitação foi enviada com sucesso. O administrador do sistema irá redefinir sua senha e te informará a nova senha em breve.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button 
              onClick={() => navigate('/login')}
              className="bg-amber-500 hover:bg-amber-600 font-bold"
            >
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white shadow-2xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="bg-amber-500/10 p-3 rounded-full mb-2">
            <Hammer className="h-10 w-10 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Recuperar Senha</CardTitle>
          <CardDescription className="text-zinc-400">
            Digite seu email para solicitar uma nova senha ao admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-amber-500 hover:bg-amber-600 font-bold" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : 'Enviar Solicitação'}
            </Button>

            <div className="text-center pt-2">
              <Link 
                to="/login" 
                className="inline-flex items-center text-xs text-zinc-500 hover:text-amber-500 transition-colors"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Voltar ao login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
