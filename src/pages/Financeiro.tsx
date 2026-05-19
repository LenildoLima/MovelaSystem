import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription,
} from '@/components/ui/dialog'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DollarSign, 
  Lock, 
  CheckCircle,
  Receipt,
  PlusCircle, 
  MinusCircle, 
  User,
  FileText,
  ArrowUpToLine, 
  History 
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Caixa = {
  id: string
  usuario_id: string
  usuario_nome: string
  status: 'aberto' | 'fechado'
  valor_abertura: number
  valor_fechamento: number | null
  total_entradas: number
  total_suprimentos: number
  total_sangrias: number
  diferenca: number | null
  observacoes: string | null
  aberto_em: string
  fechado_em: string | null
}

type Movimentacao = {
  id: string
  caixa_id: string
  usuario_id: string
  usuario_nome: string
  tipo: 'entrada' | 'sangria' | 'suprimento'
  valor: number
  descricao: string
  criado_em: string
}

export function Financeiro() {
  const { user, perfil } = useAuth()
  const { toast } = useToast()

  const [caixaAtivo, setCaixaAtivo] = useState<Caixa | null>(null)
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [historico, setHistorico] = useState<Caixa[]>([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [isAbrirCaixaOpen, setIsAbrirCaixaOpen] = useState(false)
  const [isMovimentacaoOpen, setIsMovimentacaoOpen] = useState(false)
  const [isFecharCaixaOpen, setIsFecharCaixaOpen] = useState(false)
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'entrada' | 'sangria' | 'suprimento'>('entrada')

  const [isReceberModalOpen, setIsReceberModalOpen] = useState(false)
  const [ordensPendentesRecebimento, setOrdensPendentesRecebimento] = useState<any[]>([])
  const [selectedOrdemRecebimento, setSelectedOrdemRecebimento] = useState<any | null>(null)
  const [valorRecebimento, setValorRecebimento] = useState('')
  const [obsRecebimento, setObsRecebimento] = useState('')
  const [loadingOrdens, setLoadingOrdens] = useState(false)

  // Forms state
  const [valorAbertura, setValorAbertura] = useState('')
  const [obsAbertura, setObsAbertura] = useState('')
  
  const [valorMovimentacao, setValorMovimentacao] = useState('')
  const [descMovimentacao, setDescMovimentacao] = useState('')

  const [valorFechamento, setValorFechamento] = useState('')
  const [obsFechamento, setObsFechamento] = useState('')

  useEffect(() => {
    fetchCaixaData()
  }, [])

  const fetchCaixaData = async () => {
    setLoading(true)
    try {
      // Fetch open caixa
      const { data: caixaAbertoData, error: caixaAbertoError } = await supabase
        .from('caixas')
        .select('*')
        .eq('status', 'aberto')
        .limit(1)
        .maybeSingle()
      
      if (caixaAbertoError && caixaAbertoError.code !== 'PGRST116') throw caixaAbertoError

      setCaixaAtivo(caixaAbertoData || null)

      // Se tiver caixa aberto, busca as movimentacoes
      if (caixaAbertoData) {
        const { data: movData, error: movError } = await supabase
          .from('caixa_movimentacoes')
          .select('*')
          .eq('caixa_id', caixaAbertoData.id)
          .order('criado_em', { ascending: false })
        if (movError) throw movError
        setMovimentacoes(movData || [])
      } else {
        setMovimentacoes([])
      }

      // Buscar historico de ultimos 10 fechados
      const { data: histData, error: histError } = await supabase
        .from('caixas')
        .select('*')
        .eq('status', 'fechado')
        .order('fechado_em', { ascending: false })
        .limit(10)
      if (histError) throw histError
      setHistorico(histData || [])
      
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do caixa.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAbrirCaixa = async () => {
    if (!valorAbertura) return
    const valor = parseFloat(valorAbertura.replace(',', '.'))
    if (isNaN(valor)) return

    try {
      if (caixaAtivo) {
        throw new Error('Já existe um caixa aberto.')
      }

      const payload = {
        usuario_id: user?.id,
        usuario_nome: perfil?.nome,
        status: 'aberto',
        valor_abertura: valor,
        observacoes: obsAbertura,
      }

      const { error } = await supabase.from('caixas').insert(payload)
      
      if (error) throw error

      toast({
        title: 'Caixa Aberto',
        description: 'Caixa aberto com sucesso!',
      })
      
      setIsAbrirCaixaOpen(false)
      setValorAbertura('')
      setObsAbertura('')
      fetchCaixaData()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao abrir caixa.',
        variant: 'destructive',
      })
    }
  }

  const handleMovimentacao = async () => {
    if (!caixaAtivo || !valorMovimentacao || !descMovimentacao) return
    const valorNum = parseFloat(valorMovimentacao.replace(',', '.'))
    if (isNaN(valorNum) || valorNum <= 0) return

    try {
      const payload = {
        caixa_id: caixaAtivo.id,
        usuario_id: user?.id,
        usuario_nome: perfil?.nome,
        tipo: tipoMovimentacao,
        valor: valorNum,
        descricao: descMovimentacao
      }

      const { error } = await supabase.from('caixa_movimentacoes').insert(payload)
      if (error) throw error

      toast({
        title: 'Sucesso',
        description: 'Movimentação registrada!',
      })
      
      setIsMovimentacaoOpen(false)
      setValorMovimentacao('')
      setDescMovimentacao('')
      
      fetchCaixaData() // Atualiza os dados (isso poderia ser otimizado pra nao buscar historico de novo, mas atende a regra de negocio solicitada)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao registrar movimentação.',
        variant: 'destructive',
      })
    }
  }

  const handleFecharCaixa = async () => {
    if (!caixaAtivo) return
    const valorFisico = parseFloat(valorFechamento.replace(',', '.'))
    if (isNaN(valorFisico)) return

    try {
      const totalEntradas = movimentacoes.filter(m => m.tipo === 'entrada').reduce((acc, curr) => acc + curr.valor, 0)
      const totalSuprimentos = movimentacoes.filter(m => m.tipo === 'suprimento').reduce((acc, curr) => acc + curr.valor, 0)
      const totalSangrias = movimentacoes.filter(m => m.tipo === 'sangria').reduce((acc, curr) => acc + curr.valor, 0)
      
      const saldoCalculado = caixaAtivo.valor_abertura + totalEntradas + totalSuprimentos - totalSangrias
      const diferenca = valorFisico - saldoCalculado

      const payload = {
        status: 'fechado',
        valor_fechamento: valorFisico,
        total_entradas: totalEntradas,
        total_suprimentos: totalSuprimentos,
        total_sangrias: totalSangrias,
        diferenca,
        observacoes: obsFechamento,
        fechado_em: new Date().toISOString()
      }

      const { error } = await supabase.from('caixas').update(payload).eq('id', caixaAtivo.id)
      if (error) throw error

      toast({
        title: 'Caixa Fechado',
        description: 'Fluxo de caixa encerrado com sucesso!',
      })
      
      setIsFecharCaixaOpen(false)
      setValorFechamento('')
      setObsFechamento('')
      fetchCaixaData()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao fechar caixa.',
        variant: 'destructive',
      })
    }
  }

  const handleAbrirReceberModal = async () => {
    setIsReceberModalOpen(true)
    setLoadingOrdens(true)
    setSelectedOrdemRecebimento(null)
    setValorRecebimento('')
    setObsRecebimento('')

    try {
      const { data, error } = await supabase
        .from('ordens_producao')
        .select('*, produtos(*), clientes(*)')
        .eq('status', 'concluido')
        .eq('pago', false)
        .order('data_conclusao', { ascending: false })

      if (error) throw error
      setOrdensPendentesRecebimento(data || [])
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Falha ao buscar ordens pendentes.' })
    } finally {
      setLoadingOrdens(false)
    }
  }

  const handleConfirmarRecebimento = async () => {
    if (!caixaAtivo || !selectedOrdemRecebimento) return
    const valorNum = parseFloat(valorRecebimento.replace(',', '.'))
    if (isNaN(valorNum) || valorNum <= 0) return

    try {
      const nomeProduto = Array.isArray(selectedOrdemRecebimento.produtos) ? selectedOrdemRecebimento.produtos[0]?.nome : selectedOrdemRecebimento.produtos?.nome
      const nomeP = nomeProduto || selectedOrdemRecebimento.produto?.nome || 'Produto'
      const nomeCliente = Array.isArray(selectedOrdemRecebimento.clientes) ? selectedOrdemRecebimento.clientes[0]?.nome : selectedOrdemRecebimento.clientes?.nome
      const nomeC = nomeCliente || selectedOrdemRecebimento.cliente?.nome || 'Cliente'
      
      let descricao = `Recebimento: ${nomeP} - ${nomeC}`
      if (obsRecebimento) {
        descricao += ` (${obsRecebimento})`
      }

      const payloadMov = {
        caixa_id: caixaAtivo.id,
        usuario_id: user?.id,
        usuario_nome: perfil?.nome,
        tipo: 'entrada',
        valor: valorNum,
        descricao
      }
      const { error: errorMov } = await supabase.from('caixa_movimentacoes').insert(payloadMov)
      if (errorMov) throw errorMov

      const { error: errorOrdem } = await supabase.from('ordens_producao').update({ pago: true }).eq('id', selectedOrdemRecebimento.id)
      if (errorOrdem) throw errorOrdem

      toast({
        title: 'Sucesso',
        description: 'Recebimento registrado com sucesso!',
      })
      
      setIsReceberModalOpen(false)
      fetchCaixaData()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Falha ao registrar recebimento.', variant: 'destructive' })
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const formatHora = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatData = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (loading) {
    return <div className="p-8 text-zinc-400">Carregando dados do caixa...</div>
  }

  // Derived calculations for active caixa
  const totEntradas = movimentacoes.filter(m => m.tipo === 'entrada').reduce((acc, curr) => acc + curr.valor, 0)
  const totSuprimentos = movimentacoes.filter(m => m.tipo === 'suprimento').reduce((acc, curr) => acc + curr.valor, 0)
  const totSangrias = movimentacoes.filter(m => m.tipo === 'sangria').reduce((acc, curr) => acc + curr.valor, 0)
  
  const saldoAtual = caixaAtivo ? caixaAtivo.valor_abertura + totEntradas + totSuprimentos - totSangrias : 0

  // Fechamento diff calculations
  const valFech = parseFloat(valorFechamento.replace(',', '.') || '0')
  const valDiff = valFech - saldoAtual

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Módulo de Caixa</h1>
      </div>

      {!caixaAtivo ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center p-12 min-h-[400px]">
            <div className="bg-amber-500/10 p-4 rounded-full mb-4">
              <DollarSign className="h-12 w-12 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Nenhum caixa aberto</h2>
            <p className="text-zinc-400 mb-8 max-w-sm text-center">
              Abra o caixa para começar a registrar as movimentações financeiras do dia.
            </p>
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold h-12 px-8 rounded-lg"
              onClick={() => setIsAbrirCaixaOpen(true)}
            >
              <Lock className="mr-2 h-4 w-4" />
              Abrir Caixa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl">Caixa Aberto</CardTitle>
                  <Badge className="bg-emerald-500 hover:bg-emerald-600">Ativo</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-400 mt-2">
                  <span className="flex items-center gap-1">
                    <History className="h-4 w-4" /> Aberto em: {new Date(caixaAtivo.aberto_em).toLocaleDateString('pt-BR')} às {new Date(caixaAtivo.aberto_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" /> Op: {caixaAtivo.usuario_nome}
                  </span>
                </div>
              </div>
              <Button 
                variant="destructive" 
                className="font-semibold"
                onClick={() => setIsFecharCaixaOpen(true)}
              >
                <Lock className="mr-2 h-4 w-4" />
                Fechar Caixa
              </Button>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col gap-1">
                  <span className="text-xs font-medium text-zinc-400">Valor de Abertura</span>
                  <span className="text-xl font-bold text-blue-500">{formatCurrency(caixaAtivo.valor_abertura)}</span>
                </div>
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col gap-1">
                  <span className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                    <PlusCircle className="h-3 w-3 text-emerald-500" /> Total Entradas
                  </span>
                  <span className="text-xl font-bold text-emerald-500">{formatCurrency(totEntradas)}</span>
                </div>
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col gap-1">
                  <span className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                    <MinusCircle className="h-3 w-3 text-rose-500" /> Total Sangrias
                  </span>
                  <span className="text-xl font-bold text-rose-500">{formatCurrency(totSangrias)}</span>
                </div>
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col gap-1">
                  <span className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                    <ArrowUpToLine className="h-3 w-3 text-amber-500" /> Total Suprimentos
                  </span>
                  <span className="text-xl font-bold text-amber-500">{formatCurrency(totSuprimentos)}</span>
                </div>
              </div>

              <div className="flex flex-col items-center p-6 rounded-xl bg-zinc-950 border border-zinc-800 mb-8">
                <span className="text-sm font-medium text-zinc-400 mb-1">Saldo Atual em Caixa</span>
                <span className="text-4xl font-black text-amber-500">{formatCurrency(saldoAtual)}</span>
              </div>

              <div className="flex flex-wrap gap-4 border-t border-zinc-800 pt-6">
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  onClick={() => { setTipoMovimentacao('entrada'); setIsMovimentacaoOpen(true) }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> + Entrada
                </Button>
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  onClick={handleAbrirReceberModal}
                >
                  <Receipt className="mr-2 h-4 w-4" /> + Receber Ordem
                </Button>
                <Button 
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                  onClick={() => { setTipoMovimentacao('sangria'); setIsMovimentacaoOpen(true) }}
                >
                  <MinusCircle className="mr-2 h-4 w-4" /> - Sangria
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  onClick={() => { setTipoMovimentacao('suprimento'); setIsMovimentacaoOpen(true) }}
                >
                  <ArrowUpToLine className="mr-2 h-4 w-4" /> + Suprimento
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-zinc-400" />
                Movimentações deste Caixa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-zinc-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 bg-zinc-950">
                      <TableHead className="text-zinc-400 w-[100px]">Hora</TableHead>
                      <TableHead className="text-zinc-400 w-[150px]">Tipo</TableHead>
                      <TableHead className="text-zinc-400">Descrição</TableHead>
                      <TableHead className="text-zinc-400 text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentacoes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-zinc-500 italic">
                          Nenhuma movimentação registrada.
                        </TableCell>
                      </TableRow>
                    ) : movimentacoes.map((m) => (
                      <TableRow key={m.id} className="border-zinc-800">
                        <TableCell className="font-medium text-zinc-300">
                          {formatHora(m.criado_em)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "capitalize",
                              m.tipo === 'entrada' && "border-emerald-500 text-emerald-500",
                              m.tipo === 'sangria' && "border-rose-500 text-rose-500",
                              m.tipo === 'suprimento' && "border-blue-500 text-blue-500"
                            )}
                          >
                            {m.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-300">{m.descricao}</TableCell>
                        <TableCell className={cn(
                          "text-right font-bold",
                          (m.tipo === 'entrada' || m.tipo === 'suprimento') ? 'text-emerald-500' : 'text-rose-500'
                        )}>
                          {(m.tipo === 'sangria' ? '-' : '+')} {formatCurrency(m.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Histórico de Caixas (Aparece sempre) */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <History className="h-6 w-6 text-zinc-400" />
          Histórico de Caixas (Últimos 10)
        </h2>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 bg-zinc-950">
                    <TableHead className="text-zinc-400">Abertura / Fechamento</TableHead>
                    <TableHead className="text-zinc-400">Operador</TableHead>
                    <TableHead className="text-zinc-400 text-right">Abertura</TableHead>
                    <TableHead className="text-zinc-400 text-right">Entradas</TableHead>
                    <TableHead className="text-zinc-400 text-right">Sangrias</TableHead>
                    <TableHead className="text-zinc-400 text-right">Saldo Prev.</TableHead>
                    <TableHead className="text-zinc-400 text-right">Dinheiro Físico</TableHead>
                    <TableHead className="text-zinc-400 text-right">Diferença</TableHead>
                    <TableHead className="text-zinc-400 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-zinc-500 italic">
                        Nenhum histórico de caixa fechado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    historico.map(h => {
                      const saldoPrev = h.valor_abertura + h.total_entradas + h.total_suprimentos - h.total_sangrias
                      return (
                        <TableRow key={h.id} className="border-zinc-800">
                          <TableCell className="font-medium whitespace-nowrap space-y-1">
                            <div className="flex items-center text-emerald-500 text-xs gap-1">
                              INÍCIO: {new Date(h.aberto_em).toLocaleDateString('pt-BR')} {new Date(h.aberto_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {h.fechado_em && (
                              <div className="flex items-center text-rose-500 text-xs gap-1">
                                FIM: {new Date(h.fechado_em).toLocaleDateString('pt-BR')} {new Date(h.fechado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-zinc-300">{h.usuario_nome}</TableCell>
                          <TableCell className="text-right text-blue-500">{formatCurrency(h.valor_abertura)}</TableCell>
                          <TableCell className="text-right text-emerald-500">{formatCurrency(h.total_entradas)}</TableCell>
                          <TableCell className="text-right text-rose-500">{formatCurrency(h.total_sangrias)}</TableCell>
                          <TableCell className="text-right text-amber-500 font-semibold">{formatCurrency(saldoPrev)}</TableCell>
                          <TableCell className="text-right font-bold text-zinc-200">{formatCurrency(h.valor_fechamento || 0)}</TableCell>
                          
                          <TableCell className={cn(
                            "text-right font-bold",
                            (h.diferenca || 0) > 0 ? "text-emerald-500" : (h.diferenca || 0) < 0 ? "text-rose-500" : "text-zinc-400"
                          )}>
                            {formatCurrency(h.diferenca || 0)}
                          </TableCell>

                          <TableCell className="text-right">
                            <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                              Fechado
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------ DISALOGS ------ */}

      {/* MODAL ABRIR CAIXA */}
      <Dialog open={isAbrirCaixaOpen} onOpenChange={setIsAbrirCaixaOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-500" />
              Abrir Caixa
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Informe o valor que você tem em mãos para começar o caixa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="valor">Valor de Abertura (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="Ex: 100.00"
                value={valorAbertura}
                onChange={e => setValorAbertura(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="obs">Observações (opcional)</Label>
              <Input
                id="obs"
                placeholder="Alguma nota sobre a abertura?"
                value={obsAbertura}
                onChange={e => setObsAbertura(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAbrirCaixaOpen(false)} className="border-zinc-700 text-zinc-300">
              Cancelar
            </Button>
            <Button onClick={handleAbrirCaixa} className="bg-amber-500 hover:bg-amber-600 text-black">
              Confirmar Abertura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL MOVIMENTACAO */}
      <Dialog open={isMovimentacaoOpen} onOpenChange={setIsMovimentacaoOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className={cn(
              "flex items-center gap-2 capitalize",
              tipoMovimentacao === 'entrada' && "text-emerald-500",
              tipoMovimentacao === 'sangria' && "text-rose-500",
              tipoMovimentacao === 'suprimento' && "text-blue-500" 
            )}>
              {tipoMovimentacao === 'entrada' && <PlusCircle className="w-5 h-5" />}
              {tipoMovimentacao === 'sangria' && <MinusCircle className="w-5 h-5" />}
              {tipoMovimentacao === 'suprimento' && <ArrowUpToLine className="w-5 h-5" />}
              {tipoMovimentacao}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Preencha os detalhes para registrar no caixa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="descMov">Descrição</Label>
              <Input
                id="descMov"
                placeholder="Motivo da movimentação"
                value={descMovimentacao}
                onChange={e => setDescMovimentacao(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="valMov">Valor (R$)</Label>
              <Input
                id="valMov"
                type="number"
                step="0.01"
                placeholder="Ex: 50.00"
                value={valorMovimentacao}
                onChange={e => setValorMovimentacao(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMovimentacaoOpen(false)} className="border-zinc-700 text-zinc-300">
              Cancelar
            </Button>
            <Button 
              onClick={handleMovimentacao} 
              className={cn(
                "text-white",
                tipoMovimentacao === 'entrada' && "bg-emerald-600 hover:bg-emerald-700",
                tipoMovimentacao === 'sangria' && "bg-rose-600 hover:bg-rose-700",
                tipoMovimentacao === 'suprimento' && "bg-blue-600 hover:bg-blue-700" 
              )}
            >
              Registrar {tipoMovimentacao}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL FECHAR CAIXA */}
      <Dialog open={isFecharCaixaOpen} onOpenChange={setIsFecharCaixaOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <Lock className="w-5 h-5" />
              Fechamento de Caixa
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Realize a contagem do dinheiro e encerre as atividades.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-sm bg-zinc-900/50 p-4 rounded-lg my-2 border border-zinc-800">
            <div className="flex justify-between">
              <span className="text-zinc-400">Valor de Abertura:</span>
              <span className="font-semibold">{formatCurrency(caixaAtivo?.valor_abertura || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-500">Total Entradas:</span>
              <span className="font-semibold text-emerald-500">+{formatCurrency(totEntradas)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-rose-500">Total Sangrias:</span>
              <span className="font-semibold text-rose-500">-{formatCurrency(totSangrias)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-500">Total Suprimentos:</span>
              <span className="font-semibold text-blue-500">+{formatCurrency(totSuprimentos)}</span>
            </div>
            <hr className="border-zinc-800" />
            <div className="flex justify-between text-base">
              <span className="text-zinc-300 font-bold">Saldo Calculado:</span>
              <span className="font-bold text-amber-500">{formatCurrency(saldoAtual)}</span>
            </div>
          </div>

          <div className="grid gap-4 pb-4">
            <div className="grid gap-2">
              <Label htmlFor="valorCaixa" className="text-emerald-400">Valor Fisicamente em Caixa (R$)</Label>
              <Input
                id="valorCaixa"
                type="number"
                step="0.01"
                placeholder="Insira o valor contado"
                value={valorFechamento}
                onChange={e => setValorFechamento(e.target.value)}
                className="bg-zinc-900 border-zinc-800 font-bold text-lg h-12"
              />
            </div>

            {valorFechamento !== '' && !isNaN(valFech) && (
              <div className={cn(
                "p-3 rounded flex items-center justify-center gap-2 font-bold",
                valDiff === 0 && "bg-emerald-500/20 text-emerald-500",
                valDiff > 0 && "bg-emerald-500/20 text-emerald-500",
                valDiff < 0 && "bg-rose-500/20 text-rose-500"
              )}>
                {valDiff === 0 && <><CheckCircle className="w-5 h-5"/> Caixa Conferido (Sem Diferença)</>}
                {valDiff > 0 && `Sobra de ${formatCurrency(valDiff)}`}
                {valDiff < 0 && `Falta de ${formatCurrency(Math.abs(valDiff))}`}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="obsFechamento">Observações (opcional)</Label>
              <Input
                id="obsFechamento"
                placeholder="Ocorreu algo incomum?"
                value={obsFechamento}
                onChange={e => setObsFechamento(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFecharCaixaOpen(false)} className="border-zinc-700 text-zinc-300">
              Revisar Depois
            </Button>
            <Button 
              onClick={handleFecharCaixa} 
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              disabled={valorFechamento === '' || isNaN(valFech)}
            >
              Confirmar Fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL RECEBER ORDEM */}
      <Dialog open={isReceberModalOpen} onOpenChange={setIsReceberModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-400">
              <Receipt className="w-5 h-5" />
              Receber Pagamento de Ordem
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Selecione a ordem concluída para registrar o recebimento
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {loadingOrdens ? (
              <div className="text-zinc-500 text-center py-4">Buscando ordens...</div>
            ) : ordensPendentesRecebimento.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border border-zinc-800 rounded-lg bg-zinc-900/50 text-center gap-2">
                <CheckCircle className="h-8 w-8 text-zinc-500" />
                <span className="text-zinc-400">Nenhuma ordem aguardando recebimento</span>
              </div>
            ) : (
              <div className="space-y-3">
                {ordensPendentesRecebimento.map(ordem => {
                  const nomeProduto = Array.isArray(ordem.produtos) ? ordem.produtos[0]?.nome : ordem.produtos?.nome
                  const nomeP = nomeProduto || ordem.produto?.nome || 'Produto Indefinido'
                  const nomeCliente = Array.isArray(ordem.clientes) ? ordem.clientes[0]?.nome : ordem.clientes?.nome
                  const nomeC = nomeCliente || ordem.cliente?.nome || 'Cliente Indefinido'
                  const dataOrd = ordem.data_conclusao || ordem.data_pedido || ordem.created_at
                  
                  return (
                    <div 
                      key={ordem.id} 
                      className={cn(
                        "p-3 border rounded-lg cursor-pointer transition-colors duration-200",
                        selectedOrdemRecebimento?.id === ordem.id 
                          ? "border-amber-500 bg-amber-500/10" 
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                      )}
                      onClick={() => {
                        setSelectedOrdemRecebimento(ordem)
                        setValorRecebimento(ordem.preco_venda_final?.toString() || '0')
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-zinc-200">{nomeP}</span>
                        <span className="font-bold text-emerald-500">{formatCurrency(ordem.preco_venda_final || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-zinc-500">
                        <span>{nomeC}</span>
                        <span>{dataOrd ? formatData(dataOrd) : ''}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {selectedOrdemRecebimento && (
              <div className="mt-4 p-4 border border-amber-500/30 rounded-lg bg-amber-500/5 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="valReceb">Valor Recebido (R$)</Label>
                  <Input
                    id="valReceb"
                    type="number"
                    step="0.01"
                    value={valorRecebimento}
                    onChange={e => setValorRecebimento(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-emerald-500 font-bold"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="obsReceb">Observação (opcional)</Label>
                  <Input
                    id="obsReceb"
                    placeholder="Ex: Recebido em PIX ou Espécie"
                    value={obsRecebimento}
                    onChange={e => setObsRecebimento(e.target.value)}
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceberModalOpen(false)} className="border-zinc-700 text-zinc-300">
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmarRecebimento} 
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              disabled={!selectedOrdemRecebimento || !valorRecebimento}
            >
              Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
