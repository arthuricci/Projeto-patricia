// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /**
   * Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user.
   * This mirrors the Manus account and should be used for authentication lookups.
   */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = "https://uarmuedfvqnguortykva.supabase.co";
var supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcm11ZWRmdnFuZ3VvcnR5a3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTA4MDcsImV4cCI6MjA3NjQ2NjgwN30.sUpMrpkCNcCDH80WJknX-bUeK5gyB1oSVWUbPcPsZQs";
var supabase = createClient(supabaseUrl, supabaseAnonKey);

// server/db.ts
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUser(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getInsumos() {
  const { data, error } = await supabase.from("Insumos").select("*").order("nome", { ascending: true });
  if (error) {
    console.error("[Supabase] Erro ao buscar insumos:", error);
    throw new Error(`Erro ao buscar insumos: ${error.message}`);
  }
  return data || [];
}
async function createInsumo(insumo) {
  const { data, error } = await supabase.from("Insumos").insert([insumo]).select().single();
  if (error) {
    console.error("[Supabase] Erro ao criar insumo:", error);
    throw new Error(`Erro ao criar insumo: ${error.message}`);
  }
  return data;
}
async function updateInsumo(id, insumo) {
  const { data, error } = await supabase.from("Insumos").update(insumo).eq("id", id).select().single();
  if (error) {
    console.error("[Supabase] Erro ao atualizar insumo:", error);
    throw new Error(`Erro ao atualizar insumo: ${error.message}`);
  }
  return data;
}
async function checkInsumoUsage(id) {
  const { data: ingredientes, error } = await supabase.from("ingredientes").select(`
      quantidade,
      fichas_tecnicas (
        nome
      )
    `).eq("insumo_id", id);
  if (error) {
    console.error("[Supabase] Erro ao verificar uso do insumo:", error);
    throw new Error(`Erro ao verificar uso do insumo: ${error.message}`);
  }
  const recipes = (ingredientes || []).map((ing) => ({
    nome: ing.fichas_tecnicas?.nome || "Receita sem nome",
    quantidade: ing.quantidade
  }));
  return {
    isUsed: recipes.length > 0,
    recipes
  };
}
async function deleteInsumo(id) {
  const { error } = await supabase.from("Insumos").delete().eq("id", id);
  if (error) {
    console.error("[Supabase] Erro ao deletar insumo:", error);
    throw new Error(`Erro ao deletar insumo: ${error.message}`);
  }
}
async function getClientes() {
  const { data, error } = await supabase.from("clientes").select("*").order("nome", { ascending: true });
  if (error) {
    console.error("[Supabase] Erro ao buscar clientes:", error);
    throw new Error(`Erro ao buscar clientes: ${error.message}`);
  }
  return data || [];
}
async function createCliente(cliente) {
  const { data, error } = await supabase.from("clientes").insert([cliente]).select().single();
  if (error) {
    console.error("[Supabase] Erro ao criar cliente:", error);
    throw new Error(`Erro ao criar cliente: ${error.message}`);
  }
  return data;
}
async function updateCliente(id, cliente) {
  const { data, error } = await supabase.from("clientes").update(cliente).eq("id", id).select().single();
  if (error) {
    console.error("[Supabase] Erro ao atualizar cliente:", error);
    throw new Error(`Erro ao atualizar cliente: ${error.message}`);
  }
  return data;
}
async function deleteCliente(id) {
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) {
    console.error("[Supabase] Erro ao deletar cliente:", error);
    throw new Error(`Erro ao deletar cliente: ${error.message}`);
  }
}
async function getProdutos() {
  const { data, error } = await supabase.from("produtos_venda").select("*").order("nome", { ascending: true });
  if (error) {
    console.error("[Supabase] Erro ao buscar produtos:", error);
    throw new Error(`Erro ao buscar produtos: ${error.message}`);
  }
  return data || [];
}
async function createProduto(produto) {
  const { data, error } = await supabase.from("produtos_venda").insert([produto]).select().single();
  if (error) {
    console.error("[Supabase] Erro ao criar produto:", error);
    throw new Error(`Erro ao criar produto: ${error.message}`);
  }
  return data;
}
async function updateProduto(id, produto) {
  const { data, error } = await supabase.from("produtos_venda").update(produto).eq("id", id).select().single();
  if (error) {
    console.error("[Supabase] Erro ao atualizar produto:", error);
    throw new Error(`Erro ao atualizar produto: ${error.message}`);
  }
  return data;
}
async function deleteProduto(id) {
  const { error } = await supabase.from("produtos_venda").delete().eq("id", id);
  if (error) {
    console.error("[Supabase] Erro ao deletar produto:", error);
    throw new Error(`Erro ao deletar produto: ${error.message}`);
  }
}
async function getFichasTecnicas() {
  const { data, error } = await supabase.from("fichas_tecnicas").select("*").order("nome", { ascending: true });
  if (error) {
    console.error("[Supabase] Erro ao buscar fichas t\xE9cnicas:", error);
    throw new Error(`Erro ao buscar fichas t\xE9cnicas: ${error.message}`);
  }
  return data || [];
}
async function createFichaTecnica(ficha) {
  const { data, error } = await supabase.from("fichas_tecnicas").insert([ficha]).select().single();
  if (error) {
    console.error("[Supabase] Erro ao criar ficha t\xE9cnica:", error);
    throw new Error(`Erro ao criar ficha t\xE9cnica: ${error.message}`);
  }
  return data;
}
async function updateFichaTecnica(id, ficha) {
  const { data, error } = await supabase.from("fichas_tecnicas").update(ficha).eq("id", id).select().single();
  if (error) {
    console.error("[Supabase] Erro ao atualizar ficha t\xE9cnica:", error);
    throw new Error(`Erro ao atualizar ficha t\xE9cnica: ${error.message}`);
  }
  return data;
}
async function deleteFichaTecnica(id) {
  const { error } = await supabase.from("fichas_tecnicas").delete().eq("id", id);
  if (error) {
    console.error("[Supabase] Erro ao deletar ficha t\xE9cnica:", error);
    throw new Error(`Erro ao deletar ficha t\xE9cnica: ${error.message}`);
  }
}
async function getIngredientesByFicha(fichaId) {
  const { data, error } = await supabase.from("ingredientes").select(`
      *,
      Insumos:insumo_id (*)
    `).eq("ficha_tecnica_id", fichaId).order("created_at", { ascending: true });
  if (error) {
    console.error("[Supabase] Erro ao buscar ingredientes:", error);
    throw new Error(`Erro ao buscar ingredientes: ${error.message}`);
  }
  return (data || []).map((item) => ({
    ...item,
    insumo: item.Insumos
  }));
}
async function getAllIngredientes() {
  const { data, error } = await supabase.from("ingredientes").select(`
      *,
      Insumos:insumo_id (*)
    `).order("created_at", { ascending: true });
  if (error) {
    console.error("[Supabase] Erro ao buscar todos os ingredientes:", error);
    throw new Error(`Erro ao buscar ingredientes: ${error.message}`);
  }
  return (data || []).map((item) => ({
    ...item,
    insumo: item.Insumos
  }));
}
async function createIngrediente(ingrediente) {
  const { data, error } = await supabase.from("ingredientes").insert([ingrediente]).select().single();
  if (error) {
    console.error("[Supabase] Erro ao criar ingrediente:", error);
    throw new Error(`Erro ao criar ingrediente: ${error.message}`);
  }
  return data;
}
async function updateIngrediente(id, ingrediente) {
  const { data, error } = await supabase.from("ingredientes").update(ingrediente).eq("id", id).select().single();
  if (error) {
    console.error("[Supabase] Erro ao atualizar ingrediente:", error);
    throw new Error(`Erro ao atualizar ingrediente: ${error.message}`);
  }
  return data;
}
async function deleteIngrediente(id) {
  const { error } = await supabase.from("ingredientes").delete().eq("id", id);
  if (error) {
    console.error("[Supabase] Erro ao deletar ingrediente:", error);
    throw new Error(`Erro ao deletar ingrediente: ${error.message}`);
  }
}
async function getLotes(insumoId) {
  let query = supabase.from("lotes").select(`
      *,
      Insumos:insumo_id (*)
    `).order("data_de_validade", { ascending: true });
  if (insumoId) {
    query = query.eq("insumo_id", insumoId);
  }
  const { data, error } = await query;
  if (error) {
    console.error("[Supabase] Erro ao buscar lotes:", error);
    throw new Error(`Erro ao buscar lotes: ${error.message}`);
  }
  return (data || []).map((item) => ({
    ...item,
    insumo: item.Insumos
  }));
}
async function createLote(lote) {
  const { created_at, ...loteData } = lote;
  let dataToInsert = loteData;
  if (created_at) {
    const dateObj = /* @__PURE__ */ new Date(created_at + "T00:00:00");
    const formattedDate = dateObj.toISOString().split("T")[0];
    dataToInsert = { ...loteData, created_at: formattedDate };
  }
  const { data, error } = await supabase.from("lotes").insert([dataToInsert]).select().single();
  if (error) {
    console.error("[Supabase] Erro ao criar lote:", error);
    throw new Error(`Erro ao criar lote: ${error.message}`);
  }
  return data;
}
async function updateLote(id, lote) {
  let dataToUpdate = lote;
  if (lote.created_at && typeof lote.created_at === "string") {
    const dateObj = /* @__PURE__ */ new Date(lote.created_at + "T00:00:00");
    const formattedDate = dateObj.toISOString().split("T")[0];
    dataToUpdate = { ...lote, created_at: formattedDate };
  }
  const { data, error } = await supabase.from("lotes").update(dataToUpdate).eq("id", id).select().single();
  if (error) {
    console.error("[Supabase] Erro ao atualizar lote:", error);
    throw new Error(`Erro ao atualizar lote: ${error.message}`);
  }
  return data;
}
async function deleteLote(id) {
  const { error } = await supabase.from("lotes").delete().eq("id", id);
  if (error) {
    console.error("[Supabase] Erro ao deletar lote:", error);
    throw new Error(`Erro ao deletar lote: ${error.message}`);
  }
}
async function getListasCompras() {
  const { data, error } = await supabase.from("lista_compras").select("*").order("data", { ascending: false });
  if (error) {
    console.error("[Supabase] Erro ao buscar listas de compras:", error);
    throw new Error(`Erro ao buscar listas de compras: ${error.message}`);
  }
  return data || [];
}
async function getListasComprasComTotal() {
  const listas = await getListasCompras();
  const todosItens = await getAllItensListaCompras();
  return listas.map((lista) => {
    const precoTotal = todosItens.filter((item) => item.lista_compras_id === lista.id).reduce((total, item) => {
      const preco = item.insumo?.preco_medio_por_unidade || 0;
      return total + item.quantidade * preco;
    }, 0);
    return {
      ...lista,
      preco_total: precoTotal
    };
  });
}
async function createListaCompras(lista) {
  const { data, error } = await supabase.from("lista_compras").insert([lista]).select().single();
  if (error) {
    console.error("[Supabase] Erro ao criar lista de compras:", error);
    throw new Error(`Erro ao criar lista de compras: ${error.message}`);
  }
  return data;
}
async function updateListaCompras(id, lista) {
  const { data, error } = await supabase.from("lista_compras").update(lista).eq("id", id).select().single();
  if (error) {
    console.error("[Supabase] Erro ao atualizar lista de compras:", error);
    throw new Error(`Erro ao atualizar lista de compras: ${error.message}`);
  }
  return data;
}
async function deleteListaCompras(id) {
  const { error } = await supabase.from("lista_compras").delete().eq("id", id);
  if (error) {
    console.error("[Supabase] Erro ao deletar lista de compras:", error);
    throw new Error(`Erro ao deletar lista de compras: ${error.message}`);
  }
}
async function getAllItensListaCompras() {
  const { data, error } = await supabase.from("itens_lista_compras").select("*").order("created_at", { ascending: true });
  if (error) {
    console.error("[Supabase] Erro ao buscar todos os itens de listas de compras:", error);
    throw new Error(`Erro ao buscar itens: ${error.message}`);
  }
  const itens = data || [];
  const insumosIdsSet = new Set(itens.map((item) => item.insumo_id));
  const insumosIds = Array.from(insumosIdsSet);
  if (insumosIds.length === 0) {
    return itens.map((item) => ({
      ...item,
      insumo: null
    }));
  }
  const { data: insumosData } = await supabase.from("Insumos").select("*").in("id", insumosIds);
  const insumosMap = (insumosData || []).reduce((acc, insumo) => {
    acc[insumo.id] = insumo;
    return acc;
  }, {});
  return itens.map((item) => ({
    ...item,
    insumo: insumosMap[item.insumo_id] || null
  }));
}
async function getItensListaCompras(listaId) {
  const { data, error } = await supabase.from("itens_lista_compras").select("*").eq("lista_compras_id", listaId).order("created_at", { ascending: true });
  if (error) {
    console.error("[Supabase] Erro ao buscar itens da lista de compras:", error);
    throw new Error(`Erro ao buscar itens da lista de compras: ${error.message}`);
  }
  const itens = data || [];
  const insumosIdsSet = new Set(itens.map((item) => item.insumo_id));
  const insumosIds = Array.from(insumosIdsSet);
  if (insumosIds.length === 0) {
    return itens.map((item) => ({
      ...item,
      insumo: null
    }));
  }
  const { data: insumosData } = await supabase.from("Insumos").select("*").in("id", insumosIds);
  const insumosMap = (insumosData || []).reduce((acc, insumo) => {
    acc[insumo.id] = insumo;
    return acc;
  }, {});
  return itens.map((item) => ({
    ...item,
    insumo: insumosMap[item.insumo_id] || null
  }));
}
async function createItemListaCompras(item) {
  const { data, error } = await supabase.from("itens_lista_compras").insert([item]).select().single();
  if (error) {
    console.error("[Supabase] Erro ao criar item da lista de compras:", error);
    throw new Error(`Erro ao criar item da lista de compras: ${error.message}`);
  }
  return data;
}
async function updateItemListaCompras(id, item) {
  const { data, error } = await supabase.from("itens_lista_compras").update(item).eq("id", id).select().single();
  if (error) {
    console.error("[Supabase] Erro ao atualizar item da lista de compras:", error);
    throw new Error(`Erro ao atualizar item da lista de compras: ${error.message}`);
  }
  return data;
}
async function deleteItemListaCompras(id) {
  const { error } = await supabase.from("itens_lista_compras").delete().eq("id", id);
  if (error) {
    console.error("[Supabase] Erro ao deletar item da lista de compras:", error);
    throw new Error(`Erro ao deletar item da lista de compras: ${error.message}`);
  }
}
async function getBaixasEstoque(loteId) {
  let query = supabase.from("baixas_estoque").select("*").order("created_at", { ascending: false });
  if (loteId) {
    query = query.eq("lote_id", loteId);
  }
  const { data, error } = await query;
  if (error) {
    console.error("[Supabase] Erro ao buscar baixas de estoque:", error);
    throw new Error(`Erro ao buscar baixas de estoque: ${error.message}`);
  }
  return (data || []).map((item) => ({
    ...item,
    lote: item.lotes ? { ...item.lotes, insumo: item.lotes.Insumos } : void 0
  }));
}
async function createBaixaEstoque(baixa) {
  const { data, error } = await supabase.from("baixas_estoque").insert([baixa]).select().single();
  if (error) {
    console.error("[Supabase] Erro ao criar baixa de estoque:", error);
    throw new Error(`Erro ao criar baixa de estoque: ${error.message}`);
  }
  return data;
}
async function deleteBaixaEstoque(id) {
  const { error } = await supabase.from("baixas_estoque").delete().eq("id", id);
  if (error) {
    console.error("[Supabase] Erro ao deletar baixa de estoque:", error);
    throw new Error(`Erro ao deletar baixa de estoque: ${error.message}`);
  }
}
async function getInsumosCriticos() {
  const insumos = await getInsumos();
  const lotes = await getLotes();
  const insumosComEstoque = insumos.map((insumo) => {
    const quantidadeTotal = lotes.filter((lote) => lote.insumo_id === insumo.id).reduce((sum, lote) => sum + (lote.quantidade_atual || 0), 0);
    return {
      ...insumo,
      quantidade_estoque: quantidadeTotal
    };
  });
  return insumosComEstoque.filter((insumo) => insumo.quantidade_estoque <= insumo.nivel_minimo);
}
async function getOrdensProducao() {
  const { data, error } = await supabase.from("ordens_producao").select(`
      *,
      produtos_venda:produto_id (
        id,
        nome,
        descricao,
        preco_venda,
        foto_url,
        ativo
      )
    `).order("data_inicio", { ascending: false });
  if (error) {
    console.error("[Supabase] Erro ao buscar ordens de produ\xE7\xE3o:", error);
    throw new Error(`Erro ao buscar ordens de produ\xE7\xE3o: ${error.message}`);
  }
  return (data || []).map((item) => ({
    ...item,
    produto: item.produtos_venda
  }));
}
async function getOrdemProducaoById(id) {
  const { data, error } = await supabase.from("ordens_producao").select(`
      *,
      produtos_venda:produto_id (
        id,
        nome,
        descricao,
        preco_venda,
        foto_url,
        ativo
      )
    `).eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("[Supabase] Erro ao buscar ordem de produ\xE7\xE3o:", error);
    throw new Error(`Erro ao buscar ordem de produ\xE7\xE3o: ${error.message}`);
  }
  return data ? { ...data, produto: data.produtos_venda } : null;
}
async function createOrdemProducao(ordem) {
  const { data, error } = await supabase.from("ordens_producao").insert([ordem]).select().single();
  if (error) {
    console.error("[Supabase] Erro ao criar ordem de produ\xE7\xE3o:", error);
    throw new Error(`Erro ao criar ordem de produ\xE7\xE3o: ${error.message}`);
  }
  return data;
}
async function updateOrdemProducao(id, ordem) {
  const { data, error } = await supabase.from("ordens_producao").update(ordem).eq("id", id).select().single();
  if (error) {
    console.error("[Supabase] Erro ao atualizar ordem de produ\xE7\xE3o:", error);
    throw new Error(`Erro ao atualizar ordem de produ\xE7\xE3o: ${error.message}`);
  }
  return data;
}
async function deleteOrdemProducao(id) {
  const { error } = await supabase.from("ordens_producao").delete().eq("id", id);
  if (error) {
    console.error("[Supabase] Erro ao deletar ordem de produ\xE7\xE3o:", error);
    throw new Error(`Erro ao deletar ordem de produ\xE7\xE3o: ${error.message}`);
  }
}
async function getOrdensProducaoPorProduto(produtoId) {
  const { data, error } = await supabase.from("ordens_producao").select("*").eq("produto_id", produtoId).order("data_inicio", { ascending: false });
  if (error) {
    console.error("[Supabase] Erro ao buscar ordens de produ\xE7\xE3o por produto:", error);
    throw new Error(`Erro ao buscar ordens de produ\xE7\xE3o por produto: ${error.message}`);
  }
  return data || [];
}
async function getProductFichasTecnicas(produtoId) {
  const { data, error } = await supabase.from("produto_fichas_tecnicas").select(`
      fichas_tecnicas (
        id,
        nome,
        modo_de_preparo,
        rendimento_total,
        unidade_rendimento
      )
    `).eq("produto_id", produtoId);
  if (error) {
    console.error("[Supabase] Erro ao buscar fichas t\xE9cnicas do produto:", error);
    throw new Error(`Erro ao buscar fichas t\xE9cnicas do produto: ${error.message}`);
  }
  return (data || []).map((item) => item.fichas_tecnicas);
}
async function validateStockForProduction(produtoId, quantidade) {
  try {
    const fichas = await getProductFichasTecnicas(produtoId);
    if (!fichas || fichas.length === 0) {
      return { isValid: true, message: "Produto sem fichas t\xE9cnicas associadas" };
    }
    const ingredientesNecessarios = [];
    for (const ficha of fichas) {
      const ingredientes = await getIngredientesByFicha(ficha.id);
      ingredientesNecessarios.push(...ingredientes);
    }
    if (ingredientesNecessarios.length === 0) {
      return { isValid: true, message: "Nenhum ingrediente necess\xE1rio" };
    }
    const lotes = await getLotes();
    for (const ingrediente of ingredientesNecessarios) {
      const quantidadeNecessaria = (ingrediente.quantidade || 0) * quantidade;
      const lotesDoInsumo = lotes.filter((lote) => lote.insumo_id === ingrediente.insumo_id);
      const quantidadeDisponivel = lotesDoInsumo.reduce((sum, lote) => sum + (lote.quantidade_atual || 0), 0);
      if (quantidadeDisponivel < quantidadeNecessaria) {
        return {
          isValid: false,
          message: `Estoque insuficiente de ${ingrediente.insumo?.nome || "ingrediente"}: necess\xE1rio ${quantidadeNecessaria}, dispon\xEDvel ${quantidadeDisponivel}`,
          ingredientesNecessarios
        };
      }
    }
    return { isValid: true, ingredientesNecessarios };
  } catch (error) {
    console.error("[Database] Erro ao validar estoque:", error);
    throw error;
  }
}
async function deductStockForProduction(ordemId, produtoId, quantidade) {
  try {
    const fichas = await getProductFichasTecnicas(produtoId);
    if (!fichas || fichas.length === 0) {
      return { success: true, message: "Nenhuma ficha t\xE9cnica para dedu\xE7\xE3o" };
    }
    const ingredientesNecessarios = [];
    for (const ficha of fichas) {
      const ingredientes = await getIngredientesByFicha(ficha.id);
      ingredientesNecessarios.push(...ingredientes);
    }
    const lotes = await getLotes();
    for (const ingrediente of ingredientesNecessarios) {
      const quantidadeNecessaria = (ingrediente.quantidade || 0) * quantidade;
      const lotesDoInsumo = lotes.filter((lote) => lote.insumo_id === ingrediente.insumo_id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      let quantidadeAindaNecessaria = quantidadeNecessaria;
      for (const lote of lotesDoInsumo) {
        if (quantidadeAindaNecessaria <= 0) break;
        const quantidadeDisponivel = lote.quantidade_atual || 0;
        const quantidadeADedu = Math.min(quantidadeDisponivel, quantidadeAindaNecessaria);
        if (quantidadeADedu > 0) {
          const novaQuantidade = quantidadeDisponivel - quantidadeADedu;
          await updateLote(lote.id, { quantidade_atual: novaQuantidade });
          await createBaixaEstoque({
            lote_id: lote.id,
            quantidade_baixada: quantidadeADedu,
            motivo: "producao",
            referencia_producao_id: ordemId
          });
          quantidadeAindaNecessaria -= quantidadeADedu;
        }
      }
      if (quantidadeAindaNecessaria > 0) {
        return {
          success: false,
          message: `N\xE3o foi poss\xEDvel deduzir quantidade suficiente de ${ingrediente.insumo?.nome || "ingrediente"}`
        };
      }
    }
    return { success: true, message: "Estoque deduzido com sucesso" };
  } catch (error) {
    console.error("[Database] Erro ao deduzir estoque:", error);
    throw error;
  }
}
async function atualizarPrecoMedioPorUnidade(insumoId) {
  try {
    console.log(`[DEBUG] Iniciando calculo de preco medio para insumo: ${insumoId}`);
    const { data: lotes, error: errorLotes } = await supabase.from("lotes").select("preco_por_unidade").eq("insumo_id", insumoId).not("preco_por_unidade", "is", null);
    console.log(`[DEBUG] Lotes encontrados: ${lotes?.length || 0}`, lotes);
    if (errorLotes) {
      console.error("[Supabase] Erro ao buscar lotes:", errorLotes);
      return;
    }
    if (!lotes || lotes.length === 0) {
      console.log(`[DEBUG] Nenhum lote com preco encontrado para insumo ${insumoId}`);
      return;
    }
    const soma = lotes.reduce((acc, lote) => acc + (lote.preco_por_unidade || 0), 0);
    const media = soma / lotes.length;
    console.log(`[DEBUG] Media calculada: ${media} (soma: ${soma}, quantidade: ${lotes.length})`);
    const { error: errorUpdate } = await supabase.from("Insumos").update({ preco_medio_por_unidade: media }).eq("id", insumoId);
    if (errorUpdate) {
      console.error("[Supabase] Erro ao atualizar preco medio:", errorUpdate);
    } else {
      console.log(`[DEBUG] Preco medio atualizado com sucesso para ${media}`);
    }
  } catch (error) {
    console.error("[Database] Erro ao calcular preco medio:", error);
  }
}
async function getEstoqueAtualPorInsumo(insumoId) {
  try {
    const { data: lotes, error: errorLotes } = await supabase.from("lotes").select("id, quantidade_inicial").eq("insumo_id", insumoId);
    if (errorLotes) {
      console.error("[Supabase] Erro ao buscar lotes:", errorLotes);
      throw new Error(`Erro ao buscar lotes: ${errorLotes.message}`);
    }
    if (!lotes || lotes.length === 0) {
      return {
        insumo_id: insumoId,
        quantidade_inicial_total: 0,
        quantidade_baixada_total: 0,
        estoque_atual: 0
      };
    }
    const quantidadeInicialTotal = lotes.reduce(
      (sum, lote) => sum + (lote.quantidade_inicial || 0),
      0
    );
    const { data: baixas, error: errorBaixas } = await supabase.from("baixas_estoque").select("quantidade_baixada").in("lote_id", lotes.map((l) => l.id));
    if (errorBaixas) {
      console.error("[Supabase] Erro ao buscar baixas:", errorBaixas);
      throw new Error(`Erro ao buscar baixas: ${errorBaixas.message}`);
    }
    const quantidadeBaixadaTotal = (baixas || []).reduce(
      (sum, baixa) => sum + (baixa.quantidade_baixada || 0),
      0
    );
    const estoqueAtual = quantidadeInicialTotal - quantidadeBaixadaTotal;
    return {
      insumo_id: insumoId,
      quantidade_inicial_total: quantidadeInicialTotal,
      quantidade_baixada_total: quantidadeBaixadaTotal,
      estoque_atual: Math.max(0, estoqueAtual)
      // Nunca negativo
    };
  } catch (error) {
    console.error("[Database] Erro ao calcular estoque atual:", error);
    throw error;
  }
}
async function getEstoqueAtualTodos() {
  try {
    const insumos = await getInsumos();
    const estoqueAtualList = [];
    for (const insumo of insumos) {
      const estoque = await getEstoqueAtualPorInsumo(insumo.id);
      if (estoque) {
        estoqueAtualList.push(estoque);
      }
    }
    return estoqueAtualList;
  } catch (error) {
    console.error("[Database] Erro ao calcular estoque atual de todos os insumos:", error);
    throw error;
  }
}
async function calcularCustoTotalFicha(fichaId) {
  try {
    const ingredientes = await getIngredientesByFicha(fichaId);
    const custoTotal = ingredientes.reduce((total, ing) => {
      const precoUnitario = ing.insumo?.preco_medio_por_unidade || 0;
      const custo = ing.quantidade * precoUnitario;
      return total + custo;
    }, 0);
    return custoTotal;
  } catch (error) {
    console.error("[Database] Erro ao calcular custo total da ficha:", error);
    return 0;
  }
}
async function getFichasTecnicasComCusto() {
  try {
    const fichas = await getFichasTecnicas();
    const fichasComCusto = await Promise.all(
      fichas.map(async (ficha) => ({
        ...ficha,
        custo_total: await calcularCustoTotalFicha(ficha.id)
      }))
    );
    return fichasComCusto;
  } catch (error) {
    console.error("[Database] Erro ao buscar fichas com custo:", error);
    return [];
  }
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUser(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUser(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/storage.ts
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

// server/routers.ts
import { z as z2 } from "zod";
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  // Router para gerenciar insumos
  insumos: router({
    list: publicProcedure.query(async () => {
      return await getInsumos();
    }),
    criticos: publicProcedure.query(async () => {
      return await getInsumosCriticos();
    }),
    getEstoqueAtual: publicProcedure.input(z2.object({
      insumoId: z2.string().uuid().optional()
    }).optional()).query(async ({ input }) => {
      if (input?.insumoId) {
        const estoque = await getEstoqueAtualPorInsumo(input.insumoId);
        return estoque ? [estoque] : [];
      }
      return await getEstoqueAtualTodos();
    }),
    create: publicProcedure.input(z2.object({
      nome: z2.string().min(1, "Nome \xE9 obrigat\xF3rio"),
      unidade_base: z2.string().min(1, "Unidade \xE9 obrigat\xF3ria"),
      nivel_minimo: z2.number().min(0, "N\xEDvel m\xEDnimo deve ser positivo"),
      tipo_produto: z2.string().min(1, "Tipo de insumo \xE9 obrigat\xF3rio")
    })).mutation(async ({ input }) => {
      return await createInsumo(input);
    }),
    update: publicProcedure.input(z2.object({
      id: z2.string().uuid(),
      nome: z2.string().min(1).optional(),
      unidade_base: z2.string().min(1).optional(),
      nivel_minimo: z2.number().min(0).optional(),
      tipo_produto: z2.string().min(1).optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await updateInsumo(id, data);
    }),
    checkUsage: publicProcedure.input(z2.object({
      id: z2.string().uuid()
    })).query(async ({ input }) => {
      return await checkInsumoUsage(input.id);
    }),
    delete: publicProcedure.input(z2.object({
      id: z2.string().uuid()
    })).mutation(async ({ input }) => {
      await deleteInsumo(input.id);
      return { success: true };
    })
  }),
  // Router para gerenciar clientes
  clientes: router({
    list: publicProcedure.query(async () => {
      return await getClientes();
    }),
    create: publicProcedure.input(z2.object({
      nome: z2.string().nullable(),
      telefone: z2.string().nullable(),
      instagram: z2.string().nullable(),
      observacoes: z2.string().nullable()
    })).mutation(async ({ input }) => {
      return await createCliente(input);
    }),
    update: publicProcedure.input(z2.object({
      id: z2.string().uuid(),
      nome: z2.string().nullable().optional(),
      telefone: z2.string().nullable().optional(),
      instagram: z2.string().nullable().optional(),
      observacoes: z2.string().nullable().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await updateCliente(id, data);
    }),
    delete: publicProcedure.input(z2.object({
      id: z2.string().uuid()
    })).mutation(async ({ input }) => {
      await deleteCliente(input.id);
      return { success: true };
    })
  }),
  // Router para gerenciar produtos
  produtos: router({
    list: publicProcedure.query(async () => {
      return await getProdutos();
    }),
    create: publicProcedure.input(z2.object({
      nome: z2.string().nullable(),
      descricao: z2.string().nullable(),
      preco_venda: z2.number().nullable(),
      foto_url: z2.string().nullable(),
      ativo: z2.boolean().default(true)
    })).mutation(async ({ input }) => {
      return await createProduto(input);
    }),
    update: publicProcedure.input(z2.object({
      id: z2.string().uuid(),
      nome: z2.string().nullable().optional(),
      descricao: z2.string().nullable().optional(),
      preco_venda: z2.number().nullable().optional(),
      foto_url: z2.string().nullable().optional(),
      ativo: z2.boolean().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await updateProduto(id, data);
    }),
    delete: publicProcedure.input(z2.object({
      id: z2.string().uuid()
    })).mutation(async ({ input }) => {
      await deleteProduto(input.id);
      return { success: true };
    })
  }),
  // Router para gerenciar fichas técnicas
  fichasTecnicas: router({
    list: publicProcedure.query(async () => {
      return await getFichasTecnicas();
    }),
    listComCusto: publicProcedure.query(async () => {
      return await getFichasTecnicasComCusto();
    }),
    calcularCusto: publicProcedure.input(z2.object({ fichaId: z2.string().uuid() })).query(async ({ input }) => {
      return await calcularCustoTotalFicha(input.fichaId);
    }),
    create: publicProcedure.input(z2.object({
      nome: z2.string().min(1, "Nome \xE9 obrigat\xF3rio"),
      modo_de_preparo: z2.string().nullable().optional(),
      rendimento_total: z2.number().min(0).nullable().optional(),
      unidade_rendimento: z2.string().nullable().optional()
    })).mutation(async ({ input }) => {
      const { modo_de_preparo, rendimento_total, unidade_rendimento, ...rest } = input;
      return await createFichaTecnica({
        ...rest,
        modo_de_preparo: modo_de_preparo ?? null,
        rendimento_total: rendimento_total ?? null,
        unidade_rendimento: unidade_rendimento ?? null
      });
    }),
    update: publicProcedure.input(z2.object({
      id: z2.string().uuid(),
      nome: z2.string().min(1).optional(),
      modo_de_preparo: z2.string().nullable().optional(),
      rendimento_total: z2.number().min(0).nullable().optional(),
      unidade_rendimento: z2.string().nullable().optional()
    })).mutation(async ({ input }) => {
      const { id, modo_de_preparo, rendimento_total, unidade_rendimento, ...rest } = input;
      return await updateFichaTecnica(id, {
        ...rest,
        ...modo_de_preparo !== void 0 && { modo_de_preparo: modo_de_preparo ?? null },
        ...rendimento_total !== void 0 && { rendimento_total: rendimento_total ?? null },
        ...unidade_rendimento !== void 0 && { unidade_rendimento: unidade_rendimento ?? null }
      });
    }),
    delete: publicProcedure.input(z2.object({ id: z2.string().uuid() })).mutation(async ({ input }) => {
      await deleteFichaTecnica(input.id);
      return { success: true };
    })
  }),
  // Router para gerenciar ingredientes
  ingredientes: router({
    list: publicProcedure.query(async () => {
      return await getAllIngredientes();
    }),
    listByFicha: publicProcedure.input(z2.object({ fichaId: z2.string().uuid() })).query(async ({ input }) => {
      return await getIngredientesByFicha(input.fichaId);
    }),
    create: publicProcedure.input(z2.object({
      ficha_tecnica_id: z2.string().uuid(),
      insumo_id: z2.string().uuid(),
      quantidade: z2.number().min(0).nullable().optional()
    })).mutation(async ({ input }) => {
      const { quantidade, ...rest } = input;
      return await createIngrediente({
        ...rest,
        quantidade: quantidade ?? null
      });
    }),
    update: publicProcedure.input(z2.object({
      id: z2.string().uuid(),
      quantidade: z2.number().min(0).nullable().optional()
    })).mutation(async ({ input }) => {
      const { id, quantidade } = input;
      return await updateIngrediente(id, {
        ...quantidade !== void 0 && { quantidade: quantidade ?? null }
      });
    }),
    delete: publicProcedure.input(z2.object({ id: z2.string().uuid() })).mutation(async ({ input }) => {
      await deleteIngrediente(input.id);
      return { success: true };
    })
  }),
  // Router para gerenciar lotes (estoque)
  lotes: router({
    list: publicProcedure.input(z2.object({ insumoId: z2.string().uuid().optional() })).query(async ({ input }) => {
      return await getLotes(input.insumoId);
    }),
    create: publicProcedure.input(z2.object({
      insumo_id: z2.string().uuid(),
      quantidade_inicial: z2.number().min(0).nullable().optional(),
      quantidade_atual: z2.number().min(0).nullable().optional(),
      data_de_validade: z2.string().nullable().optional(),
      custo_total_lote: z2.number().min(0).nullable().optional(),
      preco_por_unidade: z2.number().min(0).nullable().optional(),
      created_at: z2.string().nullable().optional()
    })).mutation(async ({ input }) => {
      const { quantidade_inicial, quantidade_atual, data_de_validade, custo_total_lote, preco_por_unidade, created_at, ...rest } = input;
      const lote = await createLote({
        ...rest,
        quantidade_inicial: quantidade_inicial ?? null,
        quantidade_atual: quantidade_atual ?? null,
        data_de_validade: data_de_validade ?? null,
        custo_total_lote: custo_total_lote ?? null,
        preco_por_unidade: preco_por_unidade ?? null,
        created_at: created_at ?? null
      });
      if (preco_por_unidade && preco_por_unidade > 0) {
        await atualizarPrecoMedioPorUnidade(rest.insumo_id);
      }
      return lote;
    }),
    update: publicProcedure.input(z2.object({
      id: z2.string().uuid(),
      insumo_id: z2.string().uuid().optional(),
      quantidade_inicial: z2.number().min(0).nullable().optional(),
      quantidade_atual: z2.number().min(0).nullable().optional(),
      data_de_validade: z2.string().nullable().optional(),
      custo_total_lote: z2.number().min(0).nullable().optional(),
      created_at: z2.string().nullable().optional()
    })).mutation(async ({ input }) => {
      const { id, insumo_id, quantidade_inicial, quantidade_atual, data_de_validade, custo_total_lote, created_at } = input;
      const result = await updateLote(id, {
        ...quantidade_inicial !== void 0 && { quantidade_inicial: quantidade_inicial ?? null },
        ...quantidade_atual !== void 0 && { quantidade_atual: quantidade_atual ?? null },
        ...data_de_validade !== void 0 && { data_de_validade: data_de_validade ?? null },
        ...custo_total_lote !== void 0 && { custo_total_lote: custo_total_lote ?? null },
        ...created_at !== void 0 && { created_at: created_at ?? null }
      });
      if (insumo_id) {
        await atualizarPrecoMedioPorUnidade(insumo_id);
      }
      return result;
    }),
    delete: publicProcedure.input(z2.object({ id: z2.string().uuid() })).mutation(async ({ input }) => {
      await deleteLote(input.id);
      return { success: true };
    })
  }),
  // Router para gerenciar listas de compras
  listasCompras: router({
    list: publicProcedure.query(async () => {
      return await getListasCompras();
    }),
    listWithTotals: publicProcedure.query(async () => {
      return await getListasComprasComTotal();
    }),
    create: publicProcedure.input(z2.object({
      nome: z2.string().min(1, "Nome \xE9 obrigat\xF3rio"),
      data: z2.string().nullable().optional()
    })).mutation(async ({ input }) => {
      const { data, ...rest } = input;
      return await createListaCompras({
        ...rest,
        data: data ?? null
      });
    }),
    update: publicProcedure.input(z2.object({
      id: z2.string().uuid(),
      nome: z2.string().min(1).optional(),
      data: z2.string().nullable().optional()
    })).mutation(async ({ input }) => {
      const { id, nome, data } = input;
      return await updateListaCompras(id, {
        ...nome !== void 0 && { nome },
        ...data !== void 0 && { data: data ?? null }
      });
    }),
    delete: publicProcedure.input(z2.object({ id: z2.string().uuid() })).mutation(async ({ input }) => {
      await deleteListaCompras(input.id);
      return { success: true };
    })
  }),
  // Router para gerenciar itens de lista de compras
  itensListaCompras: router({
    listByLista: publicProcedure.input(z2.object({ listaId: z2.string().uuid() })).query(async ({ input }) => {
      return await getItensListaCompras(input.listaId);
    }),
    create: publicProcedure.input(z2.object({
      lista_compras_id: z2.string().uuid(),
      insumo_id: z2.string().uuid(),
      quantidade: z2.number().min(0).nullable().optional()
    })).mutation(async ({ input }) => {
      const { quantidade, ...rest } = input;
      return await createItemListaCompras({
        ...rest,
        quantidade: quantidade ?? null
      });
    }),
    update: publicProcedure.input(z2.object({
      id: z2.string().uuid(),
      quantidade: z2.number().min(0).nullable().optional()
    })).mutation(async ({ input }) => {
      const { id, quantidade } = input;
      return await updateItemListaCompras(id, {
        ...quantidade !== void 0 && { quantidade: quantidade ?? null }
      });
    }),
    delete: publicProcedure.input(z2.object({ id: z2.string().uuid() })).mutation(async ({ input }) => {
      await deleteItemListaCompras(input.id);
      return { success: true };
    })
  }),
  // Router para gerenciar baixas de estoque
  baixasEstoque: router({
    list: publicProcedure.input(z2.object({ loteId: z2.string().uuid().optional() })).query(async ({ input }) => {
      return await getBaixasEstoque(input.loteId);
    }),
    create: publicProcedure.input(z2.object({
      lote_id: z2.string().uuid(),
      quantidade_baixada: z2.number().min(0).nullable().optional(),
      motivo: z2.string().nullable().optional(),
      data_baixa: z2.string().nullable().optional(),
      referencia_producao_id: z2.string().uuid().nullable().optional()
    })).mutation(async ({ input }) => {
      const { quantidade_baixada, motivo, data_baixa, referencia_producao_id, ...rest } = input;
      return await createBaixaEstoque({
        ...rest,
        quantidade_baixada: quantidade_baixada ?? null,
        motivo: motivo ?? null,
        data_baixa: data_baixa ?? null,
        referencia_producao_id: referencia_producao_id ?? null
      });
    }),
    delete: publicProcedure.input(z2.object({ id: z2.string().uuid() })).mutation(async ({ input }) => {
      await deleteBaixaEstoque(input.id);
      return { success: true };
    })
  }),
  // Router para gerenciar ordens de produção
  ordensProducao: router({
    list: publicProcedure.query(async () => {
      return await getOrdensProducao();
    }),
    getById: publicProcedure.input(z2.object({
      id: z2.string().uuid()
    })).query(async ({ input }) => {
      return await getOrdemProducaoById(input.id);
    }),
    getByProduto: publicProcedure.input(z2.object({
      produtoId: z2.string().uuid()
    })).query(async ({ input }) => {
      return await getOrdensProducaoPorProduto(input.produtoId);
    }),
    create: publicProcedure.input(z2.object({
      produto_id: z2.string().uuid(),
      status: z2.enum(["pendente", "em_andamento", "concluida"]).default("pendente"),
      quantidade_produzida: z2.number().min(0).default(0),
      data_inicio: z2.string().datetime().optional(),
      data_conclusao: z2.string().datetime().nullable().optional()
    })).mutation(async ({ input }) => {
      return await createOrdemProducao({
        produto_id: input.produto_id,
        status: input.status,
        quantidade_produzida: input.quantidade_produzida,
        data_inicio: input.data_inicio || (/* @__PURE__ */ new Date()).toISOString(),
        data_conclusao: input.data_conclusao || null
      });
    }),
    update: publicProcedure.input(z2.object({
      id: z2.string().uuid(),
      status: z2.enum(["pendente", "em_andamento", "concluida"]).optional(),
      quantidade_produzida: z2.number().min(0).optional(),
      data_conclusao: z2.string().datetime().nullable().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await updateOrdemProducao(id, data);
    }),
    delete: publicProcedure.input(z2.object({
      id: z2.string().uuid()
    })).mutation(async ({ input }) => {
      await deleteOrdemProducao(input.id);
      return { success: true };
    }),
    validateStock: publicProcedure.input(z2.object({
      produtoId: z2.string().uuid(),
      quantidade: z2.number().min(0)
    })).query(async ({ input }) => {
      return await validateStockForProduction(input.produtoId, input.quantidade);
    }),
    startProduction: publicProcedure.input(z2.object({
      ordemId: z2.string().uuid(),
      produtoId: z2.string().uuid(),
      quantidade: z2.number().min(0)
    })).mutation(async ({ input }) => {
      const validation = await validateStockForProduction(input.produtoId, input.quantidade);
      if (!validation.isValid) {
        throw new Error(validation.message || "Estoque insuficiente");
      }
      const deduction = await deductStockForProduction(input.ordemId, input.produtoId, input.quantidade);
      if (!deduction.success) {
        throw new Error(deduction.message || "Erro ao deduzir estoque");
      }
      await updateOrdemProducao(input.ordemId, {
        status: "em_andamento",
        data_inicio: (/* @__PURE__ */ new Date()).toISOString()
      });
      return { success: true, message: "Producao iniciada e estoque deduzido" };
    })
  }),
  // Router para upload de arquivos
  upload: router({
    image: publicProcedure.input(z2.object({
      base64: z2.string(),
      filename: z2.string(),
      contentType: z2.string()
    })).mutation(async ({ input }) => {
      const base64Data = input.base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const timestamp2 = Date.now();
      const key = `produtos/${timestamp2}-${input.filename}`;
      const result = await storagePut(key, buffer, input.contentType);
      return { url: result.url };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
