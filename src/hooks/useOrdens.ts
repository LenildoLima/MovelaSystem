import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { OrdemProducao, OrdemMaoObra } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

export function useOrdens() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()

  const ordensQuery = useQuery({
    queryKey: ['ordens'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_producao')
        .select('*, produto:produtos(*), cliente:clientes(*)')
        .order('data_pedido', { ascending: false })
      if (error) {
        console.error('Erro ao buscar ordens:', error)
        throw error
      }
      return data as OrdemProducao[]
    },
    retry: 2,
    staleTime: 1000 * 60 * 5,
  })

  const createOrdem = useMutation({
    mutationFn: async (newOrdem: Partial<OrdemProducao>) => {
      // 1. Buscar ficha técnica com todos os materiais necessários
      const { data: ficha, error: fichaError } = await supabase
        .from('ficha_tecnica')
        .select('id, material_id, quantidade_necessaria, materiais(id, nome, quantidade_estoque, custo_unitario)')
        .eq('produto_id', newOrdem.produto_id)

      if (fichaError) {
        console.error('Erro ao buscar ficha técnica:', fichaError)
        throw new Error('Erro ao buscar ficha técnica do produto')
      }

      // 2. Verificar estoque disponível
      const itensInsuficientes = ficha?.filter(
        (item: any) => item.materiais.quantidade_estoque < item.quantidade_necessaria
      )

      if (itensInsuficientes && itensInsuficientes.length > 0) {
        const nomes = itensInsuficientes.map((i: any) => i.materiais.nome).join(', ')
        throw new Error(`Estoque insuficiente para: ${nomes}`)
      }

      // 3. Inserir ordem de produção
      const { data: ordem, error: ordemError } = await supabase
        .from('ordens_producao')
        .insert([{ ...newOrdem, usuario_id: user?.id, status: 'pendente' }])
        .select()
        .single()

      if (ordemError) {
        console.error('Erro ao criar ordem:', ordemError)
        throw ordemError
      }

      // 4. Inserir materiais usados com base na ficha técnica
      if (ficha && ficha.length > 0) {
        const materiaisUsados = ficha.map((item: any) => ({
          ordem_id: ordem.id,
          material_id: item.material_id,
          quantidade_usada: item.quantidade_necessaria,
          custo_unitario: item.materiais.custo_unitario,
        }))

        console.log('Inserindo materiais:', materiaisUsados)

        const { error: matError } = await supabase
          .from('ordem_materiais_usados')
          .insert(materiaisUsados)

        if (matError) {
          console.error('Erro ao inserir materiais usados:', matError)
          throw new Error(`Erro ao registrar materiais: ${matError.message}`)
        }
      } else {
        console.warn('Nenhum material encontrado na ficha técnica')
      }

      return ordem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens'] })
      queryClient.invalidateQueries({ queryKey: ['materiais'] })
      toast({
        title: 'Sucesso',
        description: 'Ordem de produção criada com sucesso!',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateStatusOrdem = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrdemProducao['status'] }) => {
      const updates: any = { status }
      if (status === 'concluido') {
        updates.data_conclusao = new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('ordens_producao')
        .update(updates)
        .eq('id', id)
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ordens'] })
      queryClient.invalidateQueries({ queryKey: ['ordem-detalhes', variables.id] })
      toast({
        title: 'Sucesso',
        description: 'Status da ordem atualizado!',
      })
    },
  })

  const addMaoObra = useMutation({
    mutationFn: async (maoObra: Partial<OrdemMaoObra>) => {
      const { data, error } = await supabase
        .from('ordem_mao_obra')
        .insert([maoObra])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ordens'] })
      queryClient.invalidateQueries({ queryKey: ['ordem-detalhes', variables.ordem_id] })
      toast({
        title: 'Sucesso',
        description: 'Mão de obra adicionada!',
      })
    },
  })

  const cancelOrdem = useMutation({
    mutationFn: async ({ id, devolverEstoque }: { id: string; devolverEstoque: boolean }) => {
      if (!devolverEstoque) {
        // Deleta os registros de materiais usados para que o trigger não faça o estorno
        const { error: deleteError } = await supabase
          .from('ordem_materiais_usados')
          .delete()
          .eq('ordem_id', id)
        
        if (deleteError) throw deleteError
      }

      const { data, error } = await supabase
        .from('ordens_producao')
        .update({ status: 'cancelado' })
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens'] })
      queryClient.invalidateQueries({ queryKey: ['materiais'] })
      toast({
        title: 'Sucesso',
        description: 'Ordem cancelada com sucesso!',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cancelar ordem',
        description: error.message,
        variant: 'destructive',
      })
    }
  })

  const getDetalhesOrdem = (ordemId: string) => {
    return useQuery({
      queryKey: ['ordem-detalhes', ordemId],
      queryFn: async () => {
        const [ordem, materiais, maoObra] = await Promise.all([
          supabase.from('ordens_producao').select('*, produto:produtos(*), cliente:clientes(*)').eq('id', ordemId).single(),
          supabase.from('ordem_materiais_usados').select('*, materiais(*)').eq('ordem_id', ordemId),
          supabase.from('ordem_mao_obra').select('*').eq('ordem_id', ordemId)
        ])
        return {
          ordem: ordem.data as OrdemProducao,
          materiais: materiais.data || [],
          maoObra: maoObra.data || []
        }
      },
      enabled: !!ordemId
    })
  }

  return {
    ordens: ordensQuery.data ?? [],
    isLoading: ordensQuery.isLoading,
    isError: ordensQuery.isError,
    error: ordensQuery.error,
    createOrdem,
    updateStatusOrdem,
    cancelOrdem,
    addMaoObra,
    getDetalhesOrdem
  }
}
