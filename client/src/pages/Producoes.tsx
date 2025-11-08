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
import { ArrowLeft, Play, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

export default function Producoes() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: ordens, isLoading } = trpc.ordensProducao.list.useQuery();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrdem, setSelectedOrdem] = useState<any | null>(null);
  const [quantidadeProduzida, setQuantidadeProduzida] = useState(0);

  const updateMutation = trpc.ordensProducao.update.useMutation({
    onSuccess: () => {
      utils.ordensProducao.list.invalidate();
      setIsEditDialogOpen(false);
      setSelectedOrdem(null);
      toast.success('Ordem atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
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
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleIniciar = (ordem: any) => {
    if (ordem.status === 'pendente') {
      setSelectedOrdem(ordem);
      setQuantidadeProduzida(ordem.quantidade_produzida);
      setIsEditDialogOpen(true);
    }
  };

  const handleConcluir = (ordem: any) => {
    updateMutation.mutate({
      id: ordem.id,
      status: 'concluida',
      data_conclusao: new Date().toISOString(),
    });
  };

  const handleConfirmIniciar = () => {
    if (!selectedOrdem) return;
    updateMutation.mutate({
      id: selectedOrdem.id,
      status: 'em_andamento',
      quantidade_produzida: quantidadeProduzida,
    });
  };

  const handleDelete = (ordem: any) => {
    setSelectedOrdem(ordem);
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

  if (isLoading) return <div className="text-center py-8">Carregando...</div>;

  const ordensAtivas = ordens?.filter((o: any) => o.status !== 'concluida') || [];
  const ordensConcluidas = ordens?.filter((o: any) => o.status === 'concluida') || [];

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Produções</h1>
        </div>
        <Button onClick={() => setLocation('/produtos-producao')}>
          Adicionar Produção
        </Button>
      </div>

      {/* Produções em Andamento e Pendentes */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Em Andamento e Pendentes</h2>
        {ordensAtivas.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-gray-200 rounded">
            <p>Nenhuma produção em andamento ou pendente</p>
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
                  <th className="border border-gray-300 px-4 py-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {ordensAtivas.map((ordem: any) => (
                  <tr key={ordem.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">{ordem.produto?.nome || 'N/A'}</td>
                    <td className="border border-gray-300 px-4 py-2">{getStatusBadge(ordem.status)}</td>
                    <td className="border border-gray-300 px-4 py-2">{ordem.quantidade_produzida}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(ordem.data_inicio).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        {ordem.status === 'pendente' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleIniciar(ordem)}
                            disabled={updateMutation.isPending}
                            title="Iniciar produção"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        {ordem.status === 'em_andamento' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConcluir(ordem)}
                            disabled={updateMutation.isPending}
                            title="Concluir produção"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(ordem)}
                          disabled={updateMutation.isPending || deleteMutation.isPending}
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
      </div>

      {/* Produções Concluídas */}
      {ordensConcluidas.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Concluídas</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Produto</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Quantidade</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Data Conclusão</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {ordensConcluidas.map((ordem: any) => (
                  <tr key={ordem.id} className="hover:bg-gray-50 opacity-75">
                    <td className="border border-gray-300 px-4 py-2 font-medium">{ordem.produto?.nome || 'N/A'}</td>
                    <td className="border border-gray-300 px-4 py-2">{ordem.quantidade_produzida}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {ordem.data_conclusao ? new Date(ordem.data_conclusao).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ordem)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Iniciar Produção Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Produção</DialogTitle>
            <DialogDescription>
              Confirme a quantidade e inicie a produção de {selectedOrdem?.produto?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantidade-iniciar">Quantidade a Produzir</Label>
              <Input
                id="quantidade-iniciar"
                type="number"
                min="1"
                value={quantidadeProduzida}
                onChange={(e) => setQuantidadeProduzida(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmIniciar} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Iniciando...' : 'Iniciar Produção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Ordem de Produção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta ordem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
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

