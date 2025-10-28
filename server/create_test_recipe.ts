import { supabase } from './supabaseClient';

async function createTestRecipe() {
  console.log('Criando receita de teste...\n');
  
  // 1. Criar uma ficha técnica (receita)
  const { data: receita, error: receitaError } = await supabase
    .from('fichas_tecnicas')
    .insert([{
      nome: 'Brigadeiro',
      rendimento: 50,
      unidade_rendimento: 'unidade'
    }])
    .select()
    .single();
  
  if (receitaError) {
    console.error('Erro ao criar receita:', receitaError);
    return;
  }
  
  console.log('Receita criada:', receita);
  
  // 2. Buscar ID do Leite Condensado
  const { data: insumos } = await supabase
    .from('Insumos')
    .select('id, nome')
    .eq('nome', 'Leite Condensado')
    .single();
  
  if (!insumos) {
    console.log('Leite Condensado não encontrado');
    return;
  }
  
  console.log('Insumo encontrado:', insumos);
  
  // 3. Adicionar ingrediente (Leite Condensado na receita)
  const { data: ingrediente, error: ingredienteError } = await supabase
    .from('ingredientes')
    .insert([{
      ficha_tecnica_id: receita.id,
      insumo_id: insumos.id,
      quantidade: 395
    }])
    .select();
  
  if (ingredienteError) {
    console.error('Erro ao criar ingrediente:', ingredienteError);
    return;
  }
  
  console.log('Ingrediente adicionado:', ingrediente);
  console.log('\n✅ Receita de teste criada com sucesso!');
}

createTestRecipe();
