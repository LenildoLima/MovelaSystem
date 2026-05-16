import { useState } from 'react'
import { useProdutos } from '@/hooks/useProdutos'
import { useMateriais } from '@/hooks/useMateriais'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Plus, Settings2, Trash2 } from 'lucide-react'

export function Produtos() {
  const { produtos, isLoading, isError, error, createProduto, useFichaTecnica, addItemFicha, removeItemFicha } = useProdutos()
  const { materiais } = useMateriais()

  const [selectedProdutoId, setSelectedProdutoId] = useState<string | null>(null)
  const [isNewProdutoOpen, setIsNewProdutoOpen] = useState(false)
  const [newItem, setNewItem] = useState({ material_id: '', quantidade_necessaria: 0 })

  const { data: ficha, isLoading: loadingFicha } = useFichaTecnica(selectedProdutoId || undefined)

  const [newProduto, setNewProduto] = useState({
    nome: '',
    categoria: '',
    preco_venda: 0,
    descricao: ''
  })

  const handleCreateProduto = () => {
    createProduto.mutate(newProduto, {
      onSuccess: () => setIsNewProdutoOpen(false)
    })
  }

  const handleAddItem = () => {
    if (!selectedProdutoId) return
    addItemFicha.mutate({
      produto_id: selectedProdutoId,
      ...newItem
    })
  }

  if (isError) {
    return (
      <div className="p-8 bg-rose-950 border border-rose-800 rounded-lg">
        <h2 className="text-rose-400 font-semibold mb-2">Erro ao carregar produtos</h2>
        <p className="text-rose-300 text-sm">{error?.message || 'Erro desconhecido'}</p>
      </div>
    )
  }

  if (isLoading) return <div className="p-8 text-zinc-400">Carregando produtos...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Produtos e Fichas Técnicas</h1>
        
        <Dialog open={isNewProdutoOpen} onOpenChange={setIsNewProdutoOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600">
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Produto</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Adicione as informações básicas do novo produto ao catálogo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Produto</Label>
                <Input 
                  value={newProduto.nome || ''}
                  className="bg-zinc-950 border-zinc-800"
                  onChange={(e) => setNewProduto({...newProduto, nome: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input 
                    placeholder="Ex: Cozinha, Quarto..." 
                    value={newProduto.categoria || ''}
                    className="bg-zinc-950 border-zinc-800"
                    onChange={(e) => setNewProduto({...newProduto, categoria: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço de Venda Base</Label>
                  <Input 
                    type="number" 
                    className="bg-zinc-950 border-zinc-800"
                    onChange={(e) => setNewProduto({...newProduto, preco_venda: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input 
                  value={newProduto.descricao || ''}
                  className="bg-zinc-950 border-zinc-800"
                  onChange={(e) => setNewProduto({...newProduto, descricao: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateProduto} className="bg-amber-500 hover:bg-amber-600">Salvar Produto</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-zinc-400">Nome</TableHead>
              <TableHead className="text-zinc-400">Categoria</TableHead>
              <TableHead className="text-zinc-400">Venda Sugerido</TableHead>
              <TableHead className="text-zinc-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos.map((produto) => (
              <TableRow key={produto.id} className="border-zinc-800">
                <TableCell className="font-medium">{produto.nome}</TableCell>
                <TableCell>{produto.categoria}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco_venda)}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-amber-500 hover:text-amber-400"
                    onClick={() => setSelectedProdutoId(produto.id)}
                  >
                    <Settings2 className="h-4 w-4 mr-2" />
                    Ficha Técnica
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedProdutoId} onOpenChange={() => setSelectedProdutoId(null)}>
        <SheetContent className="bg-zinc-950 border-zinc-800 text-white w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Ficha Técnica</SheetTitle>
            <SheetDescription className="text-zinc-400">
              Gerencie os materiais necessários para a produção deste item.
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-8 space-y-6">
            <div className="space-y-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <h3 className="font-medium">Adicionar Material</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select onValueChange={(val) => setNewItem({...newItem, material_id: val})}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      {materiais.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input 
                    type="number" 
                    className="bg-zinc-950 border-zinc-800"
                    onChange={(e) => setNewItem({...newItem, quantidade_necessaria: Number(e.target.value)})}
                  />
                </div>
              </div>
              <Button onClick={handleAddItem} className="w-full bg-amber-500 hover:bg-amber-600">
                Adicionar à Ficha
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Materiais da Ficha</h3>
              <div className="max-h-[400px] overflow-y-auto pr-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Material</TableHead>
                      <TableHead className="text-zinc-400">Qtd.</TableHead>
                      <TableHead className="text-zinc-400 text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ficha?.map((item) => (
                      <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-900">
                        <TableCell>{item.materiais?.nome}</TableCell>
                        <TableCell>{item.quantidade_necessaria} {item.materiais?.unidade}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-rose-500"
                            onClick={() => removeItemFicha.mutate({ id: item.id, produtoId: selectedProdutoId! })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!ficha || ficha.length === 0) && !loadingFicha && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-zinc-500">
                          Nenhum material adicionado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
