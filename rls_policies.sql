-- ============================================================================
-- RLS Policies para Entremet OS
-- Execute este script no SQL Editor do Supabase
-- ============================================================================

-- ============================================================================
-- 1. INSUMOS - Políticas de RLS
-- ============================================================================

-- Habilitar RLS na tabela insumos
ALTER TABLE "Insumos" ENABLE ROW LEVEL SECURITY;

-- Política SELECT - Permitir leitura para todos (anon)
CREATE POLICY "Allow SELECT on Insumos for anon" ON "Insumos"
  FOR SELECT
  USING (true);

-- Política INSERT - Permitir inserção para todos (anon)
CREATE POLICY "Allow INSERT on Insumos for anon" ON "Insumos"
  FOR INSERT
  WITH CHECK (true);

-- Política UPDATE - Permitir atualização para todos (anon)
CREATE POLICY "Allow UPDATE on Insumos for anon" ON "Insumos"
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política DELETE - Permitir deleção para todos (anon)
CREATE POLICY "Allow DELETE on Insumos for anon" ON "Insumos"
  FOR DELETE
  USING (true);

-- ============================================================================
-- 2. CLIENTES - Políticas de RLS
-- ============================================================================

-- Habilitar RLS na tabela Clientes
ALTER TABLE "Clientes" ENABLE ROW LEVEL SECURITY;

-- Política SELECT
CREATE POLICY "Allow SELECT on Clientes for anon" ON "Clientes"
  FOR SELECT
  USING (true);

-- Política INSERT
CREATE POLICY "Allow INSERT on Clientes for anon" ON "Clientes"
  FOR INSERT
  WITH CHECK (true);

-- Política UPDATE
CREATE POLICY "Allow UPDATE on Clientes for anon" ON "Clientes"
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política DELETE
CREATE POLICY "Allow DELETE on Clientes for anon" ON "Clientes"
  FOR DELETE
  USING (true);

-- ============================================================================
-- 3. PRODUTOS_VENDA - Políticas de RLS
-- ============================================================================

-- Habilitar RLS na tabela produtos_venda
ALTER TABLE "produtos_venda" ENABLE ROW LEVEL SECURITY;

-- Política SELECT
CREATE POLICY "Allow SELECT on produtos_venda for anon" ON "produtos_venda"
  FOR SELECT
  USING (true);

-- Política INSERT
CREATE POLICY "Allow INSERT on produtos_venda for anon" ON "produtos_venda"
  FOR INSERT
  WITH CHECK (true);

-- Política UPDATE
CREATE POLICY "Allow UPDATE on produtos_venda for anon" ON "produtos_venda"
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política DELETE
CREATE POLICY "Allow DELETE on produtos_venda for anon" ON "produtos_venda"
  FOR DELETE
  USING (true);

-- ============================================================================
-- 4. FICHAS_TECNICAS - Políticas de RLS
-- ============================================================================

-- Habilitar RLS na tabela fichas_tecnicas
ALTER TABLE "fichas_tecnicas" ENABLE ROW LEVEL SECURITY;

-- Política SELECT
CREATE POLICY "Allow SELECT on fichas_tecnicas for anon" ON "fichas_tecnicas"
  FOR SELECT
  USING (true);

-- Política INSERT
CREATE POLICY "Allow INSERT on fichas_tecnicas for anon" ON "fichas_tecnicas"
  FOR INSERT
  WITH CHECK (true);

-- Política UPDATE
CREATE POLICY "Allow UPDATE on fichas_tecnicas for anon" ON "fichas_tecnicas"
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política DELETE
CREATE POLICY "Allow DELETE on fichas_tecnicas for anon" ON "fichas_tecnicas"
  FOR DELETE
  USING (true);

-- ============================================================================
-- 5. INGREDIENTES - Políticas de RLS
-- ============================================================================

-- Habilitar RLS na tabela ingredientes
ALTER TABLE "ingredientes" ENABLE ROW LEVEL SECURITY;

-- Política SELECT
CREATE POLICY "Allow SELECT on ingredientes for anon" ON "ingredientes"
  FOR SELECT
  USING (true);

-- Política INSERT
CREATE POLICY "Allow INSERT on ingredientes for anon" ON "ingredientes"
  FOR INSERT
  WITH CHECK (true);

-- Política UPDATE
CREATE POLICY "Allow UPDATE on ingredientes for anon" ON "ingredientes"
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política DELETE
CREATE POLICY "Allow DELETE on ingredientes for anon" ON "ingredientes"
  FOR DELETE
  USING (true);

-- ============================================================================
-- 6. LOTES - Políticas de RLS
-- ============================================================================

-- Habilitar RLS na tabela lotes
ALTER TABLE "lotes" ENABLE ROW LEVEL SECURITY;

-- Política SELECT
CREATE POLICY "Allow SELECT on lotes for anon" ON "lotes"
  FOR SELECT
  USING (true);

-- Política INSERT
CREATE POLICY "Allow INSERT on lotes for anon" ON "lotes"
  FOR INSERT
  WITH CHECK (true);

-- Política UPDATE
CREATE POLICY "Allow UPDATE on lotes for anon" ON "lotes"
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política DELETE
CREATE POLICY "Allow DELETE on lotes for anon" ON "lotes"
  FOR DELETE
  USING (true);

-- ============================================================================
-- 7. LISTA_COMPRAS - Políticas de RLS
-- ============================================================================

-- Habilitar RLS na tabela lista_compras
ALTER TABLE "lista_compras" ENABLE ROW LEVEL SECURITY;

-- Política SELECT
CREATE POLICY "Allow SELECT on lista_compras for anon" ON "lista_compras"
  FOR SELECT
  USING (true);

-- Política INSERT
CREATE POLICY "Allow INSERT on lista_compras for anon" ON "lista_compras"
  FOR INSERT
  WITH CHECK (true);

-- Política UPDATE
CREATE POLICY "Allow UPDATE on lista_compras for anon" ON "lista_compras"
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política DELETE
CREATE POLICY "Allow DELETE on lista_compras for anon" ON "lista_compras"
  FOR DELETE
  USING (true);

-- ============================================================================
-- 8. ITENS_LISTA_COMPRAS - Políticas de RLS
-- ============================================================================

-- Habilitar RLS na tabela itens_lista_compras
ALTER TABLE "itens_lista_compras" ENABLE ROW LEVEL SECURITY;

-- Política SELECT
CREATE POLICY "Allow SELECT on itens_lista_compras for anon" ON "itens_lista_compras"
  FOR SELECT
  USING (true);

-- Política INSERT
CREATE POLICY "Allow INSERT on itens_lista_compras for anon" ON "itens_lista_compras"
  FOR INSERT
  WITH CHECK (true);

-- Política UPDATE
CREATE POLICY "Allow UPDATE on itens_lista_compras for anon" ON "itens_lista_compras"
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política DELETE
CREATE POLICY "Allow DELETE on itens_lista_compras for anon" ON "itens_lista_compras"
  FOR DELETE
  USING (true);

-- ============================================================================
-- 9. BAIXAS_ESTOQUE - Políticas de RLS
-- ============================================================================

-- Habilitar RLS na tabela baixas_estoque
ALTER TABLE "baixas_estoque" ENABLE ROW LEVEL SECURITY;

-- Política SELECT
CREATE POLICY "Allow SELECT on baixas_estoque for anon" ON "baixas_estoque"
  FOR SELECT
  USING (true);

-- Política INSERT
CREATE POLICY "Allow INSERT on baixas_estoque for anon" ON "baixas_estoque"
  FOR INSERT
  WITH CHECK (true);

-- Política UPDATE
CREATE POLICY "Allow UPDATE on baixas_estoque for anon" ON "baixas_estoque"
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política DELETE
CREATE POLICY "Allow DELETE on baixas_estoque for anon" ON "baixas_estoque"
  FOR DELETE
  USING (true);

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

