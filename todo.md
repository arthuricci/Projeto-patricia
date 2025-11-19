# Entremet OS - TODO List

## Fase 1: Fundacao (Concluida)
- [x] Inicializar projeto Next.js com tRPC
- [x] Configurar conexao com Supabase
- [x] Implementar CRUD de Insumos
- [x] Exibir dados na pagina inicial

## Fase 2: CRUDs Basicos (Completo)
- [x] CRUD Insumos (completo)
- [x] CRUD Clientes (completo)
- [x] CRUD Produtos (completo)
- [x] BUG: Campo de upload de imagem - CORRIGIDO
- [x] CRUD Fichas Tecnicas (Receitas) - completo
- [x] CRUD Ordens de Producao (COMPLETO)
- [ ] CRUD Pedidos
- [ ] CRUD Despesas

## Fase 2.5: Estoque (COMPLETO)
- [x] Registrar Insumos - completo
- [x] Ver Estoque - completo
- [x] Registrar Compras - completo
- [x] Dar Baixa em Insumos - COMPLETO E TESTADO
- [x] Lista de Compras - COMPLETO E TESTADO

## Fase 3: Layout e Navegacao
- [x] Menu inicial com cards de navegacao
- [x] Botao "Voltar" em todas as paginas
- [ ] Menu lateral com navegacao
- [ ] Dashboard com graficos
- [ ] Estilizacao com cores da identidade visual

## Bugs Conhecidos
- [ ] Upload de imagem em Produtos nao esta acessivel (Input file precisa ser corrigido)

## Funcionalidades Implementadas
- Listar, criar, editar e excluir Insumos
- Listar, criar, editar e excluir Clientes
- Listar, criar, editar e excluir Produtos
- Upload de imagem para S3 (procedimento tRPC criado)
- Preview de imagem
- Botao de voltar em todas as paginas
- Formatacao de precos em R$
- Status de ativo/inativo para produtos
- Registrar Insumos com estoque
- Ver Estoque com indicadores visuais
- Registrar Compras (lotes)
- Dar Baixa em Insumos (em desenvolvimento)



## Fase 2.6: Melhorias no Estoque
- [ ] Adicionar campo Tipo de Insumo (Láticinio, Perecível, etc)
- [ ] Atualizar formulário Registrar Insumos com campo Tipo
- [ ] Adicionar filtro por Tipo na página Ver Estoque



## Fase 3.5: Ordens de Producao (COMPLETO)
- [x] Backend - Criar tabela ordens_producao no banco
- [x] Backend - Adicionar interfaces OrdemProducao e OrdemProducaoComProduto
- [x] Backend - Implementar funcoes CRUD (getOrdensProducao, createOrdemProducao, updateOrdemProducao, deleteOrdemProducao)
- [x] Backend - Implementar validacao de estoque antes de iniciar producao
- [x] Backend - Implementar deducao automatica de estoque (FIFO) quando producao inicia
- [x] Backend - Criar rotas tRPC para CRUD e stock deduction
- [x] Frontend - Criar componente OrdenProducaoList com listagem, criacao, edicao e delecao
- [x] Frontend - Adicionar validacao de estoque no formulario
- [x] Frontend - Integrar componente ao menu principal com card de navegacao
- [x] Frontend - Adicionar rota /ordens-producao
- [x] Testes - Compilacao TypeScript sem erros
- [x] Testes - Componente renderiza corretamente



## Fase 3.6: Calculadora de Preco Medio por Unidade (COMPLETO)
- [x] Backend - Adicionar coluna preco_por_unidade na tabela lotes
- [x] Backend - Adicionar coluna preco_medio_por_unidade na tabela insumos
- [x] Backend - Implementar funcao calcularPrecoMedioPorUnidade()
- [x] Backend - Implementar funcao atualizarPrecoMedioPorUnidade()
- [x] Backend - Integrar calculo automatico ao registrar compras
- [x] Frontend - Exibir preco medio em Registrar Compras (badge verde)
- [x] Frontend - Exibir preco por unidade em Registrar Compras (badge azul)
- [x] Frontend - Adicionar coluna preco_medio_por_unidade em Ver Estoque
- [x] Frontend - Adicionar preco medio em Fichas Tecnicas (custo de ingredientes)
- [x] Frontend - Adicionar coluna Preco Medio/Unidade em Lista de Compras (lista automatica)
- [x] Frontend - Adicionar coluna Preco Total da Compra em Lista de Compras (itens manuais)
- [x] Testes - Calculo funcionando corretamente (quantidade × preco_medio)
- [x] Testes - Preco total exibindo corretamente em todas as paginas



## Bugs Encontrados
- [ ] Lista de Compras - Preço Total não está somando itens (mostra R$ 0.00)



## Bugs Encontrados - Correção 2
- [ ] Ver Estoque - Unificar colunas "Nível Mínimo" e "Unidade" em uma coluna (ex: 500G)
- [ ] Registrar Compras - Ao editar compra, recalcular preço médio do insumo




## Pack de Adições/Correções - Estoque

### 3. Registrar Compras
- [ ] 3.1: Manter quantidade original em registros de compra (DEFER - complexidade alta, requer refactor de cálculo de estoque)
- [x] 3.2: Exibir data correta de registro (não 31/12/1969)

### 4. Dar Baixa
- [x] 4.1: Adicionar data obrigatória ao dar baixa manual
- [x] 4.2: Adicionar campo de seleção do motivo de perda (configurável)
- [x] 4.3: Criar Página de Desperdício com cards de insumos
- [x] 4.4: Adicionar filtros de tempo na Página de Desperdício

### 5. Lista de Compras
- [ ] 5.1: Converter tabela de listas para cards
- [ ] 5.2: Adicionar função de registrar compra da lista automaticamente

