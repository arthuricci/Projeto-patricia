# Plano de Implementação: Bug #1 Fix (Option A)

## Objetivo
Corrigir o problema onde o estoque não diminui ao registrar uma baixa manual, mantendo o histórico de compras imutável.

## Problema Atual
- Quando um usuário registra uma baixa em "Dar Baixa em Insumos", a quantidade é registrada na tabela `baixas_estoque`
- Porém, a página "Ver Estoque" continua mostrando a quantidade original
- Isso ocorre porque o cálculo de estoque usa apenas `SUM(lotes.quantidade_atual)`, ignorando as baixas

## Solução (Option A)
Implementar cálculo dinâmico de estoque:
```
Estoque Atual = SUM(lotes.quantidade_inicial) - SUM(baixas_estoque.quantidade_baixada WHERE insumo_id = X)
```

## Mudanças Necessárias

### 1. Backend - Criar nova query em `server/db.ts`

**Função: `getEstoqueAtualPorInsumo(insumoId: string)`**
- Busca todos os lotes do insumo
- Calcula: `SUM(quantidade_inicial) - SUM(quantidade_baixada das baixas)`
- Retorna um objeto: `{ insumo_id, quantidade_inicial_total, quantidade_baixada_total, estoque_atual }`

**Função: `getEstoqueAtualTodos()`**
- Retorna estoque atual para TODOS os insumos
- Usa a função anterior em um loop

### 2. Backend - Criar novo tRPC procedure em `server/routers.ts`

**Procedure: `insumos.getEstoqueAtual`**
- Input: `insumoId: string (opcional)`
- Output: Se insumoId fornecido, retorna estoque de 1 insumo; senão retorna de todos
- Usa as funções criadas acima

### 3. Frontend - Atualizar `VerEstoque.tsx`

**Mudança na query:**
```typescript
// ANTES:
const { data: lotes = [] } = trpc.lotes.list.useQuery({});

// DEPOIS:
const { data: estoqueAtual = [] } = trpc.insumos.getEstoqueAtual.useQuery();
```

**Mudança no cálculo:**
```typescript
// ANTES:
const insumosComEstoque = useMemo(() => {
  return insumos.map((insumo) => {
    const quantidadeTotal = lotes
      .filter((lote: any) => lote.insumo_id === insumo.id)
      .reduce((sum: number, lote: any) => sum + (lote.quantidade_atual || 0), 0);
    // ...
  });
}, [insumos, lotes]);

// DEPOIS:
const insumosComEstoque = useMemo(() => {
  return insumos.map((insumo) => {
    const estoqueInfo = estoqueAtual.find((e: any) => e.insumo_id === insumo.id);
    const quantidadeTotal = estoqueInfo?.estoque_atual || 0;
    // ...
  });
}, [insumos, estoqueAtual]);
```

### 4. Frontend - Atualizar `DarBaixaInsumos.tsx` (se necessário)

**Mudança na query:**
```typescript
// ANTES:
const { data: lotes = [], refetch: refetchLotes } = trpc.lotes.list.useQuery({});

// DEPOIS:
const { data: estoqueAtual = [], refetch: refetchEstoque } = trpc.insumos.getEstoqueAtual.useQuery();
```

**Mudança no cálculo:**
```typescript
// ANTES:
const insumosComEstoque = useMemo(() => {
  return insumos.map((insumo) => {
    const lotesDoInsumo = lotes.filter((lote) => lote.insumo_id === insumo.id);
    const estoqueTotal = lotesDoInsumo.reduce((sum, lote) => sum + (lote.quantidade_atual || 0), 0);
    // ...
  });
}, [insumos, lotes]);

// DEPOIS:
const insumosComEstoque = useMemo(() => {
  return insumos.map((insumo) => {
    const estoqueInfo = estoqueAtual.find((e: any) => e.insumo_id === insumo.id);
    const estoqueTotal = estoqueInfo?.estoque_atual || 0;
    // ...
  });
}, [insumos, estoqueAtual]);
```

**Mudança no refetch:**
```typescript
// ANTES:
refetchLotes();

// DEPOIS:
refetchEstoque();
```

## Impacto em Outras Páginas

As seguintes páginas também usam `lotes.list` e podem precisar de ajustes:
1. **RegistrarComprasPage.tsx** - Mostra histórico de compras (não precisa mudar, pois mostra lotes originais)
2. **ListaComprasPage.tsx** - Mostra preço médio (pode usar `getEstoqueAtual` para validação)
3. **DesperdícioPage.tsx** - Mostra baixas registradas (não precisa mudar)
4. **FichasTecnicas.tsx** - Calcula custo de ingredientes (pode usar `getEstoqueAtual` para validação)

## Testes Necessários

1. **Teste 1: Registrar compra**
   - Registrar 10 Kg de um insumo
   - Ver Estoque deve mostrar 10 Kg

2. **Teste 2: Dar baixa**
   - Dar baixa de 3 Kg
   - Ver Estoque deve mostrar 7 Kg (10 - 3)
   - Registrar Compras deve continuar mostrando 10 Kg (histórico imutável)

3. **Teste 3: Múltiplas baixas**
   - Dar baixa de 2 Kg
   - Dar baixa de 1 Kg
   - Ver Estoque deve mostrar 4 Kg (10 - 3 - 2 - 1)

4. **Teste 4: Editar compra**
   - Editar quantidade de 10 Kg para 15 Kg
   - Ver Estoque deve mostrar 9 Kg (15 - 3 - 2 - 1)

## Ordem de Implementação

1. Criar funções em `server/db.ts`
2. Criar procedure em `server/routers.ts`
3. Atualizar `VerEstoque.tsx`
4. Atualizar `DarBaixaInsumos.tsx`
5. Testar manualmente
6. Criar checkpoint

## Estimativa de Tempo
- Implementação: ~30 minutos
- Testes: ~15 minutos
- Total: ~45 minutos

