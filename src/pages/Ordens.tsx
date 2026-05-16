import { useState } from 'react'
import { useOrdens } from '@/hooks/useOrdens'
import { useProdutos } from '@/hooks/useProdutos'
import { useClientes } from '@/hooks/useClientes'
import { Button } from '@/components/ui/button'
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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Plus, Eye, CheckCircle2, Factory, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Ordens() {
  const { ordens, isLoading, createOrdem, updateStatusOrdem, addMaoObra, getDetalhesOrdem } = useOrdens()
  const { produtos } = useProdutos()
  const { clientes } = useClientes()
  
  const [selectedOrdemId, setSelectedOrdemId] = useState<string | null>(null)
  const [isNewOrdemOpen, setIsNewOrdemOpen] = useState(false)
  const [isAddMaoObraOpen, setIsAddMaoObraOpen] = useState(false)
  
  const { data: detalhes } = getDetalhesOrdem(selectedOrdemId || '')

  const [newOrdem, setNewOrdem] = useState({
    produto_id: '',
    cliente_id: '',
    preco_venda_final: 0,
    data_entrega: '',
    observacoes: ''
  })

  const [newMaoObra, setNewMaoObra] = useState({
    descricao: '',
    responsavel: '',
    valor: 0
  })

  const handleSelectProduto = (val: string) => {
    const produto = produtos.find(p => p.id === val)
    setNewOrdem({
      ...newOrdem, 
      produto_id: val, 
      preco_venda_final: produto?.preco_venda || 0 
    })
  }

  const handleCreateOrdem = () => {
    createOrdem.mutate({
      ...newOrdem,
      data_entrega: newOrdem.data_entrega || null,
      usuario_id: '00000000-0000-0000-0000-000000000000',
      data_pedido: new Date().toISOString()
    }, {
      onSuccess: () => setIsNewOrdemOpen(false)
    })
  }

  const handleAddMaoObra = () => {
    if (!selectedOrdemId) return
    addMaoObra.mutate({
      ordem_id: selectedOrdemId,
      ...newMaoObra
    }, {
      onSuccess: () => setIsAddMaoObraOpen(false)
    })
  }

  const selectedOrdem = ordens.find(o => o.id === selectedOrdemId)

  if (isLoading) return <div className="p-8 text-zinc-400">Carregando ordens...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Ordens de Produção</h1>
        
        <Dialog open={isNewOrdemOpen} onOpenChange={setIsNewOrdemOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600">
              <Plus className="mr-2 h-4 w-4" />
              Nova Ordem
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Abrir Ordem de Produção</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Preencha os dados abaixo para iniciar um novo processo de produção.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Select onValueChange={handleSelectProduto}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      {produtos.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select onValueChange={(val) => setNewOrdem({...newOrdem, cliente_id: val})}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      {clientes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço de Venda Final</Label>
                  <Input 
                    type="number" 
                    value={newOrdem.preco_venda_final}
                    className="bg-zinc-950 border-zinc-800"
                    onChange={(e) => setNewOrdem({...newOrdem, preco_venda_final: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Entrega</Label>
                  <Input 
                    type="date"
                    className="bg-zinc-950 border-zinc-800"
                    onChange={(e) => setNewOrdem({...newOrdem, data_entrega: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input 
                  value={newOrdem.observacoes || ''}
                  className="bg-zinc-950 border-zinc-800"
                  onChange={(e) => setNewOrdem({...newOrdem, observacoes: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateOrdem} className="bg-amber-500 hover:bg-amber-600">Criar Ordem e Baixar Estoque</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-900">
              <TableHead className="text-zinc-400">Produto</TableHead>
              <TableHead className="text-zinc-400">Cliente</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Venda</TableHead>
              <TableHead className="text-zinc-400">Custo Total</TableHead>
              <TableHead className="text-zinc-400">Lucro</TableHead>
              <TableHead className="text-zinc-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordens.map((ordem) => (
              <TableRow key={ordem.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell className="font-medium">{ordem.produto?.nome}</TableCell>
                <TableCell>{ordem.cliente?.nome}</TableCell>
                <TableCell>
                  <Badge 
                    className={cn(
                      "capitalize",
                      ordem.status === 'concluido' && "bg-emerald-500 hover:bg-emerald-600",
                      ordem.status === 'em_producao' && "bg-blue-500 hover:bg-blue-600",
                      ordem.status === 'pendente' && "bg-amber-500 hover:bg-amber-600",
                      ordem.status === 'cancelado' && "bg-rose-500 hover:bg-rose-600"
                    )}
                  >
                    {ordem.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ordem.preco_venda_final)}</TableCell>
                <TableCell className="text-zinc-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ordem.custo_total)}</TableCell>
                <TableCell className={cn("font-semibold", ordem.lucro > 0 ? "text-emerald-500" : "text-rose-500")}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ordem.lucro)}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                    onClick={() => setSelectedOrdemId(ordem.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedOrdemId} onOpenChange={() => setSelectedOrdemId(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Ordem #{selectedOrdemId?.slice(0, 8)}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Acompanhamento de produção, custos e materiais.
            </DialogDescription>
          </DialogHeader>

          {selectedOrdem && (
            <div className="mt-6 space-y-8">
              {/* Financial Summary Row */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between shadow-sm">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Preço Venda</Label>
                  <p className="text-xl font-bold mt-1 text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrdem.preco_venda_final)}</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between shadow-sm">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Materiais</Label>
                  <p className="text-xl font-bold mt-1 text-rose-400">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrdem.custo_materiais)}</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between shadow-sm">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Mão de Obra</Label>
                  <p className="text-xl font-bold mt-1 text-rose-400">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrdem.custo_mao_obra)}</p>
                </div>
                <div className={cn(
                  "p-4 rounded-xl border flex flex-col justify-between transition-all shadow-sm",
                  selectedOrdem.lucro > 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"
                )}>
                  <Label className={cn(
                    "text-[10px] uppercase font-bold tracking-widest",
                    selectedOrdem.lucro > 0 ? "text-emerald-500" : "text-rose-500"
                  )}>Lucro Estimado</Label>
                  <p className={cn(
                    "text-xl font-bold mt-1",
                    selectedOrdem.lucro > 0 ? "text-emerald-500" : "text-rose-500"
                  )}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrdem.lucro)}</p>
                </div>
              </div>

              {/* Status Actions Row */}
              <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 shadow-inner">
                <div className="flex items-center gap-6">
                  <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Status da Produção:</span>
                  <div className="flex gap-3 w-full">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex-1 h-10 shadow-lg shadow-blue-900/20"
                      onClick={() => updateStatusOrdem.mutate({ id: selectedOrdem.id, status: 'em_producao' })}
                    >
                      <Factory className="mr-2 h-4 w-4" /> Em Produção
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex-1 h-10 shadow-lg shadow-emerald-900/20"
                      onClick={() => updateStatusOrdem.mutate({ id: selectedOrdem.id, status: 'concluido' })}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Concluir Ordem
                    </Button>
                    <Button 
                      variant="destructive"
                      className="font-bold flex-1 h-10 shadow-lg shadow-rose-900/20"
                      onClick={() => updateStatusOrdem.mutate({ id: selectedOrdem.id, status: 'cancelado' })}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Cancelar Ordem
                    </Button>
                  </div>
                </div>
              </div>

              {/* Dynamic Sections Grid */}
              <div className="grid grid-cols-2 gap-8 pt-2">
                {/* Labor Section (Left) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center text-zinc-100 italic">
                      Mão de Obra
                    </h3>
                    <Button size="sm" variant="outline" onClick={() => setIsAddMaoObraOpen(true)} className="border-amber-500 text-amber-500 hover:bg-amber-500/10 h-8 font-semibold">
                      <Plus className="h-3 w-3 mr-1" /> Adicionar Mão de Obra
                    </Button>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900/60">
                          <TableHead className="text-zinc-500 h-9 font-bold text-xs uppercase tracking-wider">Descrição</TableHead>
                          <TableHead className="text-zinc-500 h-9 font-bold text-xs uppercase tracking-wider">Resp.</TableHead>
                          <TableHead className="text-zinc-500 text-right h-9 font-bold text-xs uppercase tracking-wider">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detalhes?.maoObra.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-zinc-600 py-8 text-xs italic">Nenhum registro de mão de obra</TableCell>
                          </TableRow>
                        ) : detalhes?.maoObra.map((mo) => (
                          <TableRow key={mo.id} className="border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                            <TableCell className="py-2.5 text-xs text-zinc-300">{mo.descricao}</TableCell>
                            <TableCell className="py-2.5 text-xs text-zinc-400">{mo.responsavel}</TableCell>
                            <TableCell className="text-right py-2.5 text-xs font-bold text-zinc-200">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mo.valor)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Materials Section (Right) */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-zinc-100 italic">Materiais Utilizados</h3>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                    <div className="max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                      <Table>
                        <TableHeader className="sticky top-0 bg-zinc-900 z-10">
                          <TableRow className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900/60">
                            <TableHead className="text-zinc-500 h-9 font-bold text-xs uppercase tracking-wider">Material</TableHead>
                            <TableHead className="text-zinc-500 text-right h-9 font-bold text-xs uppercase tracking-wider">Custo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detalhes?.materiais.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-zinc-600 py-8 text-xs italic">Nenhum material registrado</TableCell>
                            </TableRow>
                          ) : detalhes?.materiais.map((m: any) => (
                            <TableRow key={m.id} className="border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                              <TableCell className="py-2.5">
                                <div className="flex flex-col">
                                  <span className="text-xs text-zinc-300 font-bold">{m.materiais?.nome}</span>
                                  <span className="text-[10px] text-zinc-500">{m.quantidade_usada} {m.materiais?.unidade}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right py-2.5 text-xs font-bold text-zinc-200">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.custo_total)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddMaoObraOpen} onOpenChange={setIsAddMaoObraOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Registrar Custo de Mão de Obra</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Adicione os detalhes da mão de obra para recalcular o lucro da ordem.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Descrição do Serviço</Label>
              <Input className="bg-zinc-950 border-zinc-800" onChange={(e) => setNewMaoObra({...newMaoObra, descricao: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Input className="bg-zinc-950 border-zinc-800" onChange={(e) => setNewMaoObra({...newMaoObra, responsavel: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Valor do Custo</Label>
                <Input type="number" className="bg-zinc-950 border-zinc-800" onChange={(e) => setNewMaoObra({...newMaoObra, valor: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddMaoObra} className="bg-amber-500">Confirmar e Recalcular Lucro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
