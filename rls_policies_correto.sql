-- ============================================================================
-- RLS Policies para Entremet OS
-- Execute este script no SQL Editor do Supabase
-- ============================================================================

-- ============================================================================
-- 1. insumos - Políticas de RLS
-- ============================================================================

ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow SELECT on insumos for anon" ON insumos
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on insumos for anon" ON insumos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on insumos for anon" ON insumos
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on insumos for anon" ON insumos
  FOR DELETE USING (true);

-- ============================================================================
-- 2. clientes - Políticas de RLS
-- ============================================================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow SELECT on clientes for anon" ON clientes
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on clientes for anon" ON clientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on clientes for anon" ON clientes
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on clientes for anon" ON clientes
  FOR DELETE USING (true);

-- ============================================================================
-- 3. produtos_venda - Políticas de RLS
-- ============================================================================

ALTER TABLE produtos_venda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow SELECT on produtos_venda for anon" ON produtos_venda
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on produtos_venda for anon" ON produtos_venda
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on produtos_venda for anon" ON produtos_venda
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on produtos_venda for anon" ON produtos_venda
  FOR DELETE USING (true);

-- ============================================================================
-- 4. fichas_tecnicas - Políticas de RLS
-- ============================================================================

ALTER TABLE fichas_tecnicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow SELECT on fichas_tecnicas for anon" ON fichas_tecnicas
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on fichas_tecnicas for anon" ON fichas_tecnicas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on fichas_tecnicas for anon" ON fichas_tecnicas
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on fichas_tecnicas for anon" ON fichas_tecnicas
  FOR DELETE USING (true);

-- ============================================================================
-- 5. ingredientes - Políticas de RLS
-- ============================================================================

ALTER TABLE ingredientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow SELECT on ingredientes for anon" ON ingredientes
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on ingredientes for anon" ON ingredientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on ingredientes for anon" ON ingredientes
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on ingredientes for anon" ON ingredientes
  FOR DELETE USING (true);

-- ============================================================================
-- 6. lotes - Políticas de RLS
-- ============================================================================

ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow SELECT on lotes for anon" ON lotes
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on lotes for anon" ON lotes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on lotes for anon" ON lotes
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on lotes for anon" ON lotes
  FOR DELETE USING (true);

-- ============================================================================
-- 7. lista_compras - Políticas de RLS
-- ============================================================================

ALTER TABLE lista_compras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow SELECT on lista_compras for anon" ON lista_compras
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on lista_compras for anon" ON lista_compras
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on lista_compras for anon" ON lista_compras
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on lista_compras for anon" ON lista_compras
  FOR DELETE USING (true);

-- ============================================================================
-- 8. itens_lista_compras - Políticas de RLS
-- ============================================================================

ALTER TABLE itens_lista_compras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow SELECT on itens_lista_compras for anon" ON itens_lista_compras
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on itens_lista_compras for anon" ON itens_lista_compras
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on itens_lista_compras for anon" ON itens_lista_compras
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on itens_lista_compras for anon" ON itens_lista_compras
  FOR DELETE USING (true);

-- ============================================================================
-- 9. baixas_estoque - Políticas de RLS
-- ============================================================================

ALTER TABLE baixas_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow SELECT on baixas_estoque for anon" ON baixas_estoque
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on baixas_estoque for anon" ON baixas_estoque
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on baixas_estoque for anon" ON baixas_estoque
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on baixas_estoque for anon" ON baixas_estoque
  FOR DELETE USING (true);

-- ============================================================================
-- 10. datas_especiais - Políticas de RLS
-- ============================================================================

ALTER TABLE datas_especiais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow SELECT on datas_especiais for anon" ON datas_especiais
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on datas_especiais for anon" ON datas_especiais
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on datas_especiais for anon" ON datas_especiais
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on datas_especiais for anon" ON datas_especiais
  FOR DELETE USING (true);

-- ============================================================================
-- 11. itens_pedido - Políticas de RLS
-- ============================================================================

ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow SELECT on itens_pedido for anon" ON itens_pedido
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on itens_pedido for anon" ON itens_pedido
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on itens_pedido for anon" ON itens_pedido
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on itens_pedido for anon" ON itens_pedido
  FOR DELETE USING (true);

-- ============================================================================
-- 12. pedidos - Políticas de RLS
-- ============================================================================

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow SELECT on pedidos for anon" ON pedidos
  FOR SELECT USING (true);

CREATE POLICY "Allow INSERT on pedidos for anon" ON pedidos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow UPDATE on pedidos for anon" ON pedidos
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow DELETE on pedidos for anon" ON pedidos
  FOR DELETE USING (true);

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

