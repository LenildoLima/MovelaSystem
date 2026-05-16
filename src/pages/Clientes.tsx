import { useState } from 'react'
import { useClientes } from '@/hooks/useClientes'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit } from 'lucide-react'

export function Clientes() {
  const { clientes, isLoading, isError, error, createCliente, updateCliente } = useClientes()
  const [isOpen, setIsOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<any>(null)

  const [formData, setFormData] = useState({
    nome: '', telefone: '', email: '', cpf: '', endereco: '', cidade: '', observacoes: ''
  })

  if (isError) {
    return (
      <div className="p-8 bg-rose-950 border border-rose-800 rounded-lg">
        <h2 className="text-rose-400 font-semibold mb-2">Erro ao carregar clientes</h2>
        <p className="text-rose-300 text-sm">{error?.message || 'Erro desconhecido'}</p>
      </div>
    )
  }

  if (isLoading) return <div className="p-8 text-zinc-400">Carregando clientes...</div>

  const handleSave = () => {
    if (editingCliente) {
      updateCliente.mutate({ id: editingCliente.id, ...formData }, { onSuccess: () => setIsOpen(false) })
    } else {
      createCliente.mutate(formData, { onSuccess: () => setIsOpen(false) })
    }
  }

  const openEdit = (cliente: any) => {
    setEditingCliente(cliente)
    setFormData(cliente)
    setIsOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Clientes</h1>
        <Button onClick={() => { setEditingCliente(null); setFormData({nome: '', telefone: '', email: '', cpf: '', endereco: '', cidade: '', observacoes: ''}); setIsOpen(true) }} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-zinc-400">Nome</TableHead>
              <TableHead className="text-zinc-400">Telefone</TableHead>
              <TableHead className="text-zinc-400">Email</TableHead>
              <TableHead className="text-zinc-400">Cidade</TableHead>
              <TableHead className="text-zinc-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map(c => (
              <TableRow key={c.id} className="border-zinc-800">
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>{c.telefone}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.cidade}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
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
            <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editingCliente ? 'Atualize as informações do cliente abaixo.' : 'Preencha os dados para cadastrar um novo cliente no sistema.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={formData.nome || ''} className="bg-zinc-950 border-zinc-800" onChange={(e) => setFormData({...formData, nome: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={formData.telefone || ''} className="bg-zinc-950 border-zinc-800" onChange={(e) => setFormData({...formData, telefone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={formData.cpf || ''} className="bg-zinc-950 border-zinc-800" onChange={(e) => setFormData({...formData, cpf: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.email || ''} className="bg-zinc-950 border-zinc-800" onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input value={formData.endereco || ''} className="bg-zinc-950 border-zinc-800" onChange={(e) => setFormData({...formData, endereco: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={formData.cidade || ''} className="bg-zinc-950 border-zinc-800" onChange={(e) => setFormData({...formData, cidade: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} className="bg-amber-500">{editingCliente ? 'Salvar Alterações' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
