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
import { ArrowLeft, Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

interface AgendamentoFormData {
  quantidade: number;
  dataInicio: string;
}

export default function ProdutosProducao() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: produtos, isLoading } = trpc.produtos.list.useQuery();

  const [isAgendamentoDialogOpen, setIsAgendamentoDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<{ id: string; nome: string | null } | null>(null);
  const [formData, setFormData] = useState<AgendamentoFormData>({
    quantidade: 1,
    dataInicio: new Date().toISOString().split('T')[0],
  });

  const createMutation = trpc.ordensProducao.create.useMutation({
    onSuccess: () => {
      utils.ordensProducao.list.invalidate();
      toast.success('Ordem de produção criada com sucesso!');
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      quantidade: 1,
      dataInicio: new Date().toISOString().split('T')[0],
    });
    setSelectedProduto(null);
    setIsAgendamentoDialogOpen(false);
  };

  const handleIniciarProducao = (produtoId: string) => {
    createMutation.mutate({
      produto_id: produtoId,
      status: 'em_andamento',
      quantidade_produzida: 0,
    });
  };

  const handleAgendar = (produto: any) => {
    setSelectedProduto({ id: produto.id, nome: produto.nome });
    setIsAgendamentoDialogOpen(true);
  };

  const handleConfirmAgendamento = () => {
    if (!selectedProduto) return;
    
    createMutation.mutate({
      produto_id: selectedProduto.id,
      status: 'pendente',
      quantidade_produzida: formData.quantidade,
      data_inicio: new Date(formData.dataInicio).toISOString(),
    });
  };

  if (isLoading) return <div className="text-center py-8">Carregando...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Produtos para Produção</h1>
        </div>
        <Button onClick={() => setLocation('/producoes')}>
          Ver Produções
        </Button>
      </div>

      {!produtos || produtos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhum produto cadastrado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Produto</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Descrição</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Preço</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto: any) => (
                <tr key={produto.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-medium">{produto.nome}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">{produto.descricao || '-'}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {produto.preco_venda ? `R$ ${produto.preco_venda.toFixed(2)}` : '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleIniciarProducao(produto.id)}
                        disabled={createMutation.isPending}
                        title="Iniciar produção imediatamente"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAgendar(produto)}
                        disabled={createMutation.isPending}
                        title="Agendar produção"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Agendamento Dialog */}
      <Dialog open={isAgendamentoDialogOpen} onOpenChange={setIsAgendamentoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Produção</DialogTitle>
            <DialogDescription>
              Agende a produção de {selectedProduto?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="data">Data de Início</Label>
              <Input
                id="data"
                type="date"
                value={formData.dataInicio}
                onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="quantidade-agendamento">Quantidade a Produzir</Label>
              <Input
                id="quantidade-agendamento"
                type="number"
                min="1"
                value={formData.quantidade}
                onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAgendamentoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAgendamento} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Agendando...' : 'Agendar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

