import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Plus, Trash, PackageSearch, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

type Material = {
  id: string
  nome: string
  unidade: string
  quantidade_estoque: number
  custo_unitario: number
}

type CartItem = {
  material_id: string
  nome: string
  unidade: string
  estoque_disponivel: number
  quantidade: number
  preco_unitario: number
}

export function Vendas() {
  const { user, perfil } = useAuth()
  const { toast } = useToast()

  const [materiais, setMateriais] = useState<Material[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const [cart, setCart] = useState<CartItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchMateriais()
  }, [])

  const fetchMateriais = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('materiais')
        .select('*')
        .gt('quantidade_estoque', 0)
        .order('nome')
      if (error) throw error
      setMateriais(data || [])
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Não foi possível carregar os materiais do estoque.' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (material: Material) => {
    setCart(prev => {
      const exists = prev.find(item => item.material_id === material.id)
      if (exists) {
        if (exists.quantidade >= material.quantidade_estoque) {
          toast({ title: 'Atenção', description: 'Quantidade máxima em estoque atingida.', variant: 'default' })
          return prev
        }
        return prev.map(item => item.material_id === material.id ? { ...item, quantidade: item.quantidade + 1 } : item)
      } else {
        return [...prev, {
          material_id: material.id,
          nome: material.nome,
          unidade: material.unidade,
          estoque_disponivel: material.quantidade_estoque,
          quantidade: 1,
          preco_unitario: material.custo_unitario
        }]
      }
    })
  }

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter(item => item.material_id !== id))
  }

  const handleUpdateCartItem = (id: string, field: 'quantidade' | 'preco_unitario', value: string) => {
    const numValue = parseFloat(value.replace(',', '.'))
    if (isNaN(numValue) || numValue < 0) return

    setCart(prev => prev.map(item => {
      if (item.material_id === id) {
        let finalValue = numValue
        if (field === 'quantidade' && numValue > item.estoque_disponivel) {
          toast({ title: 'Estoque insuficiente', description: `O estoque máximo é ${item.estoque_disponivel}`, variant: 'destructive' })
          finalValue = item.estoque_disponivel
        }
        return { ...item, [field]: finalValue }
      }
      return item
    }))
  }

  const handleFinalizarVenda = async () => {
    if (cart.length === 0) return
    setSubmitting(true)
    
    try {
      // 1. Verificar Caixa Aberto
      const { data: caixaData, error: caixaError } = await supabase
        .from('caixas')
        .select('id')
        .eq('status', 'aberto')
        .limit(1)
        .maybeSingle()
      
      if (caixaError && caixaError.code !== 'PGRST116') throw caixaError
      
      if (!caixaData) {
        throw new Error('Abra o caixa antes de registrar uma venda')
      }
      
      const caixaId = caixaData.id
      const valorTotal = cart.reduce((acc, curr) => acc + (curr.quantidade * curr.preco_unitario), 0)
      const qtyItens = cart.reduce((acc, curr) => acc + curr.quantidade, 0)
      
      // 2. Inserir em vendas
      const { data: vendaInserida, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          usuario_id: user?.id,
          usuario_nome: perfil?.nome,
          caixa_id: caixaId,
          valor_total: valorTotal,
          observacoes: ''
        })
        .select('id')
        .single()
        
      if (vendaError) throw vendaError
      const vendaId = vendaInserida.id
      
      // 3. Inserir venda_itens e Baixar Estoque
      for (const item of cart) {
        const { error: erroItem } = await supabase
          .from('venda_itens')
          .insert({
            venda_id: vendaId,
            material_id: item.material_id,
            material_nome: item.nome,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario
          })
        if (erroItem) throw erroItem
        
        // Obter estoque atual para atualizar
        const { data: matAtual, error: erroFetchMat } = await supabase
          .from('materiais')
          .select('quantidade_estoque')
          .eq('id', item.material_id)
          .single()
          
        if (erroFetchMat) throw erroFetchMat
        
        const { error: erroBaixa } = await supabase
          .from('materiais')
          .update({ quantidade_estoque: matAtual.quantidade_estoque - item.quantidade })
          .eq('id', item.material_id)
        if (erroBaixa) throw erroBaixa
      }
      
      // 4. Inserir Movimentacao de Caixa
      const { error: erroMov } = await supabase
        .from('caixa_movimentacoes')
        .insert({
          caixa_id: caixaId,
          usuario_id: user?.id,
          usuario_nome: perfil?.nome,
          tipo: 'entrada',
          valor: valorTotal,
          descricao: `Venda PDV - ${qtyItens} itens`
        })
      if (erroMov) throw erroMov
      
      // Sucesso
      setCart([])
      toast({ title: 'Sucesso', description: 'Venda finalizada com sucesso!' })
      
      fetchMateriais()
      
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao finalizar venda.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  const subtotalCart = cart.reduce((acc, curr) => acc + (curr.quantidade * curr.preco_unitario), 0)
  
  const materiaisFiltrados = materiais.filter(m => m.nome.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="h-screen overflow-hidden p-4 md:p-6 flex flex-col bg-[#09090b] text-white">
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* COLUNA ESQUERDA: Materiais (60%) */}
        <div className="w-full lg:w-[60%] flex flex-col min-h-0">
          <Card className="bg-zinc-900 border-zinc-800 flex-1 flex flex-col min-h-0">
            <CardHeader className="px-4 py-3 border-b border-zinc-800 shrink-0">
              <CardTitle className="text-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span>Materiais Disponíveis</span>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input 
                    type="search" 
                    placeholder="Buscar material..." 
                    className="pl-9 h-9 bg-zinc-950 border-zinc-800"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-y-auto pr-2">
              {loading ? (
                 <div className="text-zinc-500 text-center py-8">Carregando estoque...</div>
              ) : materiaisFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <PackageSearch className="h-10 w-10 mb-2 opacity-50" />
                  <p>Nenhum material encontrado no estoque.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {materiaisFiltrados.map((mat) => (
                    <div key={mat.id} className="border border-zinc-800 bg-zinc-950 p-4 rounded-xl hover:border-zinc-700 transition flex flex-col justify-between">
                      <div className="mb-3">
                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1" title={mat.nome}>{mat.nome}</h3>
                        <Badge variant="outline" className="font-mono text-[10px] text-zinc-400 border-zinc-700 bg-zinc-900">
                          Estoque: {mat.quantidade_estoque} {mat.unidade}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-bold text-emerald-500 text-sm">{formatCurrency(mat.custo_unitario)}</span>
                        <Button 
                          size="sm" 
                          className="bg-amber-500 hover:bg-amber-600 text-black h-8 w-8 p-0 shrink-0"
                          onClick={() => handleAddToCart(mat)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA: Carrinho (40%) */}
        <div className="w-full lg:w-[40%] flex flex-col min-h-0">
          <Card className="bg-zinc-900 border-zinc-800 flex-1 flex flex-col min-h-0">
            <CardHeader className="px-4 py-3 border-b border-zinc-800 flex flex-row items-center justify-between space-y-0 shrink-0">
              <CardTitle className="text-lg mt-0">Venda Atual</CardTitle>
              <Link to="/" className="inline-flex items-center text-xs font-semibold text-zinc-400 hover:text-white transition-colors bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-md hover:bg-zinc-800">
                <ArrowLeft className="h-3 w-3 mr-2" />
                Voltar ao Painel
              </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 p-12 text-zinc-500">
                  <span className="text-sm">Nenhum item adicionado</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto w-full overflow-x-hidden">
                  {cart.map((item) => (
                    <div key={item.material_id} className="p-4 border-b border-zinc-800 hover:bg-zinc-800/30">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm pr-4 line-clamp-1 flex-1" title={item.nome}>{item.nome}</span>
                        <button onClick={() => handleRemoveFromCart(item.material_id)} className="text-rose-500 hover:text-rose-400 flex-shrink-0 ml-2">
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex-1 space-y-1">
                          <Label className="text-[10px] text-zinc-500 uppercase">Qtd</Label>
                          <Input 
                            type="number" 
                            min="1" 
                            max={item.estoque_disponivel}
                            value={item.quantidade} 
                            onChange={(e) => handleUpdateCartItem(item.material_id, 'quantidade', e.target.value)}
                            className="bg-zinc-950 border-zinc-800 h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label className="text-[10px] text-zinc-500 uppercase">Preço (R$)</Label>
                          <Input 
                            type="number" 
                            step="0.01" 
                            value={item.preco_unitario} 
                            onChange={(e) => handleUpdateCartItem(item.material_id, 'preco_unitario', e.target.value)}
                            className="bg-zinc-950 border-zinc-800 h-8 text-xs text-emerald-500 font-medium font-mono"
                          />
                        </div>
                        <div className="w-[80px] flex flex-col justify-end items-end h-[46px]">
                          <span className="text-[10px] text-zinc-500 uppercase mb-1">Total</span>
                          <span className="font-bold text-sm text-amber-500 truncate w-full text-right" title={formatCurrency(item.quantidade * item.preco_unitario)}>
                            {formatCurrency(item.quantidade * item.preco_unitario)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 bg-zinc-950 space-y-4 rounded-b-xl mt-auto shrink-0 border-t border-zinc-800">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold text-zinc-400">Subtotal:</span>
                  <span className="font-bold text-2xl text-emerald-500">{formatCurrency(subtotalCart)}</span>
                </div>
                
                <Button 
                  className="w-full h-12 text-black font-semibold text-lg"
                  disabled={cart.length === 0 || submitting}
                  onClick={handleFinalizarVenda}
                  variant={cart.length === 0 ? "secondary" : "default"}
                  style={cart.length > 0 ? { backgroundColor: '#f59e0b', color: 'black' } : {}}
                >
                  {submitting ? 'Registrando...' : 'Finalizar Venda'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
