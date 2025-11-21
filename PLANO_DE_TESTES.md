# 🧪 PLANO DE TESTES - ENTREMET OS

## Instruções Gerais

- Teste cada funcionalidade seguindo a ordem

- Marque com ✅ quando passar

- Marque com ❌ quando falhar e descreva o problema

- Não pule nenhum teste

---

## 📦 MÓDULO 1: ESTOQUE - REGISTRAR INSUMOS

### Teste 1.1: Criar Novo Insumo

**Passos:**

1. Vá para: Estoque → Registrar Insumos

1. Preencha os campos:
  - Nome: "Leite Integral 1L"
  - Tipo: "Láticinio"
  - Unidade: "Litro"
  - Nível Mínimo: "10"

1. Clique em "Registrar Insumo"

**Resultado Esperado:**

- ✅ Mensagem de sucesso aparece

- ✅ Insumo aparece na lista "Ver Estoque"

- ✅ Campos são limpos para novo registro

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 1.2: Editar Insumo

**Passos:**

1. Vá para: Estoque → Ver Estoque

1. Encontre o insumo "Leite Integral 1L"

1. Clique no botão de editar (lápis)

1. Mude o "Nível Mínimo" para "15"

1. Clique em "Salvar"

**Resultado Esperado:**

- ✅ Nível mínimo atualizado para "15 (Litro)"

- ✅ Mensagem de sucesso aparece

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 1.3: Deletar Insumo

**Passos:**

1. Vá para: Estoque → Ver Estoque

1. Encontre o insumo "Leite Integral 1L"

1. Clique no botão de deletar (lixeira)

1. Confirme a exclusão

**Resultado Esperado:**

- ✅ Insumo desaparece da lista

- ✅ Mensagem de sucesso aparece

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

## 💳 MÓDULO 2: ESTOQUE - REGISTRAR COMPRAS

### Teste 2.1: Registrar Nova Compra

**Passos:**

1. Vá para: Estoque → Registrar Compras

1. Selecione um insumo (ex: "Leite Integral")

1. Preencha:
  - Quantidade: "50"
  - Preço: "5.50"
  - Data de Registro: (deixe a data de hoje)

1. Clique em "Registrar Compra"

**Resultado Esperado:**

- ✅ Mensagem de sucesso aparece

- ✅ Preço médio/unidade é calculado e exibido

- ✅ Compra aparece em "Registros Passados"

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 2.2: Data de Registro Customizada

**Passos:**

1. Vá para: Estoque → Registrar Compras

1. Selecione um insumo

1. Preencha:
  - Quantidade: "30"
  - Preço: "6.00"
  - Data de Registro: "15/11/2025" (data anterior)

1. Clique em "Registrar Compra"

**Resultado Esperado:**

- ✅ Compra é registrada com a data customizada

- ✅ Em "Registros Passados", a data aparece como "15/11/2025" (não 31/12/1969)

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 2.3: Editar Compra Registrada

**Passos:**

1. Vá para: Estoque → Registrar Compras

1. Clique em "Registros Passados"

1. Clique em "Ver Compras" de um insumo

1. Clique no botão de editar (lápis) de uma compra

1. Mude a quantidade para "60"

1. Clique em "Salvar"

**Resultado Esperado:**

- ✅ Quantidade atualizada para "60"

- ✅ Modal fecha e volta para lista

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 2.4: Deletar Compra Registrada

**Passos:**

1. Vá para: Estoque → Registrar Compras

1. Clique em "Registros Passados"

1. Clique em "Ver Compras" de um insumo

1. Clique no botão de deletar (lixeira)

1. Confirme a exclusão

**Resultado Esperado:**

- ✅ Compra desaparece da lista

- ✅ Mensagem de sucesso aparece

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

## 📉 MÓDULO 3: ESTOQUE - VER ESTOQUE

### Teste 3.1: Visualizar Estoque

**Passos:**

1. Vá para: Estoque → Ver Estoque

1. Observe a tabela com insumos

**Resultado Esperado:**

- ✅ Coluna "Nível Mínimo" mostra formato unificado (ex: "10 (Kg)", "5 (Litro)")

- ✅ Coluna "Preço Médio/Unidade" mostra o valor (ex: "R$ 5.50")

- ✅ Coluna "Status" mostra "✅ Em Estoque" ou "⚠️ Abaixo do Mínimo"

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 3.2: Filtrar por Unidade

**Passos:**

1. Vá para: Estoque → Ver Estoque

1. Clique em "Filtrar por unidade"

1. Selecione "Kg"

1. Observe a tabela

**Resultado Esperado:**

- ✅ Apenas insumos com unidade "Kg" aparecem

- ✅ Botão "Limpar Filtro" aparece e funciona

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 3.3: Buscar Insumo

**Passos:**

1. Vá para: Estoque → Ver Estoque

1. Digite "Leite" no campo de busca

1. Observe a tabela

**Resultado Esperado:**

- ✅ Apenas insumos com "Leite" no nome aparecem

- ✅ Busca é instantânea (sem clicar em botão)

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

## 🔴 MÓDULO 4: ESTOQUE - DAR BAIXA

### Teste 4.1: Dar Baixa Manual com Data e Motivo

**Passos:**

1. Vá para: Estoque → Dar Baixa

1. Clique em "Dar Baixa" de um insumo

1. Clique em "Baixar" de um lote

1. Preencha:
  - Quantidade a Baixar: "5"
  - Data da Baixa: (deixe a data de hoje)
  - Motivo da Perda: "Desperdício"

1. Clique em "Confirmar Baixa"

**Resultado Esperado:**

- ✅ Modal fecha

- ✅ Mensagem de sucesso aparece

- ✅ Quantidade em "Ver Estoque" diminui

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 4.2: Data da Baixa Customizada

**Passos:**

1. Vá para: Estoque → Dar Baixa

1. Clique em "Dar Baixa" de um insumo

1. Clique em "Baixar" de um lote

1. Preencha:
  - Quantidade a Baixar: "3"
  - Data da Baixa: "10/11/2025" (data anterior)
  - Motivo da Perda: "Vencimento"

1. Clique em "Confirmar Baixa"

**Resultado Esperado:**

- ✅ Baixa é registrada com a data customizada

- ✅ Em "Análise de Desperdício", a data aparece corretamente

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 4.3: Diferentes Motivos de Perda

**Passos:**

1. Vá para: Estoque → Dar Baixa

1. Dê baixa 5 vezes com motivos diferentes:
  - Desperdício
  - Vencimento
  - Dano
  - Roubo
  - Outro

1. Observe se todos os motivos são aceitos

**Resultado Esperado:**

- ✅ Todos os 5 motivos são aceitos

- ✅ Nenhum erro aparece

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

## 📊 MÓDULO 5: ESTOQUE - ANÁLISE DE DESPERDÍCIO

### Teste 5.1: Visualizar Página de Desperdício

**Passos:**

1. Vá para: Estoque → Análise de Desperdício

1. Observe a página

**Resultado Esperado:**

- ✅ Página carrega sem erros

- ✅ Cards de insumos aparecem (se houver baixas registradas)

- ✅ Cada card mostra: Nome do insumo + Quantidade total desperdiçada

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 5.2: Filtro "Última Semana"

**Passos:**

1. Vá para: Estoque → Análise de Desperdício

1. Clique em "Última Semana"

1. Observe os cards

**Resultado Esperado:**

- ✅ Apenas baixas dos últimos 7 dias aparecem

- ✅ Quantidade total é recalculada

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 5.3: Filtro "Último Mês"

**Passos:**

1. Vá para: Estoque → Análise de Desperdício

1. Clique em "Último Mês"

1. Observe os cards

**Resultado Esperado:**

- ✅ Apenas baixas dos últimos 30 dias aparecem

- ✅ Quantidade total é recalculada

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 5.4: Filtro "Todo Tempo"

**Passos:**

1. Vá para: Estoque → Análise de Desperdício

1. Clique em "Todo Tempo"

1. Observe os cards

**Resultado Esperado:**

- ✅ Todas as baixas aparecem (sem limite de data)

- ✅ Quantidade total é a soma de todas as baixas

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 5.5: Expandir Card para Ver Detalhes

**Passos:**

1. Vá para: Estoque → Análise de Desperdício

1. Clique em um card de insumo

1. Observe os detalhes

**Resultado Esperado:**

- ✅ Card expande mostrando lista de baixas

- ✅ Cada baixa mostra: Data + Quantidade + Motivo

- ✅ Clique novamente fecha o card

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

## 🛒 MÓDULO 6: ESTOQUE - LISTA DE COMPRAS

### Teste 6.1: Criar Nova Lista de Compras

**Passos:**

1. Vá para: Estoque → Lista de Compras

1. Clique em "Nova Lista"

1. Preencha:
  - Nome: "Compras Semana 1"

1. Clique em "Criar Lista"

**Resultado Esperado:**

- ✅ Nova lista aparece na tabela

- ✅ Mensagem de sucesso aparece

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 6.2: Adicionar Itens à Lista

**Passos:**

1. Vá para: Estoque → Lista de Compras

1. Clique em "Ver Itens" de uma lista

1. Clique em "Adicionar Item"

1. Preencha:
  - Insumo: "Leite Integral"
  - Quantidade: "20"

1. Clique em "Adicionar"

**Resultado Esperado:**

- ✅ Item aparece na tabela da lista

- ✅ Colunas mostram: Insumo | Unidade | Quantidade | Preço Médio/Unidade | Preço Total da Compra | Ação

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 6.3: Preço Total da Compra Calculado

**Passos:**

1. Vá para: Estoque → Lista de Compras

1. Clique em "Ver Itens" de uma lista que tenha itens

1. Observe a coluna "Preço Total da Compra"

**Resultado Esperado:**

- ✅ Preço Total = Quantidade × Preço Médio/Unidade

- ✅ Exemplo: 20 Kg × R$ 5.50/Kg = R$ 110.00

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 6.4: Preço Total da Lista

**Passos:**

1. Vá para: Estoque → Lista de Compras

1. Observe a coluna "Preço Total" na tabela de listas

**Resultado Esperado:**

- ✅ Preço Total = Soma de todos os "Preço Total da Compra" dos itens

- ✅ Exemplo: Se tem 2 itens (R$ 110.00 + R$ 50.00 = R$ 160.00)

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 6.5: Editar Item da Lista

**Passos:**

1. Vá para: Estoque → Lista de Compras

1. Clique em "Ver Itens" de uma lista

1. Clique no botão de editar (lápis) de um item

1. Mude a quantidade para "30"

1. Clique em "Salvar"

**Resultado Esperado:**

- ✅ Quantidade atualizada para "30"

- ✅ Preço Total da Compra recalculado

- ✅ Preço Total da Lista recalculado

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 6.6: Deletar Item da Lista

**Passos:**

1. Vá para: Estoque → Lista de Compras

1. Clique em "Ver Itens" de uma lista

1. Clique no botão de deletar (lixeira) de um item

1. Confirme a exclusão

**Resultado Esperado:**

- ✅ Item desaparece da lista

- ✅ Preço Total da Lista recalculado

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 6.7: Deletar Lista de Compras

**Passos:**

1. Vá para: Estoque → Lista de Compras

1. Clique no botão de deletar (lixeira) de uma lista

1. Confirme a exclusão

**Resultado Esperado:**

- ✅ Lista desaparece da tabela

- ✅ Mensagem de sucesso aparece

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

## 💰 MÓDULO 7: PREÇO MÉDIO POR UNIDADE

### Teste 7.1: Cálculo de Preço Médio ao Registrar Compra

**Passos:**

1. Vá para: Estoque → Registrar Compras

1. Selecione um insumo novo (sem compras anteriores)

1. Registre uma compra:
  - Quantidade: "100"
  - Preço: "10.00"

1. Observe o "Preço Médio/Unidade" exibido

**Resultado Esperado:**

- ✅ Preço Médio = R$ 10.00 (primeira compra = preço da compra)

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 7.2: Preço Médio com Múltiplas Compras

**Passos:**

1. Vá para: Estoque → Registrar Compras

1. Selecione o mesmo insumo do teste anterior

1. Registre uma segunda compra:
  - Quantidade: "50"
  - Preço: "12.00"

1. Observe o novo "Preço Médio/Unidade"

**Resultado Esperado:**

- ✅ Preço Médio = (100×10 + 50×12) / (100+50) = R$ 10.67

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 7.3: Preço Médio em Ver Estoque

**Passos:**

1. Vá para: Estoque → Ver Estoque

1. Procure pelo insumo testado acima

1. Observe a coluna "Preço Médio/Unidade"

**Resultado Esperado:**

- ✅ Mostra o mesmo valor calculado (R$ 10.67)

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 7.4: Preço Médio em Fichas Técnicas

**Passos:**

1. Vá para: Fichas Técnicas

1. Abra uma ficha que use o insumo testado

1. Observe o custo dos ingredientes

**Resultado Esperado:**

- ✅ Custo do ingrediente = Quantidade × Preço Médio/Unidade

- ✅ Exemplo: 5 Kg × R$ 10.67 = R$ 53.35

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

## 📝 MÓDULO 8: NAVEGAÇÃO E LAYOUT

### Teste 8.1: Menu Principal

**Passos:**

1. Vá para a página inicial (Home)

1. Observe os cards de navegação

**Resultado Esperado:**

- ✅ Cards aparecem: Estoque, Clientes, Produtos, Produção, Fichas Técnicas

- ✅ Cada card tem descrição clara

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 8.2: Botão Voltar

**Passos:**

1. Vá para qualquer página (ex: Ver Estoque)

1. Clique em "Voltar"

**Resultado Esperado:**

- ✅ Volta para a página anterior (ou menu principal)

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

### Teste 8.3: Submenu de Estoque

**Passos:**

1. Vá para: Estoque

1. Observe os botões de submenu

**Resultado Esperado:**

- ✅ Botões aparecem: Registrar Insumos, Ver Estoque, Registrar Compras, Dar Baixa, Análise de Desperdício, Lista de Compras

- ✅ Cada botão leva para a página correta

**Seu Resultado:** [ ] Passou [ ] Falhou **Observações:** _________________

---

## 🎯 RESUMO DOS TESTES

Total de Testes: **47**

**Testes Passados:** _____ / 47 **Testes Falhados:** _____ / 47 **Taxa de Sucesso:** _____%

---

## 📌 PROBLEMAS ENCONTRADOS

| # | Módulo | Teste | Descrição | Severidade |
| --- | --- | --- | --- | --- |
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

---

## ✅ CONCLUSÃO

**Status Geral:** [ ] Pronto para Produção [ ] Precisa de Correções [ ] Precisa de Revisão Completa

**Observações Finais:**

---

---

---

