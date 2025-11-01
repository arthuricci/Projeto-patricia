import { useState } from 'react';
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
import { Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

interface InsumoFormData {
  nome: string;
  unidade_base: string;
  nivel_minimo: number;
  tipo_produto: string;
}

export default function InsumosList() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: insumos, isLoading, error } = trpc.insumos.list.useQuery();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState<{ id: string; nome: string } | null>(null);
  const [usageInfo, setUsageInfo] = useState<{ isUsed: boolean; recipes: Array<{ nome: string; quantidade: number }> } | null>(null);
  const [formData, setFormData] = useState<InsumoFormData>({
    nome: '',
    unidade_base: '',
    nivel_minimo: 0,
    tipo_produto: '',
  });

  const createMutation = trpc.insumos.create.useMutation({
    onSuccess: () => {
      utils.insumos.list.invalidate();
      setIsCreateDialogOpen(false);
      setFormData({ nome: '', unidade_base: '', nivel_minimo: 0, tipo_produto: '' });
      toast.success('Insumo criado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao criar insumo: ${error.message}`);
    },
  });

  const updateMutation = trpc.insumos.update.useMutation({
    onSuccess: () => {
      utils.insumos.list.invalidate();
      setIsEditDialogOpen(false);
      setSelectedInsumo(null);
      toast.success('Insumo atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar insumo: ${error.message}`);
    },
  });

  const deleteMutation = trpc.insumos.delete.useMutation({
    onSuccess: () => {
      utils.insumos.list.invalidate();
      setIsDeleteDialogOpen(false);
      setSelectedInsumo(null);
      toast.success('Insumo excluído com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao excluir insumo: ${error.message}`);
    },
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (insumo: any) => {
    setSelectedInsumo({ id: insumo.id, nome: insumo.nome });
    setFormData({
      nome: insumo.nome,
      unidade_base: insumo.unidade_base,
      nivel_minimo: insumo.nivel_minimo,
      tipo_produto: insumo.tipo_produto || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (selectedInsumo) {
      updateMutation.mutate({
        id: selectedInsumo.id,
        ...formData,
      });
    }
  };

  const handleDeleteClick = async (insumo: any) => {
    setSelectedInsumo({ id: insumo.id, nome: insumo.nome });
    
    // Verificar se o insumo está sendo usado
    try {
      const usage = await utils.client.insumos.checkUsage.query({ id: insumo.id });
      setUsageInfo(usage);
      setIsDeleteDialogOpen(true);
    } catch (error) {
      toast.error('Erro ao verificar uso do insumo');
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedInsumo) {
      deleteMutation.mutate({ id: selectedInsumo.id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Carregando insumos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-600">Erro: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Lista de Insumos</h1>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Insumo
        </Button>
      </div>

      {!insumos || insumos.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-gray-600">Nenhum insumo encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nível Mínimo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {insumos.map((insumo) => (
                <tr key={insumo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {insumo.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {insumo.unidade_base}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {insumo.nivel_minimo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(insumo)}
                      className="mr-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(insumo)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog para Criar */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Insumo</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo insumo abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Açúcar"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unidade">Unidade de Medida</Label>
              <Input
                id="unidade"
                value={formData.unidade_base}
                onChange={(e) => setFormData({ ...formData, unidade_base: e.target.value })}
                placeholder="Ex: kg, g, ml, unidade"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nivel">Nível Mínimo</Label>
              <Input
                id="nivel"
                type="number"
                value={formData.nivel_minimo}
                onChange={(e) => setFormData({ ...formData, nivel_minimo: Number(e.target.value) })}
                placeholder="Ex: 500"
              />
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

      {/* Dialog para Editar */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Insumo</DialogTitle>
            <DialogDescription>
              Altere os dados do insumo abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-unidade">Unidade de Medida</Label>
              <Input
                id="edit-unidade"
                value={formData.unidade_base}
                onChange={(e) => setFormData({ ...formData, unidade_base: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-nivel">Nível Mínimo</Label>
              <Input
                id="edit-nivel"
                type="number"
                value={formData.nivel_minimo}
                onChange={(e) => setFormData({ ...formData, nivel_minimo: Number(e.target.value) })}
              />
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

      {/* Dialog para Confirmar Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {usageInfo?.isUsed ? (
                <div className="space-y-2">
                  <p className="font-semibold text-orange-600">
                    ⚠️ Atenção! O insumo <strong>{selectedInsumo?.nome}</strong> está sendo usado em:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {usageInfo.recipes.map((recipe, index) => (
                      <li key={index}>
                        Receita: <strong>{recipe.nome}</strong> ({recipe.quantidade}g)
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-red-600 font-medium">
                    Ao excluir este insumo, ele será removido dessas receitas.
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              ) : (
                <p>
                  Tem certeza que deseja excluir o insumo <strong>{selectedInsumo?.nome}</strong>?
                  Esta ação não pode ser desfeita.
                </p>
              )}
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

