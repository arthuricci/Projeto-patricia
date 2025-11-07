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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Pencil, Trash2, Plus, ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

interface OrdenFormData {
  produto_id: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
  quantidade_produzida: number;
}

export default function OrdenProducaoList() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: ordens, isLoading, error } = trpc.ordensProducao.list.useQuery();
  const { data: produtos = [] } = trpc.produtos.list.useQuery();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrdem, setSelectedOrdem] = useState<{ id: string; produto_id: string } | null>(null);
  const [formData, setFormData] = useState<OrdenFormData>({
    produto_id: '',
    status: 'pendente',
    quantidade_produzida: 0,
  });

  const createMutation = trpc.ordensProducao.create.useMutation({
    onSuccess: () => {
      utils.ordensProducao.list.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Ordem de produção criada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao criar ordem: ${error.message}`);
    },
  });

  const updateMutation = trpc.ordensProducao.update.useMutation({
    onSuccess: () => {
      utils.ordensProducao.list.invalidate();
      setIsEditDialogOpen(false);
      setSelectedOrdem(null);
      resetForm();
      toast.success('Ordem atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar ordem: ${error.message}`);
    },
  });

  const deleteMutation = trpc.ordensProducao.delete.useMutation({
    onSuccess: () => {
      utils.ordensProducao.list.invalidate();
      setIsDeleteDialogOpen(false);
      setSelectedOrdem(null);
      toast.success('Ordem deletada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao deletar ordem: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      produto_id: '',
      status: 'pendente',
      quantidade_produzida: 0,
    });
  };

  const handleCreate = () => {
    if (!formData.produto_id) {
      toast.error('Selecione um produto');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (ordem: any) => {
    setSelectedOrdem({ id: ordem.id, produto_id: ordem.produto_id });
    setFormData({
      produto_id: ordem.produto_id,
      status: ordem.status,
      quantidade_produzida: ordem.quantidade_produzida,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedOrdem) return;
    updateMutation.mutate({
      id: selectedOrdem.id,
      status: formData.status,
      quantidade_produzida: formData.quantidade_produzida,
    });
  };

  const handleDelete = (ordem: any) => {
    setSelectedOrdem({ id: ordem.id, produto_id: ordem.produto_id });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedOrdem) return;
    deleteMutation.mutate({ id: selectedOrdem.id });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
      em_andamento: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Em Andamento' },
      concluida: { bg: 'bg-green-100', text: 'text-green-800', label: 'Concluída' },
    };
    const config = statusMap[status] || statusMap.pendente;
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>{config.label}</span>;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'concluida') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'em_andamento') return <Clock className="w-4 h-4 text-blue-600" />;
    return null;
  };

  if (isLoading) return <div className="text-center py-8">Carregando...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Erro ao carregar ordens</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Ordens de Produção</h1>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Ordem
        </Button>
      </div>

      {!ordens || ordens.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhuma ordem de produção registrada</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Produto</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Quantidade</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Data Início</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Data Conclusão</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ordens.map((ordem: any) => (
                <tr key={ordem.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{ordem.produto?.nome || 'N/A'}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ordem.status)}
                      {getStatusBadge(ordem.status)}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{ordem.quantidade_produzida}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(ordem.data_inicio).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {ordem.data_conclusao ? new Date(ordem.data_conclusao).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(ordem)}
                        disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ordem)}
                        disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ordem de Produção</DialogTitle>
            <DialogDescription>Crie uma nova ordem de produção selecionando um produto</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="produto">Produto</Label>
              <Select value={formData.produto_id} onValueChange={(value) => setFormData({ ...formData, produto_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((produto: any) => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantidade">Quantidade a Produzir</Label>
              <Input
                id="quantidade"
                type="number"
                min="0"
                value={formData.quantidade_produzida}
                onChange={(e) => setFormData({ ...formData, quantidade_produzida: parseFloat(e.target.value) || 0 })}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Ordem de Produção</DialogTitle>
            <DialogDescription>Atualize o status e quantidade da ordem</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantidade-edit">Quantidade Produzida</Label>
              <Input
                id="quantidade-edit"
                type="number"
                min="0"
                value={formData.quantidade_produzida}
                onChange={(e) => setFormData({ ...formData, quantidade_produzida: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Ordem de Produção</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja deletar esta ordem? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

