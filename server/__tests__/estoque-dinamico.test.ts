import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '../supabaseClient';
import { 
  getEstoqueAtualPorInsumo, 
  getEstoqueAtualTodos,
  createInsumo,
  createLote,
  createBaixaEstoque,
  getInsumos,
  getLotes,
  getBaixasEstoque
} from '../db';

describe('Bug #1 Fix - Cálculo Dinâmico de Estoque', () => {
  let testInsumoId: string;
  let testLoteId: string;

  beforeAll(async () => {
    // Criar um insumo de teste
    const insumo = await createInsumo({
      nome: 'Farinha de Trigo - Teste Estoque',
      unidade_base: 'Kg',
      nivel_minimo: 5,
      tipo_produto: 'Seco',
    });
    testInsumoId = insumo.id;
    console.log('✓ Insumo de teste criado:', testInsumoId);
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testInsumoId) {
      // Deletar baixas primeiro
      const { data: baixas } = await supabase
        .from('baixas_estoque')
        .select('id')
        .in('lote_id', [testLoteId].filter(Boolean));
      
      if (baixas && baixas.length > 0) {
        await supabase
          .from('baixas_estoque')
          .delete()
          .in('id', baixas.map(b => b.id));
      }

      // Deletar lotes
      await supabase
        .from('lotes')
        .delete()
        .eq('insumo_id', testInsumoId);

      // Deletar insumo
      await supabase
        .from('Insumos')
        .delete()
        .eq('id', testInsumoId);
      
      console.log('✓ Dados de teste limpos');
    }
  });

  it('Deve calcular estoque inicial corretamente quando não há baixas', async () => {
    // Criar um lote com 10 Kg
    const lote = await createLote({
      insumo_id: testInsumoId,
      quantidade_inicial: 10,
      quantidade_atual: 10,
      data_de_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      custo_total_lote: 100,
      preco_por_unidade: 10,
    });
    testLoteId = lote.id;

    // Calcular estoque
    const estoque = await getEstoqueAtualPorInsumo(testInsumoId);

    // Validar resultado
    expect(estoque).toBeDefined();
    expect(estoque?.quantidade_inicial_total).toBe(10);
    expect(estoque?.quantidade_baixada_total).toBe(0);
    expect(estoque?.estoque_atual).toBe(10);
    
    console.log('✓ Teste 1 passou: Estoque inicial = 10 Kg');
  });

  it('Deve diminuir estoque quando uma baixa é registrada', async () => {
    // Registrar uma baixa de 3 Kg
    await createBaixaEstoque({
      lote_id: testLoteId,
      quantidade_baixada: 3,
      motivo: 'desperdicio',
      data_baixa: new Date().toISOString().split('T')[0],
      referencia_producao_id: null,
    });

    // Calcular estoque
    const estoque = await getEstoqueAtualPorInsumo(testInsumoId);

    // Validar resultado
    expect(estoque).toBeDefined();
    expect(estoque?.quantidade_inicial_total).toBe(10);
    expect(estoque?.quantidade_baixada_total).toBe(3);
    expect(estoque?.estoque_atual).toBe(7);
    
    console.log('✓ Teste 2 passou: Estoque após 1ª baixa = 7 Kg (10 - 3)');
  });

  it('Deve diminuir estoque quando múltiplas baixas são registradas', async () => {
    // Registrar uma segunda baixa de 2 Kg
    await createBaixaEstoque({
      lote_id: testLoteId,
      quantidade_baixada: 2,
      motivo: 'vencimento',
      data_baixa: new Date().toISOString().split('T')[0],
      referencia_producao_id: null,
    });

    // Calcular estoque
    const estoque = await getEstoqueAtualPorInsumo(testInsumoId);

    // Validar resultado
    expect(estoque).toBeDefined();
    expect(estoque?.quantidade_inicial_total).toBe(10);
    expect(estoque?.quantidade_baixada_total).toBe(5); // 3 + 2
    expect(estoque?.estoque_atual).toBe(5);
    
    console.log('✓ Teste 3 passou: Estoque após 2ª baixa = 5 Kg (10 - 3 - 2)');
  });

  it('Deve nunca retornar estoque negativo', async () => {
    // Tentar registrar uma baixa maior que o estoque
    await createBaixaEstoque({
      lote_id: testLoteId,
      quantidade_baixada: 10,
      motivo: 'dano',
      data_baixa: new Date().toISOString().split('T')[0],
      referencia_producao_id: null,
    });

    // Calcular estoque
    const estoque = await getEstoqueAtualPorInsumo(testInsumoId);

    // Validar resultado (nunca deve ser negativo)
    expect(estoque).toBeDefined();
    expect(estoque?.estoque_atual).toBeGreaterThanOrEqual(0);
    
    console.log('✓ Teste 4 passou: Estoque nunca fica negativo');
  });

  it('Deve retornar lista de todos os insumos com estoque correto', async () => {
    // Calcular estoque de todos os insumos
    const estoqueList = await getEstoqueAtualTodos();

    // Validar que retornou um array
    expect(Array.isArray(estoqueList)).toBe(true);
    
    // Validar que nosso insumo de teste está na lista
    const nossoEstoque = estoqueList.find(e => e.insumo_id === testInsumoId);
    expect(nossoEstoque).toBeDefined();
    expect(nossoEstoque?.estoque_atual).toBeGreaterThanOrEqual(0);
    
    console.log('✓ Teste 5 passou: Lista de estoque retorna todos os insumos');
  });

  it('Deve manter quantidade_inicial imutável após baixas', async () => {
    // Buscar o lote original
    const lotes = await getLotes(testInsumoId);
    const lote = lotes.find(l => l.id === testLoteId);

    // Validar que quantidade_inicial não mudou
    expect(lote?.quantidade_inicial).toBe(10);
    
    console.log('✓ Teste 6 passou: quantidade_inicial permanece imutável (10 Kg)');
  });
});

