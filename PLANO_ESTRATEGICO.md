# 📋 PLANO ESTRATÉGICO - ENTREMET OS

## 🎯 Objetivo Geral

Corrigir bugs críticos e implementar novas funcionalidades para completar o módulo de Estoque e melhorar a experiência do usuário.

---

## 📊 RESUMO EXECUTIVO

| Categoria | Quantidade | Prioridade |
| --- | --- | --- |
| **Bugs Críticos** | 2 | 🔴 Alta |
| **Bugs Médios** | 3 | 🟡 Média |
| **Novas Adições** | 5 | 🟢 Média |
| **Total de Tarefas** | 10 | - |

---

## 🔴 FASE 1: CORREÇÃO DE BUGS CRÍTICOS (Prioridade Alta)

### Bug #1: Estoque Não Diminui ao Dar Baixa

**Impacto:** 🔴 Crítico - Integridade dos dados comprometida **Status:** ❌ Não Corrigido **Descrição:** Ao dar baixa de um insumo, a quantidade em "Ver Estoque" não diminui

#### Análise do Problema

```
Fluxo Atual (ERRADO):
1. Usuário dá baixa de 5 Kg
2. Registra em baixas_estoque ✅
3. Aparece em Análise de Desperdício ✅
4. MAS quantidade em Ver Estoque NÃO muda ❌

Causa Raiz:
- Removemos a atualização de quantidade_atual para manter histórico imutável
- Mas não implementamos o cálculo dinâmico
```

#### Solução Proposta

**Opção A (Recomendada):** Cálculo Dinâmico

```
Fórmula: quantidade_disponivel = SUM(quantidade_inicial) - SUM(quantidade_baixada)

Vantagens:
✅ Histórico de compras permanece intacto
✅ Histórico de baixas fica registrado
✅ Estoque é calculado dinamicamente
✅ Sem inconsistências

Implementação:
1. Criar função `calcularEstoqueDisponivel(insumo_id)` no backend
2. Modificar query em Ver Estoque para usar esta função
3. Testar com múltiplas compras e baixas
```

**Opção B:** Atualizar quantidade_atual (Simples, mas menos flexível)

```
Vantagens:
✅ Simples de implementar
✅ Rápido

Desvantagens:
❌ Perde o histórico de quantidade original
❌ Difícil reverter se cometer erro
```

#### Recomendação

**Implementar Opção A** - Cálculo Dinâmico

#### Passos de Implementação

- [ ] Criar função `calcularEstoqueDisponivel()` em `server/db.ts`

- [ ] Modificar query de `getInsumos()` para incluir cálculo

- [ ] Testar com dados reais

- [ ] Validar em "Ver Estoque"

- [ ] Validar em "Análise de Desperdício"

---

### Bug #2: Preço Médio Não Recalcula ao Editar Compra

**Impacto:** 🔴 Crítico - Dados financeiros incorretos **Status:** ❌ Não Corrigido **Descrição:** Ao editar quantidade/preço de uma compra, o preço médio não é recalculado

#### Análise do Problema

```
Fluxo Atual (ERRADO):
1. Insumo tem preço médio R$ 10.00
2. Usuário edita uma compra (muda quantidade)
3. Preço médio continua R$ 10.00 ❌
4. Deveria ser recalculado

Causa Raiz:
- Rota lotes.update não chama atualizarPrecoMedioPorUnidade()
- Tentamos implementar mas caiu em loop de erro
```

#### Solução Proposta

**Opção A (Recomendada):** Chamar Função de Recálculo

```
Implementação:
1. Adicionar chamada a atualizarPrecoMedioPorUnidade(insumo_id) 
   após atualizar lote
2. Passar insumo_id na mutation
3. Validar que não cai em loop

Código:
```typescript
lotes: {
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      insumo_id: z.string().uuid(), // ← Adicionar
      quantidade_atual: z.number().optional(),
      preco_por_unidade: z.number().optional(),
      // ... outros campos
    }))
    .mutation(async ({ input }) => {
      await updateLote(input);
      // ← Adicionar recálculo
      await atualizarPrecoMedioPorUnidade(input.insumo_id);
      return { success: true };
    })
}
```

#### Recomendação

**Implementar Opção A** - Chamar Função de Recálculo

#### Passos de Implementação

- [ ] Adicionar `insumo_id` ao schema de entrada de `lotes.update`

- [ ] Adicionar chamada a `atualizarPrecoMedioPorUnidade()` após update

- [ ] Passar `insumo_id` do frontend na mutation

- [ ] Testar edição de compra

- [ ] Validar que preço médio é recalculado

---

## 🟡 FASE 2: CORREÇÃO DE BUGS MÉDIOS (Prioridade Média)

### Bug #3: Botões Invisíveis em Lista de Compras

**Impacto:** 🟡 Médio - UX ruim, mas funcionalidade funciona **Status:** ❌ Não Corrigido **Descrição:** Botões de editar (lápis) e deletar (lixeira) não aparecem visualmente

#### Análise do Problema

```
Sintomas:
- Botões não aparecem na tabela de itens da lista
- Mas as funções funcionam (usuário consegue clicar)
- Parece ser problema de CSS/Tailwind

Causa Provável:
- Classe CSS incorreta ou conflitante
- Ícone não está renderizando
- Tailwind não está aplicando estilos corretamente
```

#### Solução Proposta

**Opção A (Recomendada):** Revisar e Corrigir CSS

```
Passos:
1. Verificar componente ListaComprasPage.tsx
2. Procurar pelos botões de ação (editar/deletar)
3. Verificar classes Tailwind aplicadas
4. Verificar se ícones estão importados corretamente
5. Testar com diferentes resoluções

Exemplo de Correção:
// ❌ Errado (invisível)
<button className="p-0 h-0 w-0">
  <Pencil size={16} />
</button>

// ✅ Correto (visível)
<button className="p-2 h-8 w-8 hover:bg-gray-100 rounded">
  <Pencil size={16} />
</button>
```

#### Recomendação

**Implementar Opção A** - Revisar CSS

#### Passos de Implementação

- [ ] Abrir ListaComprasPage.tsx

- [ ] Procurar seção de botões de ação

- [ ] Verificar classes Tailwind (padding, height, width)

- [ ] Adicionar hover states

- [ ] Testar visibilidade dos botões

---

### Bug #4: Diferença de 1 Dia na Data de Registro

**Impacto:** 🟡 Médio - Dados com pequena imprecisão **Status:** ❌ Não Corrigido **Descrição:** Ao registrar compra com data anterior, salva com 1 dia a menos

#### Análise do Problema

```
Exemplo:
- Usuário seleciona: 15/11/2025
- Sistema salva: 14/11/2025

Causa Provável:
- Problema de timezone/fuso horário
- Conversão de data incorreta
- JavaScript Date() usando UTC vs Local Time
```

#### Solução Proposta

**Opção A (Recomendada):** Usar Biblioteca de Datas

```
Implementação com date-fns ou Day.js:
1. Instalar: npm install date-fns
2. Usar: format(new Date(input.data_registro), 'yyyy-MM-dd')
3. Garantir que sempre use timezone local

Código:
```typescript
import { format, parseISO } from 'date-fns';

const dataSalva = format(
  parseISO(input.data_registro),
  'yyyy-MM-dd'
);
```

#### Recomendação

**Implementar Opção A** - Usar Biblioteca de Datas

#### Passos de Implementação

- [ ] Instalar date-fns: `npm install date-fns`

- [ ] Revisar como data está sendo enviada do frontend

- [ ] Revisar como data está sendo salva no backend

- [ ] Adicionar parsing correto com date-fns

- [ ] Testar com datas anteriores

---

### Bug #5: Preço Médio em Fichas Técnicas Não Implementado

**Impacto:** 🟡 Médio - Feature incompleta **Status:** ❌ Não Implementado **Descrição:** Fichas Técnicas não mostram custo calculado dos ingredientes

#### Análise do Problema

```
Esperado:
- Cada ingrediente deve mostrar: Quantidade × Preço Médio/Unidade = Custo
- Exemplo: 5 Kg × R$ 10.67 = R$ 53.35
- Total de ingredientes deve ser somado

Atual:
- Não há coluna de custo
- Não há cálculo de custo total
```

#### Solução Proposta

**Opção A (Recomendada):** Adicionar Coluna de Custo

```
Implementação:
1. Modificar componente FichasTecnicas.tsx
2. Adicionar coluna "Custo" na tabela de ingredientes
3. Calcular: quantidade × preco_medio_por_unidade
4. Somar todos os custos no rodapé

Estrutura:
Ingrediente | Quantidade | Unidade | Preço/Un | Custo
Leite       | 5          | Kg      | R$ 10.67 | R$ 53.35
Açúcar      | 2          | Kg      | R$ 5.00  | R$ 10.00
                                    TOTAL:      R$ 63.35
```

#### Recomendação

**Implementar Opção A** - Adicionar Coluna de Custo

#### Passos de Implementação

- [ ] Abrir componente FichasTecnicas.tsx

- [ ] Adicionar coluna "Custo" na tabela

- [ ] Implementar cálculo: quantidade × preco_medio

- [ ] Adicionar total no rodapé

- [ ] Testar com múltiplos ingredientes

---

## 🟢 FASE 3: NOVAS ADIÇÕES (Prioridade Média)

### Adição #1: Converter Lista de Compras para Cards (Item 5.1)

**Impacto:** 🟢 Melhoria de UX **Status:** ❌ Não Implementado **Descrição:** Tabela de listas deve ser convertida para layout de cards

#### Análise

```
Atual:
- Tabela com colunas: Nome | Data | Preço Total | Ação
- Pouco atrativo visualmente

Proposto:
- Cards com design moderno
- Cada card mostra: Nome, Data, Preço Total, Status
- Botões de ação mais visíveis
- Melhor responsividade mobile
```

#### Solução Proposta

**Opção A (Recomendada):** Criar Componente de Cards

```
Estrutura do Card:
┌─────────────────────────────┐
│ 📋 Compras Semana 1         │
│ 20/11/2025                  │
│                             │
│ Preço Total: R$ 500.00      │
│ Itens: 5                    │
│                             │
│ [Ver Itens] [Deletar]       │
└─────────────────────────────┘

Implementação:
1. Criar componente ListaComprasCard.tsx
2. Usar shadcn/ui Card component
3. Aplicar Tailwind para layout
4. Adicionar hover effects
```

#### Recomendação

**Implementar Opção A** - Criar Componente de Cards

#### Passos de Implementação

- [ ] Criar componente ListaComprasCard.tsx

- [ ] Implementar layout de card com shadcn/ui

- [ ] Adicionar informações: nome, data, preço, quantidade de itens

- [ ] Adicionar botões de ação (Ver Itens, Deletar)

- [ ] Aplicar grid responsivo (1-3 colunas)

- [ ] Testar em mobile e desktop

---

### Adição #2: Registrar Compra Automática da Lista (Item 5.2)

**Impacto:** 🟢 Automação importante **Status:** ❌ Não Implementado **Descrição:** Botão para registrar todos os itens da lista como compra

#### Análise

```
Fluxo Atual:
1. Criar lista de compras
2. Adicionar itens
3. Ir para "Registrar Compras"
4. Registrar cada item manualmente
5. Muito trabalhoso!

Fluxo Proposto:
1. Criar lista de compras
2. Adicionar itens
3. Clicar em "Registrar Compra da Lista"
4. Sistema cria lotes automaticamente
5. Muito mais rápido!
```

#### Solução Proposta

**Opção A (Recomendada):** Criar Rota tRPC para Registrar Lista

```
Implementação:
1. Criar rota: listasCompras.registrarCompra
2. Receber: lista_id, data_registro (opcional)
3. Para cada item da lista:
   - Criar lote com quantidade e preço médio
   - Atualizar preço médio do insumo
4. Retornar sucesso/erro

Código Backend:
```typescript
registrarCompra: protectedProcedure
  .input(z.object({
    lista_id: z.string().uuid(),
    data_registro: z.date().optional(),
  }))
  .mutation(async ({ input }) => {
    // 1. Buscar itens da lista
    const itens = await getItensListaCompras(input.lista_id);
    
    // 2. Para cada item, criar lote
    for (const item of itens) {
      await createLote({
        insumo_id: item.insumo_id,
        quantidade_inicial: item.quantidade,
        quantidade_atual: item.quantidade,
        preco_por_unidade: item.preco_medio_por_unidade,
        created_at: input.data_registro || new Date(),
      });
      
      // 3. Atualizar preço médio
      await atualizarPrecoMedioPorUnidade(item.insumo_id);
    }
    
    return { success: true, lotes_criados: itens.length };
  })
```

Frontend:

```typescript
const registrarCompraListaMutation = trpc.listasCompras.registrarCompra.useMutation({
  onSuccess: () => {
    toast.success('Compra registrada com sucesso!');
    // Atualizar dados
  },
});

const handleRegistrarCompra = () => {
  registrarCompraListaMutation.mutate({
    lista_id: lista.id,
    data_registro: new Date(),
  });
};
```

#### Recomendação

**Implementar Opção A** - Criar Rota tRPC

#### Passos de Implementação

- [ ] Criar rota `listasCompras.registrarCompra` em routers.ts

- [ ] Implementar lógica de criação de lotes

- [ ] Adicionar botão "Registrar Compra" em ListaComprasPage

- [ ] Adicionar modal de confirmação

- [ ] Testar com lista completa

---

### Adição #3: Melhorar Página de Desperdício com Gráficos

**Impacto:** 🟢 Insights visuais **Status:** ❌ Não Implementado **Descrição:** Adicionar gráficos de tendência de desperdício

#### Análise

```
Atual:
- Cards com quantidade desperdiçada
- Filtros de tempo
- Detalhes expandíveis

Proposto:
- Gráfico de barras: Desperdício por insumo
- Gráfico de linha: Tendência ao longo do tempo
- Estatísticas: Total, Média, Maior perda
```

#### Solução Proposta

**Opção A (Recomendada):** Usar Recharts

```
Implementação:
1. Instalar: npm install recharts
2. Criar gráfico de barras (insumos vs quantidade)
3. Criar gráfico de linha (tendência temporal)
4. Adicionar estatísticas no topo

Exemplo:
<BarChart data={dadosPorInsumo}>
  <XAxis dataKey="nome" />
  <YAxis />
  <Bar dataKey="quantidade" fill="#ef4444" />
</BarChart>
```

#### Recomendação

**Implementar Opção A** - Usar Recharts

#### Passos de Implementação

- [ ] Instalar recharts: `npm install recharts`

- [ ] Criar componente GraficosDesperdicio.tsx

- [ ] Implementar gráfico de barras (insumos)

- [ ] Implementar gráfico de linha (tendência)

- [ ] Adicionar estatísticas (total, média)

- [ ] Integrar em DesperdícioPage

---

### Adição #4: Exportar Relatório de Desperdício em PDF

**Impacto:** 🟢 Funcionalidade útil **Status:** ❌ Não Implementado **Descrição:** Botão para exportar análise de desperdício em PDF

#### Análise

```
Caso de Uso:
- Gerente quer gerar relatório mensal
- Enviar para proprietário
- Documentar perdas para análise

Proposto:
- Botão "Exportar PDF"
- Inclui: Período, Cards, Gráficos, Totais
- Formato profissional
```

#### Solução Proposta

**Opção A (Recomendada):** Usar jsPDF + html2canvas

```
Implementação:
1. Instalar: npm install jspdf html2canvas
2. Criar função exportarPDF()
3. Capturar conteúdo da página
4. Gerar PDF com dados

Código:
```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const exportarPDF = async () => {
  const element = document.getElementById('desperdicio-content');
  const canvas = await html2canvas(element);
  const pdf = new jsPDF();
  
  pdf.addImage(canvas.toDataURL(), 'PNG', 10, 10);
  pdf.save('desperdicio-relatorio.pdf');
};
```

#### Recomendação

**Implementar Opção A** - Usar jsPDF

#### Passos de Implementação

- [ ] Instalar jsPDF e html2canvas

- [ ] Criar função exportarPDF()

- [ ] Adicionar botão "Exportar PDF"

- [ ] Testar exportação com dados reais

---

### Adição #5: Configurações de Motivos de Perda Customizáveis

**Impacto:** 🟢 Flexibilidade **Status:** ❌ Não Implementado **Descrição:** Permitir que usuário customize os motivos de perda

#### Análise

```
Atual:
- Motivos fixos: Desperdício, Vencimento, Dano, Roubo, Outro
- Usuário não pode adicionar novos motivos

Proposto:
- Página de Configurações
- CRUD de motivos de perda
- Usuário pode adicionar/editar/deletar motivos
```

#### Solução Proposta

**Opção A (Recomendada):** Criar Tabela de Motivos

```
Implementação:
1. Criar tabela motivos_perda no banco
2. Campos: id, nome, descricao, ativo, created_at
3. Criar CRUD no backend (tRPC)
4. Criar página de Configurações
5. Integrar dropdown com motivos dinâmicos

Estrutura:
motivos_perda {
  id: UUID
  nome: string (ex: "Desperdício")
  descricao: string (opcional)
  ativo: boolean
  created_at: timestamp
}
```

#### Recomendação

**Implementar Opção A** - Criar Tabela de Motivos

#### Passos de Implementação

- [ ] Criar tabela motivos_perda no Supabase

- [ ] Criar CRUD em backend (get, create, update, delete)

- [ ] Criar página Configurações/Motivos

- [ ] Modificar dropdown em Dar Baixa para usar dados dinâmicos

- [ ] Testar CRUD de motivos

---

## 📅 CRONOGRAMA RECOMENDADO

### Semana 1: Bugs Críticos

- [ ] **Segunda:** Bug #1 (Estoque não diminui)

- [ ] **Terça:** Bug #2 (Preço médio não recalcula)

- [ ] **Quarta:** Testes e validação

### Semana 2: Bugs Médios + Adições Simples

- [ ] **Segunda:** Bug #3 (Botões invisíveis)

- [ ] **Terça:** Bug #4 (Data com 1 dia de diferença)

- [ ] **Quarta:** Bug #5 (Preço em Fichas Técnicas)

- [ ] **Quinta:** Adição #1 (Cards de Lista)

- [ ] **Sexta:** Testes e validação

### Semana 3: Adições Complexas

- [ ] **Segunda:** Adição #2 (Registrar Compra Automática)

- [ ] **Terça/Quarta:** Adição #3 (Gráficos de Desperdício)

- [ ] **Quinta:** Adição #4 (Exportar PDF)

- [ ] **Sexta:** Testes finais

### Semana 4: Refinamentos

- [ ] **Segunda:** Adição #5 (Motivos Customizáveis)

- [ ] **Terça/Quarta:** Testes completos

- [ ] **Quinta:** Correções finais

- [ ] **Sexta:** Deploy e validação final

---

## 🎯 MÉTRICAS DE SUCESSO

| Métrica | Target | Status |
| --- | --- | --- |
| Taxa de Sucesso de Testes | 100% | ⏳ |
| Bugs Críticos Corrigidos | 2/2 | ⏳ |
| Bugs Médios Corrigidos | 3/3 | ⏳ |
| Novas Adições Implementadas | 5/5 | ⏳ |
| Tempo Total | 4 semanas | ⏳ |

---

## 📝 NOTAS IMPORTANTES

1. **Testes:** Cada correção/adição deve ter testes unitários

1. **Validação:** Testar em navegador antes de marcar como completo

1. **Documentação:** Atualizar README conforme novas features

1. **Checkpoint:** Fazer checkpoint após cada fase completada

1. **Feedback:** Validar com usuário antes de próxima fase

---

## 🚀 PRÓXIMOS PASSOS

1. **Revisar este plano** com o usuário

1. **Confirmar prioridades** e cronograma

1. **Começar com Bug #1** (Estoque não diminui)

1. **Fazer checkpoint** após cada bug corrigido

1. **Testar continuamente** conforme implementa

