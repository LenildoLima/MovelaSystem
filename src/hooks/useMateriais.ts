import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Material, CompraEstoque } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

export function useMateriais() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()

  const materiaisQuery = useQuery({
    queryKey: ['materiais'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materiais')
        .select('*')
        .order('nome')
      if (error) {
        console.error('Erro ao buscar materiais:', error)
        throw error
      }
      return data as Material[]
    },
    retry: 2,
    staleTime: 1000 * 60 * 5,
  })

  const createMaterial = useMutation({
    mutationFn: async (newMaterial: Partial<Material>) => {
      const { data, error } = await supabase
        .from('materiais')
        .insert([{ ...newMaterial, ativo: true }])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] })
      toast({
        title: 'Sucesso',
        description: 'Material cadastrado com sucesso!',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao cadastrar material: ' + error.message,
        variant: 'destructive',
      })
    },
  })

  const registrarEntrada = useMutation({
    mutationFn: async (entrada: Partial<CompraEstoque>) => {
      const { data, error } = await supabase
        .from('compras_estoque')
        .insert([{ ...entrada, usuario_id: user?.id }])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] })
      toast({
        title: 'Sucesso',
        description: 'Entrada de estoque registrada!',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao registrar entrada: ' + error.message,
        variant: 'destructive',
      })
    },
  })

  return {
    materiais: materiaisQuery.data ?? [],
    isLoading: materiaisQuery.isLoading,
    isError: materiaisQuery.isError,
    error: materiaisQuery.error,
    createMaterial,
    registrarEntrada,
  }
}
