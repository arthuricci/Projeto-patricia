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
import { supabase, Insumo, Cliente, Produto, FichaTecnica, Ingrediente, IngredienteComInsumo, Lote, LoteComInsumo, ListaCompras, ItemListaCompras, ItemListaComprasComInsumo, BaixaEstoque, BaixaEstoqueComLote, OrdemProducao, OrdemProducaoComProduto } from './supabaseClient';

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

export async function createLote(lote: Omit<Lote, 'id' | 'created_at' | 'updated_at'> & { created_at?: string | null }): Promise<Lote> {
  const { created_at, ...loteData } = lote;
  
  // Fix timezone issue: convert date string to proper format
  // If created_at is a date string like "2025-11-15", ensure it's treated as local time
  let dataToInsert: any = loteData;
  if (created_at) {
    // Parse the date string and ensure it's stored correctly
    // Format: YYYY-MM-DD HH:mm:ss for MySQL
    const dateObj = new Date(created_at + 'T00:00:00');
    const formattedDate = dateObj.toISOString().split('T')[0]; // Keep as YYYY-MM-DD
    dataToInsert = { ...loteData, created_at: formattedDate };
  }
  
  const { data, error } = await supabase
    .from('lotes')
    .insert([dataToInsert])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao criar lote:', error);
    throw new Error(`Erro ao criar lote: ${error.message}`);
  }

  return data;
}

export async function updateLote(id: string, lote: Partial<Omit<Lote, 'id' | 'created_at' | 'updated_at'>> & { created_at?: string | null }): Promise<Lote> {
  // Fix timezone issue for created_at if provided
  let dataToUpdate: any = lote;
  if (lote.created_at && typeof lote.created_at === 'string') {
    const dateObj = new Date(lote.created_at + 'T00:00:00');
    const formattedDate = dateObj.toISOString().split('T')[0];
    dataToUpdate = { ...lote, created_at: formattedDate };
  }
  
  const { data, error } = await supabase
    .from('lotes')
    .update(dataToUpdate)
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

export async function getListasComprasComTotal(): Promise<any[]> {
  const listas = await getListasCompras();
  const todosItens = await getAllItensListaCompras();
  
  return listas.map((lista: any) => {
    const precoTotal = todosItens
      .filter((item: any) => item.lista_compras_id === lista.id)
      .reduce((total: number, item: any) => {
        const preco = item.insumo?.preco_medio_por_unidade || 0;
        return total + (item.quantidade * preco);
      }, 0);
    
    return {
      ...lista,
      preco_total: precoTotal,
    };
  });
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
// Get all items for all lists (used for calculating totals)
export async function getAllItensListaCompras(): Promise<ItemListaComprasComInsumo[]> {
  const { data, error } = await supabase
    .from('itens_lista_compras')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Supabase] Erro ao buscar todos os itens de listas de compras:', error);
    throw new Error(`Erro ao buscar itens: ${error.message}`);
  }

  const itens = data || [];
  const insumosIdsSet = new Set(itens.map((item: any) => item.insumo_id));
  const insumosIds = Array.from(insumosIdsSet);
  
  if (insumosIds.length === 0) {
    return itens.map((item: any) => ({
      ...item,
      insumo: null,
    }));
  }

  const { data: insumosData } = await supabase
    .from('Insumos')
    .select('*')
    .in('id', insumosIds);

  const insumosMap = (insumosData || []).reduce((acc: any, insumo: any) => {
    acc[insumo.id] = insumo;
    return acc;
  }, {});

  return itens.map((item: any) => ({
    ...item,
    insumo: insumosMap[item.insumo_id] || null,
  }));
}

export async function getItensListaCompras(listaId: string): Promise<ItemListaComprasComInsumo[]> {
  const { data, error } = await supabase
    .from('itens_lista_compras')
    .select('*')
    .eq('lista_compras_id', listaId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Supabase] Erro ao buscar itens da lista de compras:', error);
    throw new Error(`Erro ao buscar itens da lista de compras: ${error.message}`);
  }

  const itens = data || [];
  const insumosIdsSet = new Set(itens.map((item: any) => item.insumo_id));
  const insumosIds = Array.from(insumosIdsSet);
  
  if (insumosIds.length === 0) {
    return itens.map((item: any) => ({
      ...item,
      insumo: null,
    }));
  }

  const { data: insumosData } = await supabase
    .from('Insumos')
    .select('*')
    .in('id', insumosIds);

  const insumosMap = (insumosData || []).reduce((acc: any, insumo: any) => {
    acc[insumo.id] = insumo;
    return acc;
  }, {});

  return itens.map((item: any) => ({
    ...item,
    insumo: insumosMap[item.insumo_id] || null,
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
    .select('*')
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




export async function getInsumosCriticos(): Promise<Array<Insumo & { quantidade_estoque: number }>> {
  // Buscar todos os insumos
  const insumos = await getInsumos();
  
  // Buscar todos os lotes
  const lotes = await getLotes();
  
  // Calcular quantidade em estoque por insumo
  const insumosComEstoque = insumos.map((insumo) => {
    const quantidadeTotal = lotes
      .filter((lote: any) => lote.insumo_id === insumo.id)
      .reduce((sum: number, lote: any) => sum + (lote.quantidade_atual || 0), 0);
    
    return {
      ...insumo,
      quantidade_estoque: quantidadeTotal,
    };
  });
  
  // Retornar apenas insumos com estoque <= nível mínimo
  return insumosComEstoque.filter((insumo) => insumo.quantidade_estoque <= insumo.nivel_minimo);
}



// ===== ORDENS DE PRODUÇÃO =====

export async function getOrdensProducao(): Promise<OrdemProducaoComProduto[]> {
  const { data, error } = await supabase
    .from('ordens_producao')
    .select(`
      *,
      produtos_venda:produto_id (
        id,
        nome,
        descricao,
        preco_venda,
        foto_url,
        ativo
      )
    `)
    .order('data_inicio', { ascending: false });

  if (error) {
    console.error('[Supabase] Erro ao buscar ordens de produção:', error);
    throw new Error(`Erro ao buscar ordens de produção: ${error.message}`);
  }

  return (data || []).map((item: any) => ({
    ...item,
    produto: item.produtos_venda,
  }));
}

export async function getOrdemProducaoById(id: string): Promise<OrdemProducaoComProduto | null> {
  const { data, error } = await supabase
    .from('ordens_producao')
    .select(`
      *,
      produtos_venda:produto_id (
        id,
        nome,
        descricao,
        preco_venda,
        foto_url,
        ativo
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('[Supabase] Erro ao buscar ordem de produção:', error);
    throw new Error(`Erro ao buscar ordem de produção: ${error.message}`);
  }

  return data ? { ...data, produto: data.produtos_venda } : null;
}

export async function createOrdemProducao(
  ordem: Omit<OrdemProducao, 'id' | 'created_at' | 'updated_at'>
): Promise<OrdemProducao> {
  const { data, error } = await supabase
    .from('ordens_producao')
    .insert([ordem])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao criar ordem de produção:', error);
    throw new Error(`Erro ao criar ordem de produção: ${error.message}`);
  }

  return data;
}

export async function updateOrdemProducao(
  id: string,
  ordem: Partial<Omit<OrdemProducao, 'id' | 'created_at' | 'updated_at'>>
): Promise<OrdemProducao> {
  const { data, error } = await supabase
    .from('ordens_producao')
    .update(ordem)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Erro ao atualizar ordem de produção:', error);
    throw new Error(`Erro ao atualizar ordem de produção: ${error.message}`);
  }

  return data;
}

export async function deleteOrdemProducao(id: string): Promise<void> {
  const { error } = await supabase
    .from('ordens_producao')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Erro ao deletar ordem de produção:', error);
    throw new Error(`Erro ao deletar ordem de produção: ${error.message}`);
  }
}

export async function getOrdensProducaoPorProduto(produtoId: string): Promise<OrdemProducao[]> {
  const { data, error } = await supabase
    .from('ordens_producao')
    .select('*')
    .eq('produto_id', produtoId)
    .order('data_inicio', { ascending: false });

  if (error) {
    console.error('[Supabase] Erro ao buscar ordens de produção por produto:', error);
    throw new Error(`Erro ao buscar ordens de produção por produto: ${error.message}`);
  }

  return data || [];
}



// ===== STOCK DEDUCTION FOR PRODUCTION =====

export async function getProductFichasTecnicas(produtoId: string): Promise<FichaTecnica[]> {
  // Get the product-ficha association from the junction table
  const { data, error } = await supabase
    .from('produto_fichas_tecnicas')
    .select(`
      fichas_tecnicas (
        id,
        nome,
        modo_de_preparo,
        rendimento_total,
        unidade_rendimento
      )
    `)
    .eq('produto_id', produtoId);

  if (error) {
    console.error('[Supabase] Erro ao buscar fichas técnicas do produto:', error);
    throw new Error(`Erro ao buscar fichas técnicas do produto: ${error.message}`);
  }

  return (data || []).map((item: any) => item.fichas_tecnicas);
}

export async function validateStockForProduction(
  produtoId: string,
  quantidade: number
): Promise<{ isValid: boolean; message?: string; ingredientesNecessarios?: any[] }> {
  try {
    // Get product's technical sheets
    const fichas = await getProductFichasTecnicas(produtoId);
    
    if (!fichas || fichas.length === 0) {
      return { isValid: true, message: 'Produto sem fichas técnicas associadas' };
    }

    // Collect all ingredients from all technical sheets
    const ingredientesNecessarios: any[] = [];
    
    for (const ficha of fichas) {
      const ingredientes = await getIngredientesByFicha(ficha.id);
      ingredientesNecessarios.push(...ingredientes);
    }

    if (ingredientesNecessarios.length === 0) {
      return { isValid: true, message: 'Nenhum ingrediente necessário' };
    }

    // Get all batches (lotes)
    const lotes = await getLotes();

    // Validate stock for each ingredient
    for (const ingrediente of ingredientesNecessarios) {
      const quantidadeNecessaria = (ingrediente.quantidade || 0) * quantidade;
      
      // Get total available stock for this ingredient
      const lotesDoInsumo = lotes.filter((lote: any) => lote.insumo_id === ingrediente.insumo_id);
      const quantidadeDisponivel = lotesDoInsumo.reduce((sum: number, lote: any) => sum + (lote.quantidade_atual || 0), 0);

      if (quantidadeDisponivel < quantidadeNecessaria) {
        return {
          isValid: false,
          message: `Estoque insuficiente de ${ingrediente.insumo?.nome || 'ingrediente'}: necessário ${quantidadeNecessaria}, disponível ${quantidadeDisponivel}`,
          ingredientesNecessarios,
        };
      }
    }

    return { isValid: true, ingredientesNecessarios };
  } catch (error) {
    console.error('[Database] Erro ao validar estoque:', error);
    throw error;
  }
}

export async function deductStockForProduction(
  ordemId: string,
  produtoId: string,
  quantidade: number
): Promise<{ success: boolean; message?: string }> {
  try {
    // Get product's technical sheets
    const fichas = await getProductFichasTecnicas(produtoId);
    
    if (!fichas || fichas.length === 0) {
      return { success: true, message: 'Nenhuma ficha técnica para dedução' };
    }

    // Collect all ingredients from all technical sheets
    const ingredientesNecessarios: any[] = [];
    
    for (const ficha of fichas) {
      const ingredientes = await getIngredientesByFicha(ficha.id);
      ingredientesNecessarios.push(...ingredientes);
    }

    // Get all batches (lotes)
    const lotes = await getLotes();

    // Deduct stock for each ingredient using FIFO (oldest batches first)
    for (const ingrediente of ingredientesNecessarios) {
      const quantidadeNecessaria = (ingrediente.quantidade || 0) * quantidade;
      
      // Get batches for this ingredient, sorted by date (oldest first)
      const lotesDoInsumo = lotes
        .filter((lote: any) => lote.insumo_id === ingrediente.insumo_id)
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      let quantidadeAindaNecessaria = quantidadeNecessaria;

      // Deduct from batches in FIFO order
      for (const lote of lotesDoInsumo) {
        if (quantidadeAindaNecessaria <= 0) break;

        const quantidadeDisponivel = lote.quantidade_atual || 0;
        const quantidadeADedu = Math.min(quantidadeDisponivel, quantidadeAindaNecessaria);

        if (quantidadeADedu > 0) {
          // Update lote quantity
          const novaQuantidade = quantidadeDisponivel - quantidadeADedu;
          await updateLote(lote.id, { quantidade_atual: novaQuantidade });

          // Create baixa_estoque record
          await createBaixaEstoque({
            lote_id: lote.id,
            quantidade_baixada: quantidadeADedu,
            motivo: 'producao',
            referencia_producao_id: ordemId,
          });

          quantidadeAindaNecessaria -= quantidadeADedu;
        }
      }

      if (quantidadeAindaNecessaria > 0) {
        return {
          success: false,
          message: `Não foi possível deduzir quantidade suficiente de ${ingrediente.insumo?.nome || 'ingrediente'}`,
        };
      }
    }

    return { success: true, message: 'Estoque deduzido com sucesso' };
  } catch (error) {
    console.error('[Database] Erro ao deduzir estoque:', error);
    throw error;
  }
}




// ===== CÁLCULO DE PREÇO MÉDIO =====

export async function atualizarPrecoMedioPorUnidade(insumoId: string): Promise<void> {
  try {
    console.log(`[DEBUG] Iniciando calculo de preco medio para insumo: ${insumoId}`);
    
    // Busca todos os lotes do insumo que têm preco_por_unidade
    const { data: lotes, error: errorLotes } = await supabase
      .from('lotes')
      .select('preco_por_unidade')
      .eq('insumo_id', insumoId)
      .not('preco_por_unidade', 'is', null);

    console.log(`[DEBUG] Lotes encontrados: ${lotes?.length || 0}`, lotes);

    if (errorLotes) {
      console.error('[Supabase] Erro ao buscar lotes:', errorLotes);
      return;
    }

    if (!lotes || lotes.length === 0) {
      console.log(`[DEBUG] Nenhum lote com preco encontrado para insumo ${insumoId}`);
      return;
    }

    // Calcula média simples
    const soma = lotes.reduce((acc: number, lote: any) => acc + (lote.preco_por_unidade || 0), 0);
    const media = soma / lotes.length;
    
    console.log(`[DEBUG] Media calculada: ${media} (soma: ${soma}, quantidade: ${lotes.length})`);

    // Atualiza insumo com o novo preço médio
    const { error: errorUpdate } = await supabase
      .from('Insumos')
      .update({ preco_medio_por_unidade: media })
      .eq('id', insumoId);

    if (errorUpdate) {
      console.error('[Supabase] Erro ao atualizar preco medio:', errorUpdate);
    } else {
      console.log(`[DEBUG] Preco medio atualizado com sucesso para ${media}`);
    }
  } catch (error) {
    console.error('[Database] Erro ao calcular preco medio:', error);
  }
}




// ===== CÁLCULO DE ESTOQUE ATUAL (DINÂMICO) =====

export interface EstoqueAtual {
  insumo_id: string;
  quantidade_inicial_total: number;
  quantidade_baixada_total: number;
  estoque_atual: number;
}

export async function getEstoqueAtualPorInsumo(insumoId: string): Promise<EstoqueAtual | null> {
  try {
    // Buscar todos os lotes do insumo
    const { data: lotes, error: errorLotes } = await supabase
      .from('lotes')
      .select('id, quantidade_inicial')
      .eq('insumo_id', insumoId);

    if (errorLotes) {
      console.error('[Supabase] Erro ao buscar lotes:', errorLotes);
      throw new Error(`Erro ao buscar lotes: ${errorLotes.message}`);
    }

    if (!lotes || lotes.length === 0) {
      return {
        insumo_id: insumoId,
        quantidade_inicial_total: 0,
        quantidade_baixada_total: 0,
        estoque_atual: 0,
      };
    }

    // Calcular quantidade inicial total
    const quantidadeInicialTotal = lotes.reduce(
      (sum: number, lote: any) => sum + (lote.quantidade_inicial || 0),
      0
    );

    // Buscar todas as baixas para este insumo
    const { data: baixas, error: errorBaixas } = await supabase
      .from('baixas_estoque')
      .select('quantidade_baixada')
      .in('lote_id', lotes.map((l: any) => l.id));

    if (errorBaixas) {
      console.error('[Supabase] Erro ao buscar baixas:', errorBaixas);
      throw new Error(`Erro ao buscar baixas: ${errorBaixas.message}`);
    }

    // Calcular quantidade baixada total
    const quantidadeBaixadaTotal = (baixas || []).reduce(
      (sum: number, baixa: any) => sum + (baixa.quantidade_baixada || 0),
      0
    );

    // Calcular estoque atual
    const estoqueAtual = quantidadeInicialTotal - quantidadeBaixadaTotal;

    return {
      insumo_id: insumoId,
      quantidade_inicial_total: quantidadeInicialTotal,
      quantidade_baixada_total: quantidadeBaixadaTotal,
      estoque_atual: Math.max(0, estoqueAtual), // Nunca negativo
    };
  } catch (error) {
    console.error('[Database] Erro ao calcular estoque atual:', error);
    throw error;
  }
}

export async function getEstoqueAtualTodos(): Promise<EstoqueAtual[]> {
  try {
    // Buscar todos os insumos
    const insumos = await getInsumos();

    // Calcular estoque atual para cada insumo
    const estoqueAtualList: EstoqueAtual[] = [];
    for (const insumo of insumos) {
      const estoque = await getEstoqueAtualPorInsumo(insumo.id);
      if (estoque) {
        estoqueAtualList.push(estoque);
      }
    }

    return estoqueAtualList;
  } catch (error) {
    console.error('[Database] Erro ao calcular estoque atual de todos os insumos:', error);
    throw error;
  }
}

