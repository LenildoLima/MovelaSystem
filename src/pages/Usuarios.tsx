import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, RefreshCw, CheckCircle, XCircle, Loader2, Copy, Check } from 'lucide-react'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import type { Usuario, SolicitacaoSenha } from '@/types'

export function Usuarios() {
  const { perfil: currentUser } = useAuth()
  const { toast } = useToast()
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoSenha[]>([])
  const [loading, setLoading] = useState(true)
  
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<SolicitacaoSenha | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    if (!newPassword) return
    navigator.clipboard.writeText(newPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome')

      const { data: reqData, error: reqError } = await supabase
        .from('solicitacoes_senha')
        .select('*')
        .eq('status', 'pendente')
        .order('criado_em', { ascending: false })

      if (usersError) throw usersError
      if (reqError) throw reqError

      setUsuarios(usersData || [])
      setSolicitacoes(reqData || [])
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const toggleUsuarioAtivo = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: !currentStatus })
        .eq('id', id)

      if (error) throw error
      
      toast({ title: `Usuário ${currentStatus ? 'desativado' : 'ativado'} com sucesso!` })
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' })
    }
  }

  const changeRole = async (id: string, newRole: 'admin' | 'operador') => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ role: newRole })
        .eq('id', id)

      if (error) throw error
      
      toast({ title: 'Nível de acesso atualizado!' })
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar role', description: error.message, variant: 'destructive' })
    }
  }

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let pass = ''
    for (let i = 0; i < 8; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(pass)
    setConfirmPassword(pass)
  }

  const handleResetPassword = async () => {
    if (!selectedSolicitacao || !newPassword) return
    if (newPassword !== confirmPassword) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' })
      return
    }

    setIsResetting(true)
    try {
      // 1. Buscar userId pelo email
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', selectedSolicitacao.email)
        .single()

      if (userError || !userData) throw new Error('Usuário não encontrado')

      // 2. Chamar Edge Function
      const { error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId: userData.id, newPassword }
      })

      if (error) throw new Error(error.message || 'Erro na redefinição')

      // 3. Atualizar status da solicitação
      const { error: updateError } = await supabase
        .from('solicitacoes_senha')
        .update({ 
          status: 'resolvido',
          resolvido_em: new Date().toISOString()
        })
        .eq('id', selectedSolicitacao.id)

      if (updateError) throw updateError

      toast({ title: 'Senha redefinida com sucesso!' })
      setResetModalOpen(false)
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro ao redefinir senha', description: error.message, variant: 'destructive' })
    } finally {
      setIsResetting(false)
    }
  }

  if (loading && usuarios.length === 0) return <div className="p-8 text-zinc-400">Carregando usuários...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
      </div>

      {/* Seção 1 — Solicitações Pendentes */}
      {solicitacoes.length > 0 && (
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-amber-500">
              <RefreshCw className="mr-2 h-5 w-5" />
              Solicitações de Nova Senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {solicitacoes.map(req => (
                <div key={req.id} className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                  <div>
                    <h3 className="font-semibold text-white">{req.nome}</h3>
                    <p className="text-sm text-zinc-400">{req.email}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(req.criado_em).toLocaleDateString()} às {new Date(req.criado_em).toLocaleTimeString()}
                    </p>
                  </div>
                  <Button 
                    onClick={() => { setSelectedSolicitacao(req); setResetModalOpen(true); setNewPassword(''); setConfirmPassword('') }}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-8"
                  >
                    Redefinir Senha
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção 2 — Lista de Usuários */}
      <div className="rounded-md border border-zinc-800 bg-zinc-900 overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-zinc-950">
            <TableRow className="border-zinc-800 hover:bg-zinc-950">
              <TableHead className="text-zinc-400 py-4 px-6">Nome</TableHead>
              <TableHead className="text-zinc-400 py-4 px-6">Email</TableHead>
              <TableHead className="text-zinc-400 py-4 px-6">Role</TableHead>
              <TableHead className="text-zinc-400 py-4 px-6">Status</TableHead>
              <TableHead className="text-zinc-400 py-4 px-6 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map(user => (
              <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <TableCell className="font-medium text-white py-4 px-6">{user.nome}</TableCell>
                <TableCell className="text-zinc-400 py-4 px-6">{user.email}</TableCell>
                <TableCell className="py-4 px-6">
                  <Select 
                    defaultValue={user.role} 
                    onValueChange={(val) => changeRole(user.id, val as 'admin' | 'operador')}
                    disabled={currentUser?.id === user.id}
                  >
                    <SelectTrigger className="w-32 bg-zinc-950 border-zinc-800 h-8 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="py-4 px-6">
                  <Badge className={user.ativo ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right py-4 px-6">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className={user.ativo ? 'text-rose-500 border-rose-500/20 hover:bg-rose-500/10' : 'text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10'}
                      disabled={currentUser?.id === user.id}
                      onClick={() => toggleUsuarioAtivo(user.id, user.ativo)}
                    >
                      {user.ativo ? <XCircle className="h-4 w-4 mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                      {user.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal Redefinir Senha */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle>Redefinir Senha de {selectedSolicitacao?.nome}</DialogTitle>
            <p className="text-sm text-zinc-400">Você definirá uma senha temporária em nome deste usuário.</p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nova Senha Temporária</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                <Button 
                  type="button" 
                  variant="outline" 
                  className="bg-zinc-950 border-zinc-800 hover:bg-zinc-800 w-28 whitespace-nowrap text-white"
                  onClick={copyToClipboard}
                  disabled={!newPassword}
                >
                  {copied ? (
                    <><Check className="mr-2 h-4 w-4 text-emerald-500" /> Copiado!</>
                  ) : (
                    <><Copy className="mr-2 h-4 w-4" /> Copiar</>
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
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
              type="button"
              variant="outline"
              onClick={generateRandomPassword}
              className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Gerar Senha Aleatória
            </Button>
          </div>
          <DialogFooter className="flex gap-2 justify-end sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetModalOpen(false)}
              className="bg-zinc-950 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResetPassword}
              className="bg-amber-500 hover:bg-amber-600 font-bold"
              disabled={isResetting || !newPassword}
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
