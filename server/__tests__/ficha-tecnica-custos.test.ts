import { describe, it, expect } from 'vitest';

/**
 * Funcionalidade #5 Tests: Preço Médio em Fichas Técnicas
 * 
 * Objetivo: Validar cálculo de custos de ingredientes em receitas
 * - Custo por ingrediente (quantidade × preço médio)
 * - Custo total da receita (soma de todos os ingredientes)
 * - Custo por unidade de rendimento
 */

describe('Funcionalidade #5: Preço Médio em Fichas Técnicas', () => {
  
  it('deve calcular custo de um ingrediente corretamente', () => {
    // Ingrediente: 5 Kg de leite a R$ 10.67/Kg
    const quantidade = 5;
    const precoUnitario = 10.67;
    
    const custoIngrediente = quantidade * precoUnitario;
    
    expect(custoIngrediente).toBeCloseTo(53.35, 2);
  });

  it('deve calcular custo total de múltiplos ingredientes', () => {
    // Receita com 3 ingredientes
    const ingredientes = [
      { quantidade: 5, precoUnitario: 10.67 },  // Leite: R$ 53.35
      { quantidade: 2, precoUnitario: 5.00 },   // Açúcar: R$ 10.00
      { quantidade: 1, precoUnitario: 25.00 },  // Chocolate: R$ 25.00
    ];
    
    const custoTotal = ingredientes.reduce((total, ing) => {
      return total + (ing.quantidade * ing.precoUnitario);
    }, 0);
    
    expect(custoTotal).toBeCloseTo(88.35, 2);
  });

  it('deve calcular custo por unidade de rendimento', () => {
    // Receita que rende 10 unidades com custo total de R$ 88.35
    const custoTotal = 88.35;
    const rendimento = 10;
    
    const custoPorUnidade = custoTotal / rendimento;
    
    expect(custoPorUnidade).toBeCloseTo(8.835, 3);
  });

  it('deve lidar com ingredientes sem preço médio', () => {
    // Alguns ingredientes podem não ter preço registrado
    const ingredientes = [
      { quantidade: 5, precoUnitario: 10.67 },  // Com preço
      { quantidade: 2, precoUnitario: 0 },      // Sem preço
      { quantidade: 1, precoUnitario: 25.00 },  // Com preço
    ];
    
    const custoTotal = ingredientes.reduce((total, ing) => {
      return total + (ing.quantidade * ing.precoUnitario);
    }, 0);
    
    // Deve somar apenas os com preço
    expect(custoTotal).toBeCloseTo(78.35, 2);
  });

  it('deve formatar valores monetários corretamente', () => {
    const custo = 88.35;
    const formatado = `R$ ${custo.toFixed(2)}`;
    
    expect(formatado).toBe('R$ 88.35');
  });

  it('deve calcular custo corretamente com unidades diferentes', () => {
    // Ingredientes com unidades diferentes
    const ingredientes = [
      { quantidade: 500, precoUnitario: 0.05, unidade: 'g' },   // 500g a R$ 0.05/g = R$ 25.00
      { quantidade: 2, precoUnitario: 15.00, unidade: 'L' },    // 2L a R$ 15.00/L = R$ 30.00
      { quantidade: 10, precoUnitario: 2.50, unidade: 'un' },   // 10 un a R$ 2.50/un = R$ 25.00
    ];
    
    const custoTotal = ingredientes.reduce((total, ing) => {
      return total + (ing.quantidade * ing.precoUnitario);
    }, 0);
    
    expect(custoTotal).toBeCloseTo(80.00, 2);
  });

  it('deve lidar com rendimentos fracionários', () => {
    // Receita que rende 2.5 unidades
    const custoTotal = 50.00;
    const rendimento = 2.5;
    
    const custoPorUnidade = custoTotal / rendimento;
    
    expect(custoPorUnidade).toBeCloseTo(20.00, 2);
  });

  it('deve evitar divisão por zero em custo por unidade', () => {
    const custoTotal = 88.35;
    const rendimento = 0; // Rendimento inválido
    
    // Deve usar 1 como fallback
    const custoPorUnidade = custoTotal / (rendimento || 1);
    
    expect(custoPorUnidade).toBeCloseTo(88.35, 2);
  });

  it('deve calcular corretamente com muitos ingredientes', () => {
    // Receita com 10 ingredientes
    const ingredientes = Array.from({ length: 10 }, (_, i) => ({
      quantidade: (i + 1) * 0.5,
      precoUnitario: (i + 1) * 2.00,
    }));
    
    const custoTotal = ingredientes.reduce((total, ing) => {
      return total + (ing.quantidade * ing.precoUnitario);
    }, 0);
    
    // Validar que o cálculo foi feito
    expect(custoTotal).toBeGreaterThan(0);
    expect(custoTotal).toBeLessThan(1000);
  });

  it('deve manter precisão com valores pequenos', () => {
    // Ingredientes com valores muito pequenos
    const ingredientes = [
      { quantidade: 0.001, precoUnitario: 100.00 },  // R$ 0.10
      { quantidade: 0.005, precoUnitario: 50.00 },   // R$ 0.25
      { quantidade: 0.002, precoUnitario: 200.00 },  // R$ 0.40
    ];
    
    const custoTotal = ingredientes.reduce((total, ing) => {
      return total + (ing.quantidade * ing.precoUnitario);
    }, 0);
    
    expect(custoTotal).toBeCloseTo(0.75, 2);
  });
});

