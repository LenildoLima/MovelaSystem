import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Hammer, Loader2, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [errorMsg, setErrorMsg] = useState('')
  
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const from = location.state?.from?.pathname || '/'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (error: any) {
      if (error.message === 'Sua conta ainda não foi ativada. Aguarde a aprovação do administrador.') {
        setErrorMsg(error.message)
      } else {
        toast({
          title: 'Erro na autenticação',
          description: error.message === 'Invalid login credentials' 
            ? 'Email ou senha incorretos.' 
            : 'Ocorreu um erro ao tentar entrar.',
          variant: 'destructive'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white shadow-2xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="bg-amber-500/10 p-3 rounded-full mb-2">
            <Hammer className="h-10 w-10 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">MovelaSystem</CardTitle>
          <CardDescription className="text-zinc-400">
            Entre com suas credenciais para acessar o painel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-amber-500 hover:bg-amber-600 font-bold" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : 'Entrar'}
              </Button>

              {errorMsg && (
                <p className="text-sm text-red-500 text-center font-medium animate-in fade-in slide-in-from-top-1">
                  {errorMsg}
                </p>
              )}

              <div className="text-center">
                <Link 
                  to="/esqueci-senha" 
                  className="text-xs text-zinc-400 hover:text-amber-500 transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </div>

            <div className="text-center pt-2 border-t border-zinc-800 mt-4">
              <Link 
                to="/cadastro" 
                className="text-xs text-zinc-500 hover:text-amber-500 transition-colors"
              >
                Não tem conta? Cadastre-se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
