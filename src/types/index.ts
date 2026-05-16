export type UUID = string
export type TIMESTAMPTZ = string

export interface Usuario {
  id: UUID
  nome: string
  email: string
  role: 'admin' | 'operador'
  ativo: boolean
}

export interface Cliente {
  id: UUID
  nome: string
  telefone: string
  email: string
  cpf: string
  endereco: string
  cidade: string
  observacoes?: string
  ativo: boolean
  created_at?: TIMESTAMPTZ
}

export interface Fornecedor {
  id: UUID
  nome: string
  contato: string
  telefone: string
  email: string
  cnpj: string
  observacoes?: string
  ativo: boolean
  created_at?: TIMESTAMPTZ
}

export interface Material {
  id: UUID
  nome: string
  descricao?: string
  unidade: string
  quantidade_estoque: number
  estoque_minimo: number
  custo_unitario: number
  fornecedor_id: UUID
  ativo: boolean
  created_at?: TIMESTAMPTZ
}

export interface CompraEstoque {
  id: UUID
  material_id: UUID
  fornecedor_id: UUID
  usuario_id: UUID
  quantidade: number
  custo_unitario: number
  custo_total: number
  data_compra: TIMESTAMPTZ
  nota_fiscal?: string
}

export interface Produto {
  id: UUID
  nome: string
  descricao?: string
  categoria: string
  preco_venda: number
  ativo: boolean
  created_at?: TIMESTAMPTZ
}

export interface FichaTecnica {
  id: UUID
  produto_id: UUID
  material_id: UUID
  quantidade_necessaria: number
  observacoes?: string
}

export interface OrdemProducao {
  id: UUID
  produto_id: UUID
  cliente_id: UUID
  usuario_id: UUID
  data_pedido: TIMESTAMPTZ
  data_entrega?: TIMESTAMPTZ
  status: 'pendente' | 'em_producao' | 'concluido' | 'cancelado'
  preco_venda_final: number
  custo_materiais: number
  custo_mao_obra: number
  custo_total: number
  lucro: number
  observacoes?: string
  data_conclusao?: string | null
  created_at?: TIMESTAMPTZ
  
  // Joins
  produto?: Produto
  cliente?: Cliente
}

export interface OrdemMaterialUsado {
  id: UUID
  ordem_id: UUID
  material_id: UUID
  quantidade_usada: number
  custo_unitario: number
  custo_total: number
}

export interface OrdemMaoObra {
  id: UUID
  ordem_id: UUID
  descricao: string
  responsavel: string
  valor: number
}
