import { useState } from 'react'
import { useMateriais } from '@/hooks/useMateriais'
import { useFornecedores } from '@/hooks/useFornecedores'
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
import { PackagePlus, ArrowDownToLine } from 'lucide-react'

export function Estoque() {
  const { materiais, isLoading, createMaterial, registrarEntrada } = useMateriais()
  const { fornecedores } = useFornecedores()
  
  const [isNewMaterialOpen, setIsNewMaterialOpen] = useState(false)
  const [isEntradaOpen, setIsEntradaOpen] = useState(false)
  
  const [newMaterial, setNewMaterial] = useState({
    nome: '',
    unidade: '',
    estoque_minimo: 0,
    custo_unitario: 0,
    fornecedor_id: '',
  })

  const [entrada, setEntrada] = useState({
    material_id: '',
    quantidade: 0,
    custo_unitario: 0,
  })

  const handleCreateMaterial = () => {
    createMaterial.mutate(newMaterial, {
      onSuccess: () => setIsNewMaterialOpen(false)
    })
  }

  const handleRegistrarEntrada = () => {
    const material = materiais.find(m => m.id === entrada.material_id)
    registrarEntrada.mutate({
      ...entrada,
      fornecedor_id: material?.fornecedor_id,
      usuario_id: '00000000-0000-0000-0000-000000000000', // Placeholder
      data_compra: new Date().toISOString()
    }, {
      onSuccess: () => setIsEntradaOpen(false)
    })
  }

  if (isLoading) return <div className="p-8 text-zinc-400">Carregando estoque...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Estoque</h1>
        <div className="flex gap-2">
          <Dialog open={isEntradaOpen} onOpenChange={setIsEntradaOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10">
                <ArrowDownToLine className="mr-2 h-4 w-4" />
                Registrar Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle>Entrada de Material</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Registre a entrada de estoque e o custo unitário do material.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select onValueChange={(val) => setEntrada({...entrada, material_id: val})}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue placeholder="Selecione o material" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      {materiais.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input 
                      type="number" 
                      className="bg-zinc-950 border-zinc-800"
                      value={entrada.quantidade || ''}
                      onChange={(e) => setEntrada({...entrada, quantidade: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Custo Unitário</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      className="bg-zinc-950 border-zinc-800"
                      value={entrada.custo_unitario || ''}
                      onChange={(e) => setEntrada({...entrada, custo_unitario: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleRegistrarEntrada} className="bg-emerald-600 hover:bg-emerald-700">Confirmar Entrada</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isNewMaterialOpen} onOpenChange={setIsNewMaterialOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-600">
                <PackagePlus className="mr-2 h-4 w-4" />
                Novo Material
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle>Cadastrar Material</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Adicione um novo material ao catálogo para controle de estoque.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nome do Material</Label>
                  <Input 
                    className="bg-zinc-950 border-zinc-800"
                    onChange={(e) => setNewMaterial({...newMaterial, nome: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Input 
                      placeholder="un, m2, kg..." 
                      className="bg-zinc-950 border-zinc-800"
                      onChange={(e) => setNewMaterial({...newMaterial, unidade: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estoque Mínimo</Label>
                    <Input 
                      type="number" 
                      className="bg-zinc-950 border-zinc-800"
                      onChange={(e) => setNewMaterial({...newMaterial, estoque_minimo: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fornecedor Padrão</Label>
                  <Select onValueChange={(val) => setNewMaterial({...newMaterial, fornecedor_id: val})}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      {fornecedores.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateMaterial} className="bg-amber-500 hover:bg-amber-600">Salvar Material</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-zinc-400">Material</TableHead>
              <TableHead className="text-zinc-400">Unidade</TableHead>
              <TableHead className="text-zinc-400">Qtd. Estoque</TableHead>
              <TableHead className="text-zinc-400">Custo Médio</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materiais.map((material) => (
              <TableRow key={material.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell className="font-medium">{material.nome}</TableCell>
                <TableCell>{material.unidade}</TableCell>
                <TableCell>{material.quantidade_estoque}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(material.custo_unitario)}
                </TableCell>
                <TableCell>
                  {material.quantidade_estoque <= material.estoque_minimo ? (
                    <Badge variant="destructive" className="bg-rose-500/20 text-rose-500 hover:bg-rose-500/20">BAIXO</Badge>
                  ) : (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-500">OK</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {materiais.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-zinc-500">
                  Nenhum material cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
