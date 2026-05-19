import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Loader2, User as UserIcon, Lock } from 'lucide-react'

export function Perfil() {
  const { perfil, user } = useAuth()
  const { toast } = useToast()

  const [nome, setNome] = useState(perfil?.nome || '')
  const [email, setEmail] = useState(user?.email || '')
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isSavingInfo, setIsSavingInfo] = useState(false)
  const [isChangingPass, setIsChangingPass] = useState(false)

  useEffect(() => {
    if (perfil?.nome) setNome(perfil.nome)
    if (user?.email) setEmail(user.email)
  }, [perfil, user])

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingInfo(true)
    
    try {
      if (email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email })
        if (emailError) throw emailError
      }

      if (nome !== perfil?.nome) {
        const { error: dbError } = await supabase
          .from('usuarios')
          .update({ nome })
          .eq('id', user?.id)
        if (dbError) throw dbError
      }

      toast({
        title: 'Sucesso',
        description: 'Informações atualizadas com sucesso. Se você alterou o e-mail, será necessário confirmá-lo.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsSavingInfo(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword.length < 6) {
      toast({
        title: 'Erro de validação',
        description: 'A nova senha deve ter no mínimo 6 caracteres.',
        variant: 'destructive'
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro de validação',
        description: 'As senhas não conferem.',
        variant: 'destructive'
      })
      return
    }

    setIsChangingPass(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Sua senha foi alterada com sucesso.',
      })
      
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast({
        title: 'Erro ao alterar senha',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsChangingPass(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Meu Perfil</h2>
        <p className="text-zinc-400">Gerencie suas informações pessoais e credenciais de acesso.</p>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <UserIcon className="h-5 w-5 text-amber-500" />
              <CardTitle>Informações Pessoais</CardTitle>
            </div>
            <CardDescription className="text-zinc-400">
              Atualize as informações principais do seu login administrado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input 
                  id="nome" 
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 font-bold mt-2 text-white" 
                disabled={isSavingInfo}
              >
                {isSavingInfo ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                ) : 'Salvar Alterações'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-5 w-5 text-amber-500" />
              <CardTitle>Alterar Senha</CardTitle>
            </div>
            <CardDescription className="text-zinc-400">
              Defina a sua senha definitiva ou atualize sua proteção atual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha (mínimo 6 caracteres)</Label>
                <div className="relative">
                  <Input 
                    id="newPassword" 
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 pr-10"
                    required
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
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 pr-10"
                    required
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
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 font-bold mt-2 text-white" 
                disabled={isChangingPass}
              >
                {isChangingPass ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Alterando...</>
                ) : 'Alterar senha'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
