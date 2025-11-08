import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uarmuedfvqnguortykva.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcm11ZWRmdnFuZ3VvcnR5a3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTA4MDcsImV4cCI6MjA3NjQ2NjgwN30.sUpMrpkCNcCDH80WJknX-bUeK5gyB1oSVWUbPcPsZQs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Insumo {
  id: string;
  nome: string;
  unidade_base: string;
  nivel_minimo: number;
  tipo_produto?: string;
  preco_medio_por_unidade?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Cliente {
  id: string;
  nome: string | null;
  telefone: string | null;
  instagram: string | null;
  observacoes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Produto {
  id: string;
  nome: string | null;
  descricao: string | null;
  preco_venda: number | null;
  foto_url: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FichaTecnica {
  id: string;
  nome: string | null;
  modo_de_preparo: string | null;
  rendimento_total: number | null;
  unidade_rendimento: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Ingrediente {
  id: string;
  ficha_tecnica_id: string;
  insumo_id: string;
  quantidade: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface IngredienteComInsumo extends Ingrediente {
  insumo?: Insumo;
}

export interface Lote {
  id: string;
  insumo_id: string;
  quantidade_inicial: number | null;
  quantidade_atual: number | null;
  data_de_validade: string | null;
  custo_total_lote: number | null;
  preco_por_unidade?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoteComInsumo extends Lote {
  insumo?: Insumo;
}

export interface ListaCompras {
  id: string;
  nome: string | null;
  data: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ItemListaCompras {
  id: string;
  lista_compras_id: string;
  insumo_id: string;
  quantidade: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ItemListaComprasComInsumo extends ItemListaCompras {
  insumo?: Insumo;
}

export interface BaixaEstoque {
  id: string;
  lote_id: string;
  quantidade_baixada: number | null;
  motivo: string | null;
  referencia_producao_id: string | null;
  created_at?: string;
}

export interface BaixaEstoqueComLote extends BaixaEstoque {
  lote?: LoteComInsumo;
}


export interface OrdemProducao {
  id: string;
  produto_id: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  quantidade_produzida: number;
  data_inicio: string;
  data_conclusao: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrdemProducaoComProduto extends OrdemProducao {
  produto?: Produto;
}

