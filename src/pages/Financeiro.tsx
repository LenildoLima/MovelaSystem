import { useState } from 'react'
import { useOrdens } from '@/hooks/useOrdens'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function Financeiro() {
  const { ordens, isLoading } = useOrdens()
  const [periodFilter, setPeriodFilter] = useState<'hoje' | 'semana' | 'mes' | 'semestral' | 'custom'>('mes')
  const [semesterFilter, setSemesterFilter] = useState<'1' | '2'>('1')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [appliedCustomRange, setAppliedCustomRange] = useState<{ start: string; end: string } | null>(null)

  const ordensConcluidas = ordens.filter(o => o.status === 'concluido')
  
  // Função para filtrar por período
  const getFilteredOrdens = () => {
    const now = new Date()
    const todayStr = new Date().toISOString().split('T')[0]
    
    const dDate = new Date()
    dDate.setHours(0,0,0,0)
    const day = dDate.getDay() // 0=Dom, 1=Seg...
    const diff = dDate.getDate() - (day === 0 ? 6 : day - 1)
    const startOfWeek = new Date(new Date(dDate).setDate(diff)).getTime()
    const endOfWeek = startOfWeek + (7 * 24 * 60 * 60 * 1000)
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime()
    
    const startMonth = semesterFilter === '1' ? 0 : 6
    const endMonth = semesterFilter === '1' ? 5 : 11
    const startOfSemester = new Date(now.getFullYear(), startMonth, 1).getTime()
    const endOfSemester = new Date(now.getFullYear(), endMonth + 1, 0, 23, 59, 59).getTime()

    return ordensConcluidas.filter(o => {
      const dateRef = o.data_conclusao || o.data_pedido
      const orderDate = new Date(dateRef).getTime()
      
      switch (periodFilter) {
        case 'hoje':
          return o.data_pedido.startsWith(todayStr)
        case 'semana':
          return orderDate >= startOfWeek && orderDate < endOfWeek
        case 'mes':
          return orderDate >= startOfMonth && orderDate <= endOfMonth
        case 'semestral':
          return orderDate >= startOfSemester && orderDate <= endOfSemester
        case 'custom':
          if (appliedCustomRange) {
            const rangeStart = new Date(appliedCustomRange.start).getTime()
            const rangeEnd = new Date(appliedCustomRange.end).getTime()
            return orderDate >= rangeStart && orderDate <= rangeEnd
          }
          return true
        default:
          return true
      }
    })
  }

  const filteredOrdens = getFilteredOrdens()

  const faturamentoTotal = filteredOrdens.reduce((acc, o) => acc + o.preco_venda_final, 0)
  const custoTotal = filteredOrdens.reduce((acc, o) => acc + o.custo_total, 0)
  const lucroTotal = filteredOrdens.reduce((acc, o) => acc + o.lucro, 0)

  // Geração de dados para o gráfico com base nas regras fixas
  const generateChartData = () => {
    const data: any[] = []
    
    if (periodFilter === 'hoje') {
      data.push({
        name: 'Hoje',
        faturamento: filteredOrdens.reduce((s, o) => s + o.preco_venda_final, 0),
        custo: filteredOrdens.reduce((s, o) => s + o.custo_total, 0),
        lucro: filteredOrdens.reduce((s, o) => s + o.lucro, 0)
      })
    } else if (periodFilter === 'semana') {
      const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
      dias.forEach((dia, idx) => {
        const dayOrdem = filteredOrdens.filter(o => {
          const dateRef = o.data_conclusao || o.data_pedido
          const d = new Date(dateRef).getDay()
          return d === (idx + 1)
        })
        data.push({
          name: dia,
          faturamento: dayOrdem.reduce((s, o) => s + o.preco_venda_final, 0),
          custo: dayOrdem.reduce((s, o) => s + o.custo_total, 0),
          lucro: dayOrdem.reduce((s, o) => s + o.lucro, 0)
        })
      })
    } else if (periodFilter === 'mes') {
      const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
      for (let d = 1; d <= lastDay; d++) {
        const dayOrdem = filteredOrdens.filter(o => {
          const dateRef = o.data_conclusao || o.data_pedido
          return new Date(dateRef).getDate() === d
        })
        data.push({
          name: d.toString(),
          faturamento: dayOrdem.reduce((s, o) => s + o.preco_venda_final, 0),
          custo: dayOrdem.reduce((s, o) => s + o.custo_total, 0),
          lucro: dayOrdem.reduce((s, o) => s + o.lucro, 0)
        })
      }
    } else if (periodFilter === 'semestral') {
      const meses = semesterFilter === '1' 
        ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
        : ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      const offset = semesterFilter === '1' ? 0 : 6
      meses.forEach((mes, idx) => {
        const monthOrdem = filteredOrdens.filter(o => {
          const dateRef = o.data_conclusao || o.data_pedido
          return new Date(dateRef).getMonth() === (idx + offset)
        })
        data.push({
          name: mes,
          faturamento: monthOrdem.reduce((s, o) => s + o.preco_venda_final, 0),
          custo: monthOrdem.reduce((s, o) => s + o.custo_total, 0),
          lucro: monthOrdem.reduce((s, o) => s + o.lucro, 0)
        })
      })
    } else if (periodFilter === 'custom') {
      const groups: Record<string, any> = {}
      filteredOrdens.forEach(o => {
        const dateRef = o.data_conclusao || o.data_pedido
        const name = new Date(dateRef).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        if (!groups[name]) groups[name] = { name, faturamento: 0, custo: 0, lucro: 0 }
        groups[name].faturamento += o.preco_venda_final
        groups[name].custo += o.custo_total
        groups[name].lucro += o.lucro
      })
      data.push(...Object.values(groups))
    }

    return data
  }

  const chartData = generateChartData()
  const hasChartData = chartData.some(d => d.faturamento > 0 || d.custo > 0 || d.lucro > 0)

  if (isLoading) return <div className="p-8 text-zinc-400">Carregando financeiro...</div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Relatório Financeiro</h1>
          <div className="flex items-center gap-4">
            <Label className="text-zinc-400">Filtrar:</Label>
            <Select value={periodFilter} onValueChange={(val: any) => setPeriodFilter(val)}>
              <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="custom">Todo o Período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sub-filtros dinâmicos */}
        {(periodFilter === 'semestral' || periodFilter === 'custom') && (
          <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 animate-in fade-in slide-in-from-top-2">
            {periodFilter === 'semestral' && (
              <>
                <Label className="text-zinc-400">Escolha o Semestre:</Label>
                <Select value={semesterFilter} onValueChange={(val: any) => setSemesterFilter(val)}>
                  <SelectTrigger className="w-[180px] bg-zinc-950 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectItem value="1">1° Semestre (Jan-Jun)</SelectItem>
                    <SelectItem value="2">2° Semestre (Jul-Dez)</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            
            {periodFilter === 'custom' && (
              <div className="flex items-center gap-4 w-full">
                <div className="flex items-center gap-2">
                  <Label className="text-zinc-400">De:</Label>
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-white w-[160px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-zinc-400">Até:</Label>
                  <Input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-white w-[160px]"
                  />
                </div>
                <Button 
                  onClick={() => setAppliedCustomRange({ start: startDate, end: endDate })}
                  className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-bold px-6 ml-auto"
                >
                  Aplicar Filtro
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoTotal)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Custo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoTotal)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lucroTotal)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center justify-between">
            <CardTitle>Desempenho no Período</CardTitle>
            <span className="text-xs text-zinc-500 italic">Baseado em ordens concluídas</span>
          </div>
        </CardHeader>
        <div className="h-[350px] min-h-[300px] w-full min-w-0">
          {!hasChartData ? (
            <div className="h-full w-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg bg-zinc-900/30">
              <p className="text-zinc-500 font-medium italic">Nenhuma ordem concluída neste período</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="99%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar name="Faturamento" dataKey="faturamento" fill="#eab308" radius={[4, 4, 0, 0]} />
                <Bar name="Custo" dataKey="custo" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar name="Lucro" dataKey="lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <div className="rounded-md border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold">Ordens Concluídas no Período</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-zinc-400">Produto</TableHead>
              <TableHead className="text-zinc-400 text-right">Venda</TableHead>
              <TableHead className="text-zinc-400 text-right">Custo Mat.</TableHead>
              <TableHead className="text-zinc-400 text-right">Custo M.Obra</TableHead>
              <TableHead className="text-zinc-400 text-right">Lucro</TableHead>
              <TableHead className="text-zinc-400 text-right">Margem %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrdens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-zinc-500 italic">
                  Nenhuma ordem concluída encontrada para este período.
                </TableCell>
              </TableRow>
            ) : filteredOrdens.map((o) => (
              <TableRow key={o.id} className="border-zinc-800">
                <TableCell className="font-medium">{o.produto?.nome}</TableCell>
                <TableCell className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.preco_venda_final)}</TableCell>
                <TableCell className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.custo_materiais)}</TableCell>
                <TableCell className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.custo_mao_obra)}</TableCell>
                <TableCell className="text-right text-emerald-500 font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.lucro)}</TableCell>
                <TableCell className="text-right">
                  {((o.lucro / o.preco_venda_final) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

