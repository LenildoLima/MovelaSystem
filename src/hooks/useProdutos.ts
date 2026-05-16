import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Produto, FichaTecnica, Material } from '@/types'
import { useToast } from '@/hooks/use-toast'

export function useProdutos() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const produtosQuery = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome')
      if (error) {
        console.error('Erro ao buscar produtos:', error)
        throw error
      }
      return data as Produto[]
    },
    retry: 2,
    staleTime: 1000 * 60 * 5,
  })

  const useFichaTecnica = (produtoId?: string) => {
    return useQuery({
      queryKey: ['ficha-tecnica', produtoId],
      queryFn: async () => {
        if (!produtoId) return []
        const { data, error } = await supabase
          .from('ficha_tecnica')
          .select('*, materiais(*)')
          .eq('produto_id', produtoId)
        if (error) throw error
        return data as (FichaTecnica & { materiais: Material })[]
      },
      enabled: !!produtoId,
    })
  }

  const createProduto = useMutation({
    mutationFn: async (newProduto: Partial<Produto>) => {
      const { data, error } = await supabase
        .from('produtos')
        .insert([{ ...newProduto, ativo: true }])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast({
        title: 'Sucesso',
        description: 'Produto cadastrado com sucesso!',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao cadastrar produto: ' + error.message,
        variant: 'destructive',
      })
    },
  })

  const addItemFicha = useMutation({
    mutationFn: async (item: Partial<FichaTecnica>) => {
      const { data, error } = await supabase
        .from('ficha_tecnica')
        .insert([item])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ficha-tecnica', variables.produto_id] })
      toast({
        title: 'Sucesso',
        description: 'Item adicionado à ficha técnica!',
      })
    },
  })

  const removeItemFicha = useMutation({
    mutationFn: async ({ id }: { id: string; produtoId: string }) => {
      const { error } = await supabase
        .from('ficha_tecnica')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ficha-tecnica', variables.produtoId] })
      toast({
        title: 'Sucesso',
        description: 'Item removido da ficha técnica!',
      })
    },
  })

  return {
    produtos: produtosQuery.data ?? [],
    isLoading: produtosQuery.isLoading,
    isError: produtosQuery.isError,
    error: produtosQuery.error,
    createProduto,
    useFichaTecnica,
    addItemFicha,
    removeItemFicha,
  }
}
