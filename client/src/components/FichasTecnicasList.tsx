import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Plus, ArrowLeft, ChefHat, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FichaFormData {
  nome: string | null;
  modo_de_preparo: string | null;
  rendimento_total: number | null;
  unidade_rendimento: string | null;
}

interface IngredienteForm {
  insumo_id: string;
  quantidade: number;
}

export default function FichasTecnicasList() {
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isIngredientesDialogOpen, setIsIngredientesDialogOpen] = useState(false);
  const [isReceitaDialogOpen, setIsReceitaDialogOpen] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<{ id: string; nome: string | null } | null>(null);
  const [formData, setFormData] = useState<FichaFormData>({
    nome: null,
    modo_de_preparo: null,
    rendimento_total: null,
    unidade_rendimento: null,
  });
  const [novoIngrediente, setNovoIngrediente] = useState<IngredienteForm>({
    insumo_id: '',
    quantidade: 0,
  });
  const [ingredientesTemporarios, setIngredientesTemporarios] = useState<IngredienteForm[]>([]);
  const [searchInsumo, setSearchInsumo] = useState('');
  const [selectedUnidade, setSelectedUnidade] = useState<string | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: insumos = [] } = trpc.insumos.list.useQuery();
  const { data: ingredientes = [], refetch: refetchIngredientes } = trpc.ingredientes.listByFicha.useQuery(
    { fichaId: selectedFicha?.id || '' },
    { enabled: !!selectedFicha }
  );

  const createMutation = trpc.fichasTecnicas.create.useMutation({
    onSuccess: () => {
      utils.fichasTecnicas.list.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Ficha técnica criada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao criar ficha: ${error.message}`);
    },
  });

  const updateMutation = trpc.fichasTecnicas.update.useMutation({
    onSuccess: () => {
      utils.fichasTecnicas.list.invalidate();
      setIsEditDialogOpen(false);
      setSelectedFicha(null);
      resetForm();
      toast.success('Ficha técnica atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar ficha: ${error.message}`);
    },
  });

  const deleteMutation = trpc.fichasTecnicas.delete.useMutation({
    onSuccess: () => {
      utils.fichasTecnicas.list.invalidate();
      setIsDeleteDialogOpen(false);
      setSelectedFicha(null);
      toast.success('Ficha técnica excluída com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao excluir ficha: ${error.message}`);
    },
  });

  const createIngredienteMutation = trpc.ingredientes.create.useMutation({
    onSuccess: () => {
      refetchIngredientes();
      setNovoIngrediente({ insumo_id: '', quantidade: 0 });
      toast.success('Ingrediente adicionado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar ingrediente: ${error.message}`);
    },
  });

  const deleteIngredienteMutation = trpc.ingredientes.delete.useMutation({
    onSuccess: () => {
      refetchIngredientes();
      toast.success('Ingrediente removido com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao remover ingrediente: ${error.message}`);
    },
  });

  const { data: fichas = [], isLoading } = trpc.fichasTecnicas.list.useQuery();

  const resetForm = () => {
    setFormData({ nome: null, modo_de_preparo: null, rendimento_total: null, unidade_rendimento: null });
  };

  const handleAddInsumoTemporario = () => {
    if (!novoIngrediente.insumo_id || novoIngrediente.quantidade <= 0) {
      toast.error('Selecione um insumo e informe a quantidade');
      return;
    }
    setIngredientesTemporarios([...ingredientesTemporarios, novoIngrediente]);
    setNovoIngrediente({ insumo_id: '', quantidade: 0 });
  };

  const handleRemoveInsumoTemporario = (insumoId: string) => {
    setIngredientesTemporarios(ingredientesTemporarios.filter(i => i.insumo_id !== insumoId));
  };

  const handleCreate = () => {
    if (!formData.nome) {
      toast.error('Nome é obrigatório');
      return;
    }
    createMutation.mutate({
      nome: formData.nome,
      modo_de_preparo: formData.modo_de_preparo,
      rendimento_total: formData.rendimento_total,
      unidade_rendimento: formData.unidade_rendimento,
    });
  };

  const handleEdit = (ficha: any) => {
    setSelectedFicha({ id: ficha.id, nome: ficha.nome });
    setFormData({
      nome: ficha.nome,
      modo_de_preparo: ficha.modo_de_preparo,
      rendimento_total: ficha.rendimento_total,
      unidade_rendimento: ficha.unidade_rendimento,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (selectedFicha) {
      updateMutation.mutate({
        id: selectedFicha.id,
        nome: formData.nome || undefined,
        modo_de_preparo: formData.modo_de_preparo,
        rendimento_total: formData.rendimento_total,
        unidade_rendimento: formData.unidade_rendimento,
      });
    }
  };

  const handleDeleteClick = (ficha: any) => {
    setSelectedFicha({ id: ficha.id, nome: ficha.nome });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedFicha) {
      deleteMutation.mutate({ id: selectedFicha.id });
    }
  };

  const handleOpenIngredientesDialog = (ficha: any) => {
    setSelectedFicha({ id: ficha.id, nome: ficha.nome });
    setIsIngredientesDialogOpen(true);
  };

  const handleOpenReceitaDialog = (ficha: any) => {
    setSelectedFicha({ id: ficha.id, nome: ficha.nome });
    setFormData({
      nome: ficha.nome,
      modo_de_preparo: ficha.modo_de_preparo,
      rendimento_total: ficha.rendimento_total,
      unidade_rendimento: ficha.unidade_rendimento,
    });
    setIsReceitaDialogOpen(true);
  };

  const handleSaveReceita = () => {
    if (selectedFicha) {
      updateMutation.mutate({
        id: selectedFicha.id,
        modo_de_preparo: formData.modo_de_preparo,
      });
      setIsReceitaDialogOpen(false);
    }
  };

  const handleAddIngrediente = () => {
    if (!novoIngrediente.insumo_id || novoIngrediente.quantidade <= 0) {
      toast.error('Selecione um insumo e informe a quantidade');
      return;
    }

    if (selectedFicha) {
      createIngredienteMutation.mutate({
        ficha_tecnica_id: selectedFicha.id,
        insumo_id: novoIngrediente.insumo_id,
        quantidade: novoIngrediente.quantidade,
      });
    }
  };

  const handleRemoveIngrediente = (ingredienteId: string) => {
    deleteIngredienteMutation.mutate({ id: ingredienteId });
  };

  const getInsumoNome = (insumoId: string) => {
    return insumos.find((i: any) => i.id === insumoId)?.nome || 'Insumo desconhecido';
  };

  const getInsumoUnidade = (insumoId: string) => {
    return insumos.find((i: any) => i.id === insumoId)?.unidade_base || '';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-orange-600" />
            Fichas Técnicas
          </h1>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Ficha
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500">Carregando fichas técnicas...</p>
      ) : fichas.length === 0 ? (
        <p className="text-center text-gray-500">Nenhuma ficha técnica cadastrada</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">NOME</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">RENDIMENTO</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {fichas.map((ficha: any) => (
                <tr key={ficha.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{ficha.nome || '-'}</td>
                  <td className="px-6 py-4">
                    {ficha.rendimento_total ? `${ficha.rendimento_total} ${ficha.unidade_rendimento || ''}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReceitaDialog(ficha)}
                      className="text-orange-600 hover:text-orange-800"
                      title="Ver receita"
                    >
                      Ver Receita
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenIngredientesDialog(ficha)}
                      className="text-green-600 hover:text-green-800"
                      title="Gerenciar ingredientes"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(ficha)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(ficha)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog para Criar Ficha */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Ficha Técnica</DialogTitle>
            <DialogDescription>
              Adicione uma nova receita ao sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome da Receita</Label>
              <Input
                id="nome"
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value || null })}
                placeholder="Ex: Brigadeiro Gourmet"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="modo">Modo de Preparo</Label>
              <Textarea
                id="modo"
                value={formData.modo_de_preparo || ''}
                onChange={(e) => setFormData({ ...formData, modo_de_preparo: e.target.value || null })}
                placeholder="Descreva o modo de preparo..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rendimento">Rendimento</Label>
                <Input
                  id="rendimento"
                  type="number"
                  step="0.01"
                  value={formData.rendimento_total || ''}
                  onChange={(e) => setFormData({ ...formData, rendimento_total: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Ex: 10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Select value={formData.unidade_rendimento || ''} onValueChange={(value) => setFormData({ ...formData, unidade_rendimento: value || null })}>
                  <SelectTrigger id="unidade">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidades">Unidades</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="g">Gramas</SelectItem>
                    <SelectItem value="L">Litros</SelectItem>
                    <SelectItem value="ml">Mililitros</SelectItem>
                    <SelectItem value="xícaras">Xícaras</SelectItem>
                    <SelectItem value="colheres">Colheres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border-t pt-4">
              <Label>Insumos da Receita</Label>
              <div className="grid gap-2 mt-2">
                <Select value={novoIngrediente.insumo_id} onValueChange={(value) => setNovoIngrediente({ ...novoIngrediente, insumo_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um insumo" />
                  </SelectTrigger>
                  <SelectContent>
                    {insumos.map((insumo: any) => (
                      <SelectItem key={insumo.id} value={insumo.id}>
                        {insumo.nome} ({insumo.unidade_base})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 mt-2">
                <Label htmlFor="qtd-insumo">Quantidade</Label>
                <Input
                  id="qtd-insumo"
                  type="number"
                  step="0.01"
                  value={novoIngrediente.quantidade || ''}
                  onChange={(e) => setNovoIngrediente({ ...novoIngrediente, quantidade: e.target.value ? Number(e.target.value) : 0 })}
                  placeholder="Ex: 500"
                />
              </div>
              <Button onClick={handleAddInsumoTemporario} className="w-full mt-2" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Insumo
              </Button>
              {ingredientesTemporarios.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label>Insumos Adicionados</Label>
                  {ingredientesTemporarios.map((ing) => {
                    const insumo = insumos.find((i: any) => i.id === ing.insumo_id);
                    return (
                      <div key={ing.insumo_id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                        <span className="text-sm">{insumo?.nome} - {ing.quantidade} {insumo?.unidade_base}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveInsumoTemporario(ing.insumo_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Ficha */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Ficha Técnica</DialogTitle>
            <DialogDescription>
              Altere os dados da receita abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nome">Nome da Receita</Label>
              <Input
                id="edit-nome"
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value || null })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-modo">Modo de Preparo</Label>
              <Textarea
                id="edit-modo"
                value={formData.modo_de_preparo || ''}
                onChange={(e) => setFormData({ ...formData, modo_de_preparo: e.target.value || null })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-rendimento">Rendimento</Label>
                <Input
                  id="edit-rendimento"
                  type="number"
                  step="0.01"
                  value={formData.rendimento_total || ''}
                  onChange={(e) => setFormData({ ...formData, rendimento_total: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-unidade">Unidade</Label>
                <Select value={formData.unidade_rendimento || ''} onValueChange={(value) => setFormData({ ...formData, unidade_rendimento: value || null })}>
                  <SelectTrigger id="edit-unidade">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidades">Unidades</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="g">Gramas</SelectItem>
                    <SelectItem value="L">Litros</SelectItem>
                    <SelectItem value="ml">Mililitros</SelectItem>
                    <SelectItem value="xícaras">Xícaras</SelectItem>
                    <SelectItem value="colheres">Colheres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Visualizar/Editar Receita */}
      <Dialog open={isReceitaDialogOpen} onOpenChange={setIsReceitaDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedFicha?.nome}</DialogTitle>
            <DialogDescription>
              Caderno de Receitas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Modo de Preparo</Label>
              <Textarea
                value={formData.modo_de_preparo || ''}
                onChange={(e) => setFormData({ ...formData, modo_de_preparo: e.target.value || null })}
                placeholder="Descreva o modo de preparo..."
                rows={12}
                className="font-mono text-sm resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceitaDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={handleSaveReceita} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Receita'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Gerenciar Ingredientes */}
      <Dialog open={isIngredientesDialogOpen} onOpenChange={setIsIngredientesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ingredientes - {selectedFicha?.nome}</DialogTitle>
            <DialogDescription>
              Adicione ou remova ingredientes (insumos) desta receita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Seção para Adicionar Ingrediente */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold mb-3">Adicionar Ingrediente</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="insumo-select">Insumo</Label>
                  <Select value={novoIngrediente.insumo_id} onValueChange={(value) => setNovoIngrediente({ ...novoIngrediente, insumo_id: value })}>
                    <SelectTrigger id="insumo-select">
                      <SelectValue placeholder="Selecione um insumo" />
                    </SelectTrigger>
                    <SelectContent>
                      {insumos.map((insumo: any) => (
                        <SelectItem key={insumo.id} value={insumo.id}>
                          {insumo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantidade-input">Quantidade</Label>
                  <Input
                    id="quantidade-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoIngrediente.quantidade || ''}
                    onChange={(e) => setNovoIngrediente({ ...novoIngrediente, quantidade: e.target.value ? Number(e.target.value) : 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddIngrediente} disabled={createIngredienteMutation.isPending} className="w-full">
                    {createIngredienteMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de Ingredientes em Tabela */}
            <div>
              <h3 className="font-semibold mb-3">Ingredientes Adicionados</h3>
              {ingredientes.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhum ingrediente adicionado</p>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-100">
                          <TableHead>Ingrediente</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                          <TableHead className="text-right">Preço/Un</TableHead>
                          <TableHead className="text-right">Custo Total</TableHead>
                          <TableHead className="text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ingredientes.map((ingrediente: any) => {
                          const insumo = insumos.find((i: any) => i.id === ingrediente.insumo_id);
                          const precoUnitario = insumo?.preco_medio_por_unidade || 0;
                          const custoIngrediente = ingrediente.quantidade * precoUnitario;
                          return (
                            <TableRow key={ingrediente.id}>
                              <TableCell className="font-medium">{getInsumoNome(ingrediente.insumo_id)}</TableCell>
                              <TableCell className="text-right">{ingrediente.quantidade} {getInsumoUnidade(ingrediente.insumo_id)}</TableCell>
                              <TableCell className="text-right">
                                {precoUnitario > 0 ? `R$ ${precoUnitario.toFixed(2)}` : '-'}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-blue-600">
                                {precoUnitario > 0 ? `R$ ${custoIngrediente.toFixed(2)}` : '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveIngrediente(ingrediente.id)}
                                  disabled={deleteIngredienteMutation.isPending}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Rodapé com Totais */}
                  {(() => {
                    const custoTotal = ingredientes.reduce((total: number, ing: any) => {
                      const insumo = insumos.find((i: any) => i.id === ing.insumo_id);
                      const precoUnitario = insumo?.preco_medio_por_unidade || 0;
                      return total + (ing.quantidade * precoUnitario);
                    }, 0);
                    
                    const rendimento = formData.rendimento_total || 1;
                    const custoPorUnidade = custoTotal / rendimento;
                    
                    return (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-700">Custo Total da Receita:</span>
                          <span className="text-xl font-bold text-blue-600">R$ {custoTotal.toFixed(2)}</span>
                        </div>
                        {rendimento > 0 && (
                          <div className="flex justify-between items-center text-sm text-gray-600 border-t border-blue-200 pt-2">
                            <span>Custo por {formData.unidade_rendimento || 'unidade'}:</span>
                            <span className="font-semibold text-gray-800">R$ {custoPorUnidade.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIngredientesDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Confirmar Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a ficha técnica <strong>{selectedFicha?.nome || 'sem nome'}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

