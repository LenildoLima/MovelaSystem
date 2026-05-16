import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Fornecedor } from '@/types'
import { useToast } from '@/hooks/use-toast'

export function useFornecedores() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const fornecedoresQuery = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome')
      if (error) {
        console.error('Erro ao buscar fornecedores:', error)
        throw error
      }
      return data as Fornecedor[]
    },
    retry: 2,
    staleTime: 1000 * 60 * 5,
  })

  const createFornecedor = useMutation({
    mutationFn: async (newFornecedor: Partial<Fornecedor>) => {
      const { data, error } = await supabase
        .from('fornecedores')
        .insert([{ ...newFornecedor, ativo: true }])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] })
      toast({
        title: 'Sucesso',
        description: 'Fornecedor cadastrado com sucesso!',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao cadastrar fornecedor: ' + error.message,
        variant: 'destructive',
      })
    },
  })

  const updateFornecedor = useMutation({
    mutationFn: async (fornecedor: Partial<Fornecedor> & { id: string }) => {
      const { data, error } = await supabase
        .from('fornecedores')
        .update(fornecedor)
        .eq('id', fornecedor.id)
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] })
      toast({
        title: 'Sucesso',
        description: 'Fornecedor atualizado com sucesso!',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar fornecedor: ' + error.message,
        variant: 'destructive',
      })
    },
  })

  return {
    fornecedores: fornecedoresQuery.data ?? [],
    isLoading: fornecedoresQuery.isLoading,
    isError: fornecedoresQuery.isError,
    error: fornecedoresQuery.error,
    createFornecedor,
    updateFornecedor,
  }
}
