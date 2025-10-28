import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
// Funções para gerenciar produtos via Supabase
import { supabase, Insumo, Cliente, Produto, FichaTecnica, Ingrediente, IngredienteComInsumo, Lote, LoteComInsumo, ListaCompras, ItemListaCompras, ItemListaComprasComInsumo, BaixaEstoque, BaixaEstoqueComLote } from './supabaseClient';

export async function getInsumos(): Promise<Insumo[]> {
  const { data, error } = await supabase
    .from('Insumos')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('[Supabase] Erro ao buscar insumos:', error);
    throw new Error(`Erro ao buscar insumos: ${error.message}`);
  }

  return data || [];
}

export async function createInsumo(insumo: Omit<Insumo, 'id' | 'created_at' | 'updated_at'>): Promise<Insumo> {
  const { data, error } = await supabase
    .from('Insumos')
    .insert([insumo])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao criar insumo:', error);
    throw new Error(`Erro ao criar insumo: ${error.message}`);
  }

  return data;
}

export async function updateInsumo(id: string, insumo: Partial<Omit<Insumo, 'id' | 'created_at' | 'updated_at'>>): Promise<Insumo> {
  const { data, error } = await supabase
    .from('Insumos')
    .update(insumo)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao atualizar insumo:', error);
    throw new Error(`Erro ao atualizar insumo: ${error.message}`);
  }

  return data;
}

export async function checkInsumoUsage(id: string): Promise<{ isUsed: boolean; recipes: Array<{ nome: string; quantidade: number }> }> {
  // Buscar ingredientes que usam este insumo
  const { data: ingredientes, error } = await supabase
    .from('ingredientes')
    .select(`
      quantidade,
      fichas_tecnicas (
        nome
      )
    `)
    .eq('insumo_id', id);

  if (error) {
    console.error('[Supabase] Erro ao verificar uso do insumo:', error);
    throw new Error(`Erro ao verificar uso do insumo: ${error.message}`);
  }

  const recipes = (ingredientes || []).map((ing: any) => ({
    nome: ing.fichas_tecnicas?.nome || 'Receita sem nome',
    quantidade: ing.quantidade,
  }));

  return {
    isUsed: recipes.length > 0,
    recipes,
  };
}

export async function deleteInsumo(id: string): Promise<void> {
  const { error } = await supabase
    .from('Insumos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Erro ao deletar insumo:', error);
    throw new Error(`Erro ao deletar insumo: ${error.message}`);
  }
}

// Funções para gerenciar clientes via Supabase
export async function getClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('[Supabase] Erro ao buscar clientes:', error);
    throw new Error(`Erro ao buscar clientes: ${error.message}`);
  }

  return data || [];
}

export async function createCliente(cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert([cliente])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao criar cliente:', error);
    throw new Error(`Erro ao criar cliente: ${error.message}`);
  }

  return data;
}

export async function updateCliente(id: string, cliente: Partial<Omit<Cliente, 'id' | 'created_at' | 'updated_at'>>): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .update(cliente)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao atualizar cliente:', error);
    throw new Error(`Erro ao atualizar cliente: ${error.message}`);
  }

  return data;
}

export async function deleteCliente(id: string): Promise<void> {
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Erro ao deletar cliente:', error);
    throw new Error(`Erro ao deletar cliente: ${error.message}`);
  }
}

// Funções para gerenciar produtos via Supabase
export async function getProdutos(): Promise<Produto[]> {
  const { data, error } = await supabase
    .from('produtos_venda')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('[Supabase] Erro ao buscar produtos:', error);
    throw new Error(`Erro ao buscar produtos: ${error.message}`);
  }

  return data || [];
}

export async function createProduto(produto: Omit<Produto, 'id' | 'created_at' | 'updated_at'>): Promise<Produto> {
  const { data, error } = await supabase
    .from('produtos_venda')
    .insert([produto])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao criar produto:', error);
    throw new Error(`Erro ao criar produto: ${error.message}`);
  }

  return data;
}

export async function updateProduto(id: string, produto: Partial<Omit<Produto, 'id' | 'created_at' | 'updated_at'>>): Promise<Produto> {
  const { data, error } = await supabase
    .from('produtos_venda')
    .update(produto)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao atualizar produto:', error);
    throw new Error(`Erro ao atualizar produto: ${error.message}`);
  }

  return data;
}

export async function deleteProduto(id: string): Promise<void> {
  const { error } = await supabase
    .from('produtos_venda')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Erro ao deletar produto:', error);
    throw new Error(`Erro ao deletar produto: ${error.message}`);
  }
}

// Funções para gerenciar fichas técnicas via Supabase
export async function getFichasTecnicas(): Promise<FichaTecnica[]> {
  const { data, error } = await supabase
    .from('fichas_tecnicas')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('[Supabase] Erro ao buscar fichas técnicas:', error);
    throw new Error(`Erro ao buscar fichas técnicas: ${error.message}`);
  }

  return data || [];
}

export async function createFichaTecnica(ficha: Omit<FichaTecnica, 'id' | 'created_at' | 'updated_at'>): Promise<FichaTecnica> {
  const { data, error } = await supabase
    .from('fichas_tecnicas')
    .insert([ficha])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao criar ficha técnica:', error);
    throw new Error(`Erro ao criar ficha técnica: ${error.message}`);
  }

  return data;
}

export async function updateFichaTecnica(id: string, ficha: Partial<Omit<FichaTecnica, 'id' | 'created_at' | 'updated_at'>>): Promise<FichaTecnica> {
  const { data, error } = await supabase
    .from('fichas_tecnicas')
    .update(ficha)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao atualizar ficha técnica:', error);
    throw new Error(`Erro ao atualizar ficha técnica: ${error.message}`);
  }

  return data;
}

export async function deleteFichaTecnica(id: string): Promise<void> {
  const { error } = await supabase
    .from('fichas_tecnicas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Erro ao deletar ficha técnica:', error);
    throw new Error(`Erro ao deletar ficha técnica: ${error.message}`);
  }
}

// Funções para gerenciar ingredientes via Supabase
export async function getIngredientesByFicha(fichaId: string): Promise<IngredienteComInsumo[]> {
  const { data, error } = await supabase
    .from('ingredientes')
    .select(`
      *,
      Insumos:insumo_id (*)
    `)
    .eq('ficha_tecnica_id', fichaId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Supabase] Erro ao buscar ingredientes:', error);
    throw new Error(`Erro ao buscar ingredientes: ${error.message}`);
  }

  return (data || []).map((item: any) => ({
    ...item,
    insumo: item.Insumos,
  }));
}

export async function createIngrediente(ingrediente: Omit<Ingrediente, 'id' | 'created_at' | 'updated_at'>): Promise<Ingrediente> {
  const { data, error } = await supabase
    .from('ingredientes')
    .insert([ingrediente])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao criar ingrediente:', error);
    throw new Error(`Erro ao criar ingrediente: ${error.message}`);
  }

  return data;
}

export async function updateIngrediente(id: string, ingrediente: Partial<Omit<Ingrediente, 'id' | 'created_at' | 'updated_at'>>): Promise<Ingrediente> {
  const { data, error } = await supabase
    .from('ingredientes')
    .update(ingrediente)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao atualizar ingrediente:', error);
    throw new Error(`Erro ao atualizar ingrediente: ${error.message}`);
  }

  return data;
}

export async function deleteIngrediente(id: string): Promise<void> {
  const { error } = await supabase
    .from('ingredientes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Erro ao deletar ingrediente:', error);
    throw new Error(`Erro ao deletar ingrediente: ${error.message}`);
  }
}


// Funções para gerenciar lotes (estoque) via Supabase
export async function getLotes(insumoId?: string): Promise<LoteComInsumo[]> {
  let query = supabase
    .from('lotes')
    .select(`
      *,
      Insumos:insumo_id (*)
    `)
    .order('data_de_validade', { ascending: true });

  if (insumoId) {
    query = query.eq('insumo_id', insumoId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Supabase] Erro ao buscar lotes:', error);
    throw new Error(`Erro ao buscar lotes: ${error.message}`);
  }

  return (data || []).map((item: any) => ({
    ...item,
    insumo: item.Insumos,
  }));
}

export async function createLote(lote: Omit<Lote, 'id' | 'created_at' | 'updated_at'>): Promise<Lote> {
  const { data, error } = await supabase
    .from('lotes')
    .insert([lote])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao criar lote:', error);
    throw new Error(`Erro ao criar lote: ${error.message}`);
  }

  return data;
}

export async function updateLote(id: string, lote: Partial<Omit<Lote, 'id' | 'created_at' | 'updated_at'>>): Promise<Lote> {
  const { data, error } = await supabase
    .from('lotes')
    .update(lote)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao atualizar lote:', error);
    throw new Error(`Erro ao atualizar lote: ${error.message}`);
  }

  return data;
}

export async function deleteLote(id: string): Promise<void> {
  const { error } = await supabase
    .from('lotes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Erro ao deletar lote:', error);
    throw new Error(`Erro ao deletar lote: ${error.message}`);
  }
}

// Funções para gerenciar listas de compras
export async function getListasCompras(): Promise<ListaCompras[]> {
  const { data, error } = await supabase
    .from('lista_compras')
    .select('*')
    .order('data', { ascending: false });

  if (error) {
    console.error('[Supabase] Erro ao buscar listas de compras:', error);
    throw new Error(`Erro ao buscar listas de compras: ${error.message}`);
  }

  return data || [];
}

export async function createListaCompras(lista: Omit<ListaCompras, 'id' | 'created_at' | 'updated_at'>): Promise<ListaCompras> {
  const { data, error } = await supabase
    .from('lista_compras')
    .insert([lista])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao criar lista de compras:', error);
    throw new Error(`Erro ao criar lista de compras: ${error.message}`);
  }

  return data;
}

export async function updateListaCompras(id: string, lista: Partial<Omit<ListaCompras, 'id' | 'created_at' | 'updated_at'>>): Promise<ListaCompras> {
  const { data, error } = await supabase
    .from('lista_compras')
    .update(lista)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao atualizar lista de compras:', error);
    throw new Error(`Erro ao atualizar lista de compras: ${error.message}`);
  }

  return data;
}

export async function deleteListaCompras(id: string): Promise<void> {
  const { error } = await supabase
    .from('lista_compras')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Erro ao deletar lista de compras:', error);
    throw new Error(`Erro ao deletar lista de compras: ${error.message}`);
  }
}

// Funções para gerenciar itens de lista de compras
export async function getItensListaCompras(listaId: string): Promise<ItemListaComprasComInsumo[]> {
  const { data, error } = await supabase
    .from('itens_lista_compras')
    .select(`
      *,
      Insumos:insumo_id (*)
    `)
    .eq('lista_compras_id', listaId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Supabase] Erro ao buscar itens da lista de compras:', error);
    throw new Error(`Erro ao buscar itens da lista de compras: ${error.message}`);
  }

  return (data || []).map((item: any) => ({
    ...item,
    insumo: item.Insumos,
  }));
}

export async function createItemListaCompras(item: Omit<ItemListaCompras, 'id' | 'created_at' | 'updated_at'>): Promise<ItemListaCompras> {
  const { data, error } = await supabase
    .from('itens_lista_compras')
    .insert([item])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao criar item da lista de compras:', error);
    throw new Error(`Erro ao criar item da lista de compras: ${error.message}`);
  }

  return data;
}

export async function updateItemListaCompras(id: string, item: Partial<Omit<ItemListaCompras, 'id' | 'created_at' | 'updated_at'>>): Promise<ItemListaCompras> {
  const { data, error } = await supabase
    .from('itens_lista_compras')
    .update(item)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao atualizar item da lista de compras:', error);
    throw new Error(`Erro ao atualizar item da lista de compras: ${error.message}`);
  }

  return data;
}

export async function deleteItemListaCompras(id: string): Promise<void> {
  const { error } = await supabase
    .from('itens_lista_compras')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Erro ao deletar item da lista de compras:', error);
    throw new Error(`Erro ao deletar item da lista de compras: ${error.message}`);
  }
}

// Funções para gerenciar baixas de estoque
export async function getBaixasEstoque(loteId?: string): Promise<BaixaEstoqueComLote[]> {
  let query = supabase
    .from('baixas_estoque')
    .select(`
      *,
      lotes:lote_id (
        *,
        Insumos:insumo_id (*)
      )
    `)
    .order('created_at', { ascending: false });

  if (loteId) {
    query = query.eq('lote_id', loteId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Supabase] Erro ao buscar baixas de estoque:', error);
    throw new Error(`Erro ao buscar baixas de estoque: ${error.message}`);
  }

  return (data || []).map((item: any) => ({
    ...item,
    lote: item.lotes ? { ...item.lotes, insumo: item.lotes.Insumos } : undefined,
  }));
}

export async function createBaixaEstoque(baixa: Omit<BaixaEstoque, 'id' | 'created_at'>): Promise<BaixaEstoque> {
  const { data, error } = await supabase
    .from('baixas_estoque')
    .insert([baixa])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao criar baixa de estoque:', error);
    throw new Error(`Erro ao criar baixa de estoque: ${error.message}`);
  }

  return data;
}

export async function deleteBaixaEstoque(id: string): Promise<void> {
  const { error } = await supabase
    .from('baixas_estoque')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Erro ao deletar baixa de estoque:', error);
    throw new Error(`Erro ao deletar baixa de estoque: ${error.message}`);
  }
}

