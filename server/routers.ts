import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { 
  getInsumos, createInsumo, updateInsumo, deleteInsumo, checkInsumoUsage, getInsumosCriticos,
  getClientes, createCliente, updateCliente, deleteCliente,
  getProdutos, createProduto, updateProduto, deleteProduto,
  getFichasTecnicas, createFichaTecnica, updateFichaTecnica, deleteFichaTecnica,
  getIngredientesByFicha, createIngrediente, updateIngrediente, deleteIngrediente,
  getLotes, createLote, updateLote, deleteLote,
  getListasCompras, getListasComprasComTotal, createListaCompras, updateListaCompras, deleteListaCompras,
  getItensListaCompras, getAllItensListaCompras, createItemListaCompras, updateItemListaCompras, deleteItemListaCompras,
  getBaixasEstoque, createBaixaEstoque, deleteBaixaEstoque,
  getOrdensProducao, getOrdemProducaoById, getOrdensProducaoPorProduto, createOrdemProducao, updateOrdemProducao, deleteOrdemProducao,
  validateStockForProduction, deductStockForProduction, getProductFichasTecnicas,
  atualizarPrecoMedioPorUnidade, getEstoqueAtualTodos, getEstoqueAtualPorInsumo
} from "./db";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Router para gerenciar insumos
  insumos: router({
    list: publicProcedure.query(async () => {
      return await getInsumos();
    }),
    
    criticos: publicProcedure.query(async () => {
      return await getInsumosCriticos();
    }),
    
    getEstoqueAtual: publicProcedure
      .input(z.object({
        insumoId: z.string().uuid().optional(),
      }).optional())
      .query(async ({ input }) => {
        if (input?.insumoId) {
          const estoque = await getEstoqueAtualPorInsumo(input.insumoId);
          return estoque ? [estoque] : [];
        }
        return await getEstoqueAtualTodos();
      }),
    
    create: publicProcedure
      .input(z.object({
        nome: z.string().min(1, "Nome é obrigatório"),
        unidade_base: z.string().min(1, "Unidade é obrigatória"),
        nivel_minimo: z.number().min(0, "Nível mínimo deve ser positivo"),
        tipo_produto: z.string().min(1, "Tipo de insumo é obrigatório"),
      }))
      .mutation(async ({ input }) => {
        return await createInsumo(input);
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        nome: z.string().min(1).optional(),
        unidade_base: z.string().min(1).optional(),
        nivel_minimo: z.number().min(0).optional(),
        tipo_produto: z.string().min(1).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateInsumo(id, data);
      }),
    
    checkUsage: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
      }))
      .query(async ({ input }) => {
        return await checkInsumoUsage(input.id);
      }),
    
    delete: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
      }))
      .mutation(async ({ input }) => {
        await deleteInsumo(input.id);
        return { success: true };
      }),
  }),

  // Router para gerenciar clientes
  clientes: router({
    list: publicProcedure.query(async () => {
      return await getClientes();
    }),
    
    create: publicProcedure
      .input(z.object({
        nome: z.string().nullable(),
        telefone: z.string().nullable(),
        instagram: z.string().nullable(),
        observacoes: z.string().nullable(),
      }))
      .mutation(async ({ input }) => {
        return await createCliente(input);
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        nome: z.string().nullable().optional(),
        telefone: z.string().nullable().optional(),
        instagram: z.string().nullable().optional(),
        observacoes: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateCliente(id, data);
      }),
    
    delete: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
      }))
      .mutation(async ({ input }) => {
        await deleteCliente(input.id);
        return { success: true };
      }),
  }),

  // Router para gerenciar produtos
  produtos: router({
    list: publicProcedure.query(async () => {
      return await getProdutos();
    }),
    
    create: publicProcedure
      .input(z.object({
        nome: z.string().nullable(),
        descricao: z.string().nullable(),
        preco_venda: z.number().nullable(),
        foto_url: z.string().nullable(),
        ativo: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        return await createProduto(input);
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        nome: z.string().nullable().optional(),
        descricao: z.string().nullable().optional(),
        preco_venda: z.number().nullable().optional(),
        foto_url: z.string().nullable().optional(),
        ativo: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateProduto(id, data);
      }),
    
    delete: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
      }))
      .mutation(async ({ input }) => {
        await deleteProduto(input.id);
        return { success: true };
      }),
  }),

  // Router para gerenciar fichas técnicas
  fichasTecnicas: router({
    list: publicProcedure.query(async () => {
      return await getFichasTecnicas();
    }),
    
    create: publicProcedure
      .input(z.object({
        nome: z.string().min(1, "Nome é obrigatório"),
        modo_de_preparo: z.string().nullable().optional(),
        rendimento_total: z.number().min(0).nullable().optional(),
        unidade_rendimento: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { modo_de_preparo, rendimento_total, unidade_rendimento, ...rest } = input;
        return await createFichaTecnica({
          ...rest,
          modo_de_preparo: modo_de_preparo ?? null,
          rendimento_total: rendimento_total ?? null,
          unidade_rendimento: unidade_rendimento ?? null,
        });
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        nome: z.string().min(1).optional(),
        modo_de_preparo: z.string().nullable().optional(),
        rendimento_total: z.number().min(0).nullable().optional(),
        unidade_rendimento: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, modo_de_preparo, rendimento_total, unidade_rendimento, ...rest } = input;
        return await updateFichaTecnica(id, {
          ...rest,
          ...(modo_de_preparo !== undefined && { modo_de_preparo: modo_de_preparo ?? null }),
          ...(rendimento_total !== undefined && { rendimento_total: rendimento_total ?? null }),
          ...(unidade_rendimento !== undefined && { unidade_rendimento: unidade_rendimento ?? null }),
        });
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        await deleteFichaTecnica(input.id);
        return { success: true };
      }),
  }),

  // Router para gerenciar ingredientes
  ingredientes: router({
    listByFicha: publicProcedure
      .input(z.object({ fichaId: z.string().uuid() }))
      .query(async ({ input }) => {
        return await getIngredientesByFicha(input.fichaId);
      }),
    
    create: publicProcedure
      .input(z.object({
        ficha_tecnica_id: z.string().uuid(),
        insumo_id: z.string().uuid(),
        quantidade: z.number().min(0).nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { quantidade, ...rest } = input;
        return await createIngrediente({
          ...rest,
          quantidade: quantidade ?? null,
        });
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        quantidade: z.number().min(0).nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, quantidade } = input;
        return await updateIngrediente(id, {
          ...(quantidade !== undefined && { quantidade: quantidade ?? null }),
        });
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        await deleteIngrediente(input.id);
        return { success: true };
      }),
  }),

  // Router para gerenciar lotes (estoque)
  lotes: router({
    list: publicProcedure
      .input(z.object({ insumoId: z.string().uuid().optional() }))
      .query(async ({ input }) => {
        return await getLotes(input.insumoId);
      }),
    
    create: publicProcedure
      .input(z.object({
        insumo_id: z.string().uuid(),
        quantidade_inicial: z.number().min(0).nullable().optional(),
        quantidade_atual: z.number().min(0).nullable().optional(),
        data_de_validade: z.string().nullable().optional(),
        custo_total_lote: z.number().min(0).nullable().optional(),
        preco_por_unidade: z.number().min(0).nullable().optional(),
        created_at: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { quantidade_inicial, quantidade_atual, data_de_validade, custo_total_lote, preco_por_unidade, created_at, ...rest } = input;
        const lote = await createLote({
          ...rest,
          quantidade_inicial: quantidade_inicial ?? null,
          quantidade_atual: quantidade_atual ?? null,
          data_de_validade: data_de_validade ?? null,
          custo_total_lote: custo_total_lote ?? null,
          preco_por_unidade: preco_por_unidade ?? null,
          created_at: created_at ?? null,
        });
        if (preco_por_unidade && preco_por_unidade > 0) {
          await atualizarPrecoMedioPorUnidade(rest.insumo_id);
        }
        return lote;
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        insumo_id: z.string().uuid().optional(),
        quantidade_inicial: z.number().min(0).nullable().optional(),
        quantidade_atual: z.number().min(0).nullable().optional(),
        data_de_validade: z.string().nullable().optional(),
        custo_total_lote: z.number().min(0).nullable().optional(),
        created_at: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, insumo_id, quantidade_inicial, quantidade_atual, data_de_validade, custo_total_lote, created_at } = input;
        const result = await updateLote(id, {
          ...(quantidade_inicial !== undefined && { quantidade_inicial: quantidade_inicial ?? null }),
          ...(quantidade_atual !== undefined && { quantidade_atual: quantidade_atual ?? null }),
          ...(data_de_validade !== undefined && { data_de_validade: data_de_validade ?? null }),
          ...(custo_total_lote !== undefined && { custo_total_lote: custo_total_lote ?? null }),
          ...(created_at !== undefined && { created_at: created_at ?? null }),
        });
        
        if (insumo_id) {
          await atualizarPrecoMedioPorUnidade(insumo_id);
        }
        
        return result;
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        await deleteLote(input.id);
        return { success: true };
      }),
  }),

  // Router para gerenciar listas de compras
  listasCompras: router({
    list: publicProcedure.query(async () => {
      return await getListasCompras();
    }),
    
    listWithTotals: publicProcedure.query(async () => {
      return await getListasComprasComTotal();
    }),
    
    create: publicProcedure
      .input(z.object({
        nome: z.string().min(1, "Nome é obrigatório"),
        data: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { data, ...rest } = input;
        return await createListaCompras({
          ...rest,
          data: data ?? null,
        });
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        nome: z.string().min(1).optional(),
        data: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, nome, data } = input;
        return await updateListaCompras(id, {
          ...(nome !== undefined && { nome }),
          ...(data !== undefined && { data: data ?? null }),
        });
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        await deleteListaCompras(input.id);
        return { success: true };
      }),
  }),

  // Router para gerenciar itens de lista de compras
  itensListaCompras: router({
    listByLista: publicProcedure
      .input(z.object({ listaId: z.string().uuid() }))
      .query(async ({ input }) => {
        return await getItensListaCompras(input.listaId);
      }),
    
    create: publicProcedure
      .input(z.object({
        lista_compras_id: z.string().uuid(),
        insumo_id: z.string().uuid(),
        quantidade: z.number().min(0).nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { quantidade, ...rest } = input;
        return await createItemListaCompras({
          ...rest,
          quantidade: quantidade ?? null,
        });
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        quantidade: z.number().min(0).nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, quantidade } = input;
        return await updateItemListaCompras(id, {
          ...(quantidade !== undefined && { quantidade: quantidade ?? null }),
        });
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        await deleteItemListaCompras(input.id);
        return { success: true };
      }),
  }),

  // Router para gerenciar baixas de estoque
  baixasEstoque: router({
    list: publicProcedure
      .input(z.object({ loteId: z.string().uuid().optional() }))
      .query(async ({ input }) => {
        return await getBaixasEstoque(input.loteId);
      }),
    
    create: publicProcedure
      .input(z.object({
        lote_id: z.string().uuid(),
        quantidade_baixada: z.number().min(0).nullable().optional(),
        motivo: z.string().nullable().optional(),
        data_baixa: z.string().nullable().optional(),
        referencia_producao_id: z.string().uuid().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { quantidade_baixada, motivo, data_baixa, referencia_producao_id, ...rest } = input;
        return await createBaixaEstoque({
          ...rest,
          quantidade_baixada: quantidade_baixada ?? null,
          motivo: motivo ?? null,
          data_baixa: data_baixa ?? null,
          referencia_producao_id: referencia_producao_id ?? null,
        });
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        await deleteBaixaEstoque(input.id);
        return { success: true };
      }),
  }),

  // Router para gerenciar ordens de produção
  ordensProducao: router({
    list: publicProcedure.query(async () => {
      return await getOrdensProducao();
    }),
    
    getById: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
      }))
      .query(async ({ input }) => {
        return await getOrdemProducaoById(input.id);
      }),
    
    getByProduto: publicProcedure
      .input(z.object({
        produtoId: z.string().uuid(),
      }))
      .query(async ({ input }) => {
        return await getOrdensProducaoPorProduto(input.produtoId);
      }),
    
    create: publicProcedure
      .input(z.object({
        produto_id: z.string().uuid(),
        status: z.enum(['pendente', 'em_andamento', 'concluida']).default('pendente'),
        quantidade_produzida: z.number().min(0).default(0),
        data_inicio: z.string().datetime().optional(),
        data_conclusao: z.string().datetime().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        return await createOrdemProducao({
          produto_id: input.produto_id,
          status: input.status,
          quantidade_produzida: input.quantidade_produzida,
          data_inicio: input.data_inicio || new Date().toISOString(),
          data_conclusao: input.data_conclusao || null,
        });
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        status: z.enum(['pendente', 'em_andamento', 'concluida']).optional(),
        quantidade_produzida: z.number().min(0).optional(),
        data_conclusao: z.string().datetime().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateOrdemProducao(id, data);
      }),
    
    delete: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
      }))
      .mutation(async ({ input }) => {
        await deleteOrdemProducao(input.id);
        return { success: true };
      }),
    
    validateStock: publicProcedure
      .input(z.object({
        produtoId: z.string().uuid(),
        quantidade: z.number().min(0),
      }))
      .query(async ({ input }) => {
        return await validateStockForProduction(input.produtoId, input.quantidade);
      }),
    
    startProduction: publicProcedure
      .input(z.object({
        ordemId: z.string().uuid(),
        produtoId: z.string().uuid(),
        quantidade: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        const validation = await validateStockForProduction(input.produtoId, input.quantidade);
        if (!validation.isValid) {
          throw new Error(validation.message || 'Estoque insuficiente');
        }
        const deduction = await deductStockForProduction(input.ordemId, input.produtoId, input.quantidade);
        if (!deduction.success) {
          throw new Error(deduction.message || 'Erro ao deduzir estoque');
        }
        await updateOrdemProducao(input.ordemId, {
          status: 'em_andamento',
          data_inicio: new Date().toISOString(),
        });
        return { success: true, message: 'Producao iniciada e estoque deduzido' };
      }),
  }),

  // Router para upload de arquivos
  upload: router({
    image: publicProcedure
      .input(z.object({
        base64: z.string(),
        filename: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Converter base64 para buffer
        const base64Data = input.base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Gerar nome único
        const timestamp = Date.now();
        const key = `produtos/${timestamp}-${input.filename}`;
        
        // Upload para S3
        const result = await storagePut(key, buffer, input.contentType);
        
        return { url: result.url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
