import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Cliente } from '@/types'
import { useToast } from '@/hooks/use-toast'

export function useClientes() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const clientesQuery = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome')
      if (error) {
        console.error('Erro ao buscar clientes:', error)
        throw error
      }
      return data as Cliente[]
    },
    retry: 2,
    staleTime: 1000 * 60 * 5,
  })

  const createCliente = useMutation({
    mutationFn: async (newCliente: Partial<Cliente>) => {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{ ...newCliente, ativo: true }])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast({
        title: 'Sucesso',
        description: 'Cliente cadastrado com sucesso!',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao cadastrar cliente: ' + error.message,
        variant: 'destructive',
      })
    },
  })

  const updateCliente = useMutation({
    mutationFn: async (cliente: Partial<Cliente> & { id: string }) => {
      const { data, error } = await supabase
        .from('clientes')
        .update(cliente)
        .eq('id', cliente.id)
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast({
        title: 'Sucesso',
        description: 'Cliente atualizado com sucesso!',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar cliente: ' + error.message,
        variant: 'destructive',
      })
    },
  })

  return {
    clientes: clientesQuery.data ?? [],
    isLoading: clientesQuery.isLoading,
    isError: clientesQuery.isError,
    error: clientesQuery.error,
    createCliente,
    updateCliente,
  }
}
