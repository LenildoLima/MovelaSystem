import { useState } from 'react'
import { useFornecedores } from '@/hooks/useFornecedores'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit } from 'lucide-react'

export function Fornecedores() {
  const { fornecedores, isLoading, isError, error, createFornecedor, updateFornecedor } = useFornecedores()
  const [isOpen, setIsOpen] = useState(false)
  const [editingFornecedor, setEditingFornecedor] = useState<any>(null)

  const [formData, setFormData] = useState({
    nome: '', contato: '', telefone: '', email: '', cnpj: '', observacoes: ''
  })

  const handleSave = () => {
    if (editingFornecedor) {
      updateFornecedor.mutate({ id: editingFornecedor.id, ...formData }, { onSuccess: () => setIsOpen(false) })
    } else {
      createFornecedor.mutate(formData, { onSuccess: () => setIsOpen(false) })
    }
  }

  const openEdit = (fornecedor: any) => {
    setEditingFornecedor(fornecedor)
    setFormData(fornecedor)
    setIsOpen(true)
  }

  if (isError) {
    return (
      <div className="p-8 bg-rose-950 border border-rose-800 rounded-lg">
        <h2 className="text-rose-400 font-semibold mb-2">Erro ao carregar fornecedores</h2>
        <p className="text-rose-300 text-sm">{error?.message || 'Erro desconhecido'}</p>
      </div>
    )
  }

  if (isLoading) return <div className="p-8 text-zinc-400">Carregando fornecedores...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Fornecedores</h1>
        <Button onClick={() => { setEditingFornecedor(null); setFormData({nome: '', contato: '', telefone: '', email: '', cnpj: '', observacoes: ''}); setIsOpen(true) }} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
        </Button>
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-zinc-400">Nome</TableHead>
              <TableHead className="text-zinc-400">Contato</TableHead>
              <TableHead className="text-zinc-400">Telefone</TableHead>
              <TableHead className="text-zinc-400">CNPJ</TableHead>
              <TableHead className="text-zinc-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fornecedores.map(f => (
              <TableRow key={f.id} className="border-zinc-800">
                <TableCell className="font-medium">{f.nome}</TableCell>
                <TableCell>{f.contato}</TableCell>
                <TableCell>{f.telefone}</TableCell>
                <TableCell>{f.cnpj}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(f)}>
                    <Edit className="h-4 w-4 text-zinc-400" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>{editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editingFornecedor ? 'Atualize as informações do fornecedor abaixo.' : 'Cadastre um novo fornecedor para gerir seus insumos.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Empresa</Label>
              <Input value={formData.nome || ''} className="bg-zinc-950 border-zinc-800" onChange={(e) => setFormData({...formData, nome: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pessoa de Contato</Label>
                <Input value={formData.contato || ''} className="bg-zinc-950 border-zinc-800" onChange={(e) => setFormData({...formData, contato: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={formData.cnpj || ''} className="bg-zinc-950 border-zinc-800" onChange={(e) => setFormData({...formData, cnpj: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={formData.telefone || ''} className="bg-zinc-950 border-zinc-800" onChange={(e) => setFormData({...formData, telefone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={formData.email || ''} className="bg-zinc-950 border-zinc-800" onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input value={formData.observacoes || ''} className="bg-zinc-950 border-zinc-800" onChange={(e) => setFormData({...formData, observacoes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} className="bg-amber-500">{editingFornecedor ? 'Salvar Alterações' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
