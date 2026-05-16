import { useOrdens } from '@/hooks/useOrdens'
import { useMateriais } from '@/hooks/useMateriais'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  ClipboardList, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const { ordens, isLoading: loadingOrdens, isError: errorOrdens, error: errorOrdensMensagem } = useOrdens()
  const { materiais, isLoading: loadingMateriais, isError: errorMateriais, error: errorMateriaisMensagem } = useMateriais()

  if (errorOrdens || errorMateriais) {
    return (
      <div className="p-8 bg-rose-950 border border-rose-800 rounded-lg">
        <h2 className="text-rose-400 font-semibold mb-2">Erro ao carregar dados</h2>
        <p className="text-rose-300 text-sm">
          {errorOrdens ? `Ordens: ${errorOrdensMensagem?.message}` : ''}
          {errorMateriais ? `Materiais: ${errorMateriaisMensagem?.message}` : ''}
        </p>
      </div>
    )
  }

  if (loadingOrdens || loadingMateriais) {
    return (
      <div className="p-8 text-zinc-400">Carregando dashboard...</div>
    )
  }

  // Cálculos de métricas
  const ordensPendentes = ordens.filter(o => o.status === 'pendente').length
  const ordensEmProducao = ordens.filter(o => o.status === 'em_producao').length

  const faturamentoMes = ordens
    .filter(o => o.status === 'concluido')
    .reduce((acc, curr) => acc + curr.preco_venda_final, 0)

  const lucroTotal = ordens
    .filter(o => o.status === 'concluido')
    .reduce((acc, curr) => acc + curr.lucro, 0)

  const materiaisBaixos = materiais.filter(m => m.quantidade_estoque <= m.estoque_minimo).length

  const ultimasOrdens = ordens.slice(0, 5)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Ordens Ativas</CardTitle>
            <ClipboardList className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordensPendentes + ordensEmProducao}</div>
            <p className="text-xs text-zinc-500">{ordensPendentes} pendentes / {ordensEmProducao} em produção</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Faturamento Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoMes)}
            </div>
            <p className="text-xs text-zinc-500">Total de ordens concluídas</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Lucro Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lucroTotal)}
            </div>
            <p className="text-xs text-zinc-500">Baseado no custo Real</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Estoque Crítico</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materiaisBaixos}</div>
            <p className="text-xs text-zinc-500">Materiais abaixo do mínimo</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-xl font-semibold">Últimas Ordens de Produção</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900">
              <TableHead className="text-zinc-400">Produto</TableHead>
              <TableHead className="text-zinc-400">Cliente</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400 text-right">Valor</TableHead>
              <TableHead className="text-zinc-400 text-right">Lucro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ultimasOrdens.map((ordem) => (
              <TableRow key={ordem.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell className="font-medium">{ordem.produto?.nome}</TableCell>
                <TableCell>{ordem.cliente?.nome}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "capitalize",
                      ordem.status === 'concluido' && "border-emerald-500 text-emerald-500",
                      ordem.status === 'em_producao' && "border-blue-500 text-blue-500",
                      ordem.status === 'pendente' && "border-amber-500 text-amber-500",
                      ordem.status === 'cancelado' && "border-rose-500 text-rose-500"
                    )}
                  >
                    {ordem.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ordem.preco_venda_final)}
                </TableCell>
                <TableCell className="text-right text-emerald-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ordem.lucro)}
                </TableCell>
              </TableRow>
            ))}
            {ultimasOrdens.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                  Nenhuma ordem registrada recentemente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

