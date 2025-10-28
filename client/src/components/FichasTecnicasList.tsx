import React, { useState } from 'react';
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
import { Pencil, Trash2, Plus, ArrowLeft, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

interface FichaFormData {
  nome: string | null;
  modo_de_preparo: string | null;
  rendimento_total: number | null;
  unidade_rendimento: string | null;
}

export default function FichasTecnicasList() {
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<{ id: string; nome: string | null } | null>(null);
  const [formData, setFormData] = useState<FichaFormData>({
    nome: null,
    modo_de_preparo: null,
    rendimento_total: null,
    unidade_rendimento: null,
  });

  const utils = trpc.useUtils();

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

  const { data: fichas = [], isLoading } = trpc.fichasTecnicas.list.useQuery();

  const resetForm = () => {
    setFormData({ nome: null, modo_de_preparo: null, rendimento_total: null, unidade_rendimento: null });
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
                <th className="px-6 py-3 text-left text-sm font-semibold">MODO DE PREPARO</th>
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
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {ficha.modo_de_preparo || '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
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
                <Input
                  id="unidade"
                  value={formData.unidade_rendimento || ''}
                  onChange={(e) => setFormData({ ...formData, unidade_rendimento: e.target.value || null })}
                  placeholder="Ex: unidades"
                />
              </div>
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
                <Input
                  id="edit-unidade"
                  value={formData.unidade_rendimento || ''}
                  onChange={(e) => setFormData({ ...formData, unidade_rendimento: e.target.value || null })}
                />
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

