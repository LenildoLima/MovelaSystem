import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Hammer, Loader2, Eye, EyeOff, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function Cadastro() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast({
        title: 'Erro no cadastro',
        description: 'As senhas não conferem',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: nome
          }
        }
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // Tentativa de inserção manual na tabela de usuários
        // Isso garante a criação do perfil mesmo que o trigger do banco falhe ou não exista
        const { error: profileError } = await supabase
          .from('usuarios')
          .insert({
            id: data.user.id,
            nome: nome,
            email: email,
            role: 'operador',
            ativo: false
          })

        if (profileError) {
          console.error('Erro ao criar perfil na tabela usuarios:', profileError)
          // Se for erro de permissão (RLS), o usuário no Auth ainda foi criado
        }
      }

      setIsSuccess(true)
    } catch (error: any) {
      toast({
        title: 'Erro no cadastro',
        description: error.message,
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
            <Clock className="h-16 w-16 text-amber-500 mb-4" />
            <CardTitle className="text-2xl font-bold tracking-tight text-center text-white">Cadastro Realizado!</CardTitle>
            <CardDescription className="text-zinc-400 text-center text-base">
              Seu cadastro foi criado com sucesso! Aguarde a ativação da sua conta pelo administrador do sistema. Você receberá as instruções de acesso em breve.
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
          <CardTitle className="text-2xl font-bold tracking-tight">Crie sua conta</CardTitle>
          <CardDescription className="text-zinc-400">
            Preencha os dados abaixo para se cadastrar no MovelaSystem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCadastro} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input 
                id="nome" 
                placeholder="Seu nome" 
                required 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500"
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"}
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-amber-500 hover:bg-amber-600 font-bold" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : 'Criar Conta'}
            </Button>

            <div className="text-center pt-2">
              <Link 
                to="/login" 
                className="text-xs text-zinc-500 hover:text-amber-500 transition-colors"
              >
                Já tem conta? Entrar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
