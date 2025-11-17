import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Trash2, Edit2, ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

export default function ListaComprasPage() {
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [selectedLista, setSelectedLista] = useState<any>(null);
  const [novaListaNome, setNovaListaNome] = useState("");
  const [novoItemInsumo, setNovoItemInsumo] = useState<string>("");
  const [novoItemQuantidade, setNovoItemQuantidade] = useState("");
  const [deleteListaId, setDeleteListaId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Queries
  const { data: listas = [], isLoading: loadingListas, refetch: refetchListas } = trpc.listasCompras.listWithTotals.useQuery();
  const { data: insumos = [] } = trpc.insumos.list.useQuery();
  const { data: insumosCriticos = [] } = trpc.insumos.criticos.useQuery();
  const { data: itensLista = [], refetch: refetchItens } = trpc.itensListaCompras.listByLista.useQuery(
    { listaId: selectedLista?.id || "" },
    { enabled: !!selectedLista }
  );

  // Mutations
  const createListaMutation = trpc.listasCompras.create.useMutation({
    onSuccess: () => {
      toast.success("Lista de compras criada com sucesso!");
      setShowCreateDialog(false);
      setNovaListaNome("");
      refetchListas();
    },
    onError: (error) => {
      toast.error(`Erro ao criar lista: ${error.message}`);
    },
  });

  const deleteListaMutation = trpc.listasCompras.delete.useMutation({
    onSuccess: () => {
      toast.success("Lista deletada com sucesso!");
      setDeleteListaId(null);
      setSelectedLista(null);
      refetchListas();
    },
    onError: (error) => {
      toast.error(`Erro ao deletar lista: ${error.message}`);
    },
  });

  const createItemMutation = trpc.itensListaCompras.create.useMutation({
    onSuccess: async () => {
      toast.success("Item adicionado à lista!");
      setShowItemDialog(false);
      setNovoItemInsumo("");
      setNovoItemQuantidade("");
      await new Promise(resolve => setTimeout(resolve, 500));
      await refetchItens();
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar item: ${error.message}`);
    },
  });

  const deleteItemMutation = trpc.itensListaCompras.delete.useMutation({
    onSuccess: () => {
      toast.success("Item removido da lista!");
      setDeleteItemId(null);
      refetchItens();
    },
    onError: (error) => {
      toast.error(`Erro ao remover item: ${error.message}`);
    },
  });

  // Paginação
  const totalPages = Math.ceil(listas.length / ITEMS_PER_PAGE);
  const paginatedListas = listas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCreateLista = () => {
    if (!novaListaNome.trim()) {
      toast.error("Nome da lista é obrigatório");
      return;
    }

    createListaMutation.mutate({
      nome: novaListaNome,
      data: new Date().toISOString().split('T')[0],
    });
  };

  const handleAddItem = () => {
    if (!novoItemInsumo) {
      toast.error("Selecione um insumo");
      return;
    }

    if (!novoItemQuantidade || parseFloat(novoItemQuantidade) <= 0) {
      toast.error("Quantidade deve ser maior que 0");
      return;
    }

    createItemMutation.mutate({
      lista_compras_id: selectedLista.id,
      insumo_id: novoItemInsumo,
      quantidade: parseFloat(novoItemQuantidade),
    });
  };

  const handleDeleteLista = () => {
    if (deleteListaId) {
      deleteListaMutation.mutate({ id: deleteListaId });
    }
  };

  const handleDeleteItem = () => {
    if (deleteItemId) {
      deleteItemMutation.mutate({ id: deleteItemId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Lista de Compras</h1>
            <p className="text-gray-600">Gerencie suas listas de compras</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/estoque")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Conteúdo Principal */}
        {!selectedLista ? (
          <div className="space-y-6">
            {/* Seção Lista Automática */}
            {insumosCriticos.length > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-yellow-900 mb-1">Lista Automática</h2>
                    <p className="text-sm text-yellow-700">Insumos com estoque crítico (≤ nível mínimo)</p>
                  </div>
                </div>
                <div className="bg-white rounded overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Insumo</TableHead>
                        <TableHead>Estoque Atual</TableHead>
                        <TableHead>Nível Mínimo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Preço Médio/Unidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insumosCriticos.map((insumo: any) => (
                        <TableRow key={insumo.id}>
                          <TableCell className="font-medium">{insumo.nome}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-semibold">
                              {insumo.quantidade_estoque} {insumo.unidade_base}
                            </span>
                          </TableCell>
                          <TableCell>{insumo.nivel_minimo} {insumo.unidade_base}</TableCell>
                          <TableCell>{insumo.tipo_produto || '-'}</TableCell>
                          <TableCell>
                            {insumo.preco_medio_por_unidade ? `R$ ${insumo.preco_medio_por_unidade.toFixed(2)}/${insumo.unidade_base}` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Botão Criar Nova Lista */}
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Lista de Compras
            </Button>

            {/* Tabela de Listas */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Preço Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingListas ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : paginatedListas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                        Nenhuma lista de compras criada
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedListas.map((lista: any) => {
                      const precoTotalLista = lista.preco_total || 0;
                      
                      return (
                      <TableRow key={lista.id}>
                        <TableCell className="font-medium">{lista.nome}</TableCell>
                        <TableCell>
                          {lista.data ? new Date(lista.data).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>
                          R$ {precoTotalLista.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedLista(lista)}
                            className="inline-flex items-center gap-2"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Ver Itens
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteListaId(lista.id)}
                            className="inline-flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Deletar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages} ({listas.length} itens)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header da Lista Selecionada */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedLista.nome}</h2>
                <p className="text-gray-600">
                  {selectedLista.data ? new Date(selectedLista.data).toLocaleDateString('pt-BR') : 'Sem data'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedLista(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </div>

            {/* Botão Adicionar Item */}
            <Button
              onClick={() => setShowItemDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Item
            </Button>

            {/* Tabela de Itens */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Preço Médio/Unidade</TableHead>
                    <TableHead>Preço Total da Compra</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itensLista.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum item nesta lista
                      </TableCell>
                    </TableRow>
                  ) : (
                    itensLista.map((item: any) => {
                      const precoTotalCompra = item.insumo?.preco_medio_por_unidade ? (item.quantidade * item.insumo.preco_medio_por_unidade) : 0;
                      return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.insumo?.nome || 'Insumo desconhecido'}</TableCell>
                        <TableCell>{item.insumo?.unidade_base || '-'}</TableCell>
                        <TableCell>{item.quantidade}</TableCell>
                        <TableCell>
                          {item.insumo?.preco_medio_por_unidade ? `R$ ${item.insumo.preco_medio_por_unidade.toFixed(2)}/${item.insumo.unidade_base}` : '-'}
                        </TableCell>
                        <TableCell>
                          R$ {precoTotalCompra.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteItemId(item.id)}
                            className="inline-flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remover
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Dialog Criar Nova Lista */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Lista de Compras</DialogTitle>
              <DialogDescription>
                Digite o nome da nova lista de compras
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="lista-nome">Nome da Lista</Label>
                <Input
                  id="lista-nome"
                  placeholder="Ex: Compras de Chocolate"
                  value={novaListaNome}
                  onChange={(e) => setNovaListaNome(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateLista}
                  disabled={createListaMutation.isPending}
                >
                  Criar Lista
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Adicionar Item */}
        <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Item à Lista</DialogTitle>
              <DialogDescription>
                Selecione um insumo e a quantidade
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="item-insumo">Insumo</Label>
                <Select value={novoItemInsumo} onValueChange={setNovoItemInsumo}>
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

              <div>
                <Label htmlFor="item-quantidade">Quantidade</Label>
                <Input
                  id="item-quantidade"
                  type="number"
                  placeholder="0"
                  value={novoItemQuantidade}
                  onChange={(e) => setNovoItemQuantidade(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowItemDialog(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddItem}
                  disabled={createItemMutation.isPending}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Alert Dialog Deletar Lista */}
        <AlertDialog open={!!deleteListaId} onOpenChange={(open) => !open && setDeleteListaId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar Lista de Compras</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar esta lista? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteLista}
                className="bg-red-600 hover:bg-red-700"
              >
                Deletar
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Alert Dialog Deletar Item */}
        <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Item</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este item da lista?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteItem}
                className="bg-red-600 hover:bg-red-700"
              >
                Remover
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

