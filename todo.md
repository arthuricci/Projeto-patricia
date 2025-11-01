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
- [ ] CRUD Pedidos
- [ ] CRUD Ordens de Producao
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

