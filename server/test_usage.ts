import { supabase } from './supabaseClient';

async function testUsageQuery() {
  // ID do Leite Condensado (peguei da imagem)
  const insumoId = '5ab286c1-3626-4c38-b969-4ba514fd904e';
  
  console.log('Testando query de uso do insumo...\n');
  
  const { data, error } = await supabase
    .from('ingredientes')
    .select(`
      quantidade,
      fichas_tecnicas (
        nome
      )
    `)
    .eq('insumo_id', insumoId);
  
  console.log('Resultado:', JSON.stringify(data, null, 2));
  console.log('Erro:', error);
}

testUsageQuery();
