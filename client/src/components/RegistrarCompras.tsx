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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Search, Plus, ShoppingCart, Eye, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const UNIDADES_MEDIDA = ["Kg", "G", "Ml", "L", "unidade", "lata", "caixa"];
const ITEMS_PER_PAGE = 10;

interface FormData {
  quantidade: string;
  data_validade: string;
  preco: string;
}

interface EditFormData {
  quantidade: string;
  data_validade: string;
  preco: string;
}

export default function RegistrarCompras() {
  // Estados da aba Registrar
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnidade, setSelectedUnidade] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInsumo, setSelectedInsumo] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    quantidade: "",
    data_validade: "",
    preco: "",
  });
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showNoValidadeAlert, setShowNoValidadeAlert] = useState(false);
  const [showCriarInsumoDialog, setShowCriarInsumoDialog] = useState(false);
  const [novoInsumoDados, setNovoInsumoDados] = useState({
    nome: "",
    unidade_base: "",
    nivel_minimo: "",
    tipo_produto: "",
  });

  // Estados da aba Registros Passados
  const [searchTermRegistros, setSearchTermRegistros] = useState("");
  const [selectedUnidadeRegistros, setSelectedUnidadeRegistros] = useState<string>("");
  const [currentPageRegistros, setCurrentPageRegistros] = useState(1);
  const [selectedInsumoRegistros, setSelectedInsumoRegistros] = useState<any>(null);
  const [showRegistrosModal, setShowRegistrosModal] = useState(false);
  const [showEditLoteDialog, setShowEditLoteDialog] = useState(false);
  const [loteToEdit, setLoteToEdit] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    quantidade: "",
    data_validade: "",
    preco: "",
  });
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [loteToDelete, setLoteToDelete] = useState<any>(null);

  // Queries
  const { data: insumos = [], isLoading, refetch } = trpc.insumos.list.useQuery();
  const { data: lotes = [], refetch: refetchLotes } = trpc.lotes.list.useQuery({});

  // Mutations
  const createLoteMutation = trpc.lotes.create.useMutation({
    onSuccess: () => {
      toast.success("Compra registrada com sucesso!");
      setShowFormDialog(false);
      setSelectedInsumo(null);
      setFormData({ quantidade: "", data_validade: "", preco: "" });
      refetch();
      refetchLotes();
    },
    onError: (error) => {
      toast.error(`Erro ao registrar compra: ${error.message}`);
    },
  });

  const updateLoteMutation = trpc.lotes.update.useMutation({
    onSuccess: () => {
      toast.success("Compra atualizada com sucesso!");
      setShowEditLoteDialog(false);
      setLoteToEdit(null);
      setEditFormData({ quantidade: "", data_validade: "", preco: "" });
      refetchLotes();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar compra: ${error.message}`);
    },
  });

  const deleteLoteMutation = trpc.lotes.delete.useMutation({
    onSuccess: () => {
      toast.success("Compra deletada com sucesso!");
      setShowDeleteAlert(false);
      setLoteToDelete(null);
      refetchLotes();
    },
    onError: (error) => {
      toast.error(`Erro ao deletar compra: ${error.message}`);
    },
  });

  const createInsumoMutation = trpc.insumos.create.useMutation({
    onSuccess: () => {
      toast.success("Insumo criado com sucesso!");
      setShowCriarInsumoDialog(false);
      setNovoInsumoDados({ nome: "", unidade_base: "", nivel_minimo: "", tipo_produto: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar insumo: ${error.message}`);
    },
  });

  // Filtrar insumos para aba Registrar
  const filteredInsumos = useMemo(() => {
    return insumos.filter((insumo) => {
      const matchesSearch = insumo.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUnidade = !selectedUnidade || insumo.unidade_base === selectedUnidade;
      const matchesTipo = !selectedTipo || insumo.tipo_produto === selectedTipo;
      return matchesSearch && matchesUnidade && matchesTipo;
    });
  }, [insumos, searchTerm, selectedUnidade, selectedTipo]);

  const totalPages = Math.ceil(filteredInsumos.length / ITEMS_PER_PAGE);
  const paginatedInsumos = filteredInsumos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Filtrar insumos para aba Registros Passados
  const filteredInsumosRegistros = useMemo(() => {
    return insumos.filter((insumo) => {
      const matchesSearch = insumo.nome?.toLowerCase().includes(searchTermRegistros.toLowerCase());
      const matchesUnidade = !selectedUnidadeRegistros || insumo.unidade_base === selectedUnidadeRegistros;
      const temLotes = lotes.some((lote) => lote.insumo_id === insumo.id);
      return matchesSearch && matchesUnidade && temLotes;
    });
  }, [insumos, lotes, searchTermRegistros, selectedUnidadeRegistros]);

  const totalPagesRegistros = Math.ceil(filteredInsumosRegistros.length / ITEMS_PER_PAGE);
  const paginatedInsumosRegistros = filteredInsumosRegistros.slice(
    (currentPageRegistros - 1) * ITEMS_PER_PAGE,
    currentPageRegistros * ITEMS_PER_PAGE
  );

  // Handlers
  const handleSelectInsumo = (insumo: any) => {
    setSelectedInsumo(insumo);
    setShowFormDialog(true);
  };

  const handleSubmitCompra = () => {
    if (!formData.quantidade || parseFloat(formData.quantidade) <= 0) {
      toast.error("Quantidade deve ser maior que 0");
      return;
    }

    if (!formData.preco || parseFloat(formData.preco) <= 0) {
      toast.error("Preço deve ser maior que 0");
      return;
    }

    if (!formData.data_validade) {
      setShowNoValidadeAlert(true);
      return;
    }

    createLoteMutation.mutate({
      insumo_id: selectedInsumo.id,
      quantidade_inicial: parseFloat(formData.quantidade),
      quantidade_atual: parseFloat(formData.quantidade),
      data_de_validade: formData.data_validade || null,
      custo_total_lote: parseFloat(formData.preco),
    });
  };

  const handleConfirmNoValidade = () => {
    setShowNoValidadeAlert(false);
    createLoteMutation.mutate({
      insumo_id: selectedInsumo.id,
      quantidade_inicial: parseFloat(formData.quantidade),
      quantidade_atual: parseFloat(formData.quantidade),
      data_de_validade: undefined,
      custo_total_lote: parseFloat(formData.preco),
    });
  };

  const handleCreateInsumo = () => {
    if (!novoInsumoDados.nome.trim()) {
      toast.error("Nome do insumo é obrigatório");
      return;
    }

    if (!novoInsumoDados.unidade_base) {
      toast.error("Unidade de medida é obrigatória");
      return;
    }

    if (!novoInsumoDados.tipo_produto) {
      toast.error("Tipo de insumo é obrigatório");
      return;
    }

    createInsumoMutation.mutate({
      nome: novoInsumoDados.nome,
      unidade_base: novoInsumoDados.unidade_base,
      nivel_minimo: novoInsumoDados.nivel_minimo ? parseFloat(novoInsumoDados.nivel_minimo) : 0,
      tipo_produto: novoInsumoDados.tipo_produto,
    });
  };

  const handleViewRegistros = (insumo: any) => {
    setSelectedInsumoRegistros(insumo);
    setShowRegistrosModal(true);
  };

  const handleEditLote = (lote: any) => {
    setLoteToEdit(lote);
    setEditFormData({
      quantidade: lote.quantidade_atual.toString(),
      data_validade: lote.data_de_validade ? new Date(lote.data_de_validade).toISOString().split('T')[0] : "",
      preco: lote.custo_total_lote.toString(),
    });
    setShowEditLoteDialog(true);
  };

  const handleSubmitEditLote = () => {
    if (!editFormData.quantidade || parseFloat(editFormData.quantidade) <= 0) {
      toast.error("Quantidade deve ser maior que 0");
      return;
    }

    if (!editFormData.preco || parseFloat(editFormData.preco) <= 0) {
      toast.error("Preço deve ser maior que 0");
      return;
    }

    updateLoteMutation.mutate({
      id: loteToEdit.id,
      quantidade_atual: parseFloat(editFormData.quantidade),
      data_de_validade: editFormData.data_validade || null,
      custo_total_lote: parseFloat(editFormData.preco),
    });
  };

  const handleDeleteLote = (lote: any) => {
    setLoteToDelete(lote);
    setShowDeleteAlert(true);
  };

  const handleConfirmDeleteLote = () => {
    deleteLoteMutation.mutate({ id: loteToDelete.id });
  };

  const lotesDoInsumo = selectedInsumoRegistros
    ? lotes.filter((lote) => lote.insumo_id === selectedInsumoRegistros.id)
    : [];

  return (
    <Tabs defaultValue="registrar" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="registrar">Registrar Compra</TabsTrigger>
        <TabsTrigger value="registros">Registros Passados</TabsTrigger>
      </TabsList>

      {/* Aba 1: Registrar Compra */}
      <TabsContent value="registrar" className="space-y-6">
        {/* Controles */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedUnidade} onValueChange={(value) => {
              setSelectedUnidade(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por unidade" />
              </SelectTrigger>
              <SelectContent>
                {UNIDADES_MEDIDA.map((unidade) => (
                  <SelectItem key={unidade} value={unidade}>
                    {unidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTipo} onValueChange={(value) => {
              setSelectedTipo(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Láticinio">Láticinio</SelectItem>
                <SelectItem value="Perecível">Perecível</SelectItem>
                <SelectItem value="Não-Perecível">Não-Perecível</SelectItem>
                <SelectItem value="Congelado">Congelado</SelectItem>
                <SelectItem value="Seco">Seco</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedUnidade("");
                setSelectedTipo("");
                setCurrentPage(1);
              }}
              className="text-xs"
            >
              Limpar Filtros
            </Button>

            <Button
              onClick={() => setShowCriarInsumoDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Insumo
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nível Mínimo</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : paginatedInsumos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Nenhum insumo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInsumos.map((insumo: any) => (
                  <TableRow key={insumo.id}>
                    <TableCell className="font-medium">{insumo.nome}</TableCell>
                    <TableCell>{insumo.unidade_base}</TableCell>
                    <TableCell>{insumo.tipo_produto || '-'}</TableCell>
                    <TableCell>{insumo.nivel_minimo}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleSelectInsumo(insumo)}
                        className="flex items-center gap-2 ml-auto"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Registrar Compra
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Página {currentPage} de {totalPages} ({filteredInsumos.length} itens)
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
      </TabsContent>

      {/* Aba 2: Registros Passados */}
      <TabsContent value="registros" className="space-y-6">
        {/* Controles */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTermRegistros}
                  onChange={(e) => {
                    setSearchTermRegistros(e.target.value);
                    setCurrentPageRegistros(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedUnidadeRegistros} onValueChange={(value) => {
              setSelectedUnidadeRegistros(value);
              setCurrentPageRegistros(1);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por unidade" />
              </SelectTrigger>
              <SelectContent>
                {UNIDADES_MEDIDA.map((unidade) => (
                  <SelectItem key={unidade} value={unidade}>
                    {unidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSelectedUnidadeRegistros("");
                setCurrentPageRegistros(1);
              }}
              className="text-xs"
            >
              Limpar Filtro
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Total de Compras</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : paginatedInsumosRegistros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    Nenhum registro de compra encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInsumosRegistros.map((insumo: any) => {
                  const totalCompras = lotes.filter((lote) => lote.insumo_id === insumo.id).length;
                  return (
                    <TableRow key={insumo.id}>
                      <TableCell className="font-medium">{insumo.nome}</TableCell>
                      <TableCell>{insumo.unidade_base}</TableCell>
                      <TableCell>{totalCompras}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleViewRegistros(insumo)}
                          className="flex items-center gap-2 ml-auto"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Compras
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
        {totalPagesRegistros > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Página {currentPageRegistros} de {totalPagesRegistros} ({filteredInsumosRegistros.length} itens)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPageRegistros(Math.max(1, currentPageRegistros - 1))}
                disabled={currentPageRegistros === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPageRegistros(Math.min(totalPagesRegistros, currentPageRegistros + 1))}
                disabled={currentPageRegistros === totalPagesRegistros}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </TabsContent>

      {/* Dialog de Compra */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Compra</DialogTitle>
            <DialogDescription>
              Insumo: <strong>{selectedInsumo?.nome}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Quantidade ({selectedInsumo?.unidade_base})</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.quantidade}
                onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label>Data de Validade</Label>
              <Input
                type="date"
                value={formData.data_validade}
                onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Deixe em branco se não tiver data de validade</p>
            </div>

            <div>
              <Label>Preço da Compra (R$)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitCompra} disabled={createLoteMutation.isPending}>
              {createLoteMutation.isPending ? "Registrando..." : "Registrar Compra"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Registros do Insumo */}
      <Dialog open={showRegistrosModal} onOpenChange={setShowRegistrosModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compras de {selectedInsumoRegistros?.nome}</DialogTitle>
          </DialogHeader>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Data Validade</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Data Registro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotesDoInsumo.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Nenhuma compra registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  lotesDoInsumo.map((lote: any) => (
                    <TableRow key={lote.id}>
                      <TableCell>{lote.quantidade_atual}</TableCell>
                      <TableCell>
                        {lote.data_de_validade
                          ? new Date(lote.data_de_validade).toLocaleDateString('pt-BR')
                          : "Sem data"}
                      </TableCell>
                      <TableCell>R$ {lote.custo_total_lote.toFixed(2)}</TableCell>
                      <TableCell>
                        {new Date(lote.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditLote(lote)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLote(lote)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowRegistrosModal(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar Lote */}
      <Dialog open={showEditLoteDialog} onOpenChange={setShowEditLoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Compra</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                value={editFormData.quantidade}
                onChange={(e) => setEditFormData({ ...editFormData, quantidade: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label>Data de Validade</Label>
              <Input
                type="date"
                value={editFormData.data_validade}
                onChange={(e) => setEditFormData({ ...editFormData, data_validade: e.target.value })}
              />
            </div>

            <div>
              <Label>Preço da Compra (R$)</Label>
              <Input
                type="number"
                value={editFormData.preco}
                onChange={(e) => setEditFormData({ ...editFormData, preco: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowEditLoteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitEditLote} disabled={updateLoteMutation.isPending}>
              {updateLoteMutation.isPending ? "Atualizando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert de confirmação sem validade */}
      <AlertDialog open={showNoValidadeAlert} onOpenChange={setShowNoValidadeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Compra sem Data de Validade</AlertDialogTitle>
            <AlertDialogDescription>
              Você está registrando uma compra sem data de validade. Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNoValidade}>
              Confirmar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert de confirmação de delete */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta compra?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteLote}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Criar Insumo */}
      <Dialog open={showCriarInsumoDialog} onOpenChange={setShowCriarInsumoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Insumo</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo insumo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                placeholder="Nome do insumo"
                value={novoInsumoDados.nome}
                onChange={(e) => setNovoInsumoDados({ ...novoInsumoDados, nome: e.target.value })}
              />
            </div>

            <div>
              <Label>Unidade de Medida *</Label>
              <Select
                value={novoInsumoDados.unidade_base}
                onValueChange={(value) =>
                  setNovoInsumoDados({ ...novoInsumoDados, unidade_base: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_MEDIDA.map((unidade) => (
                    <SelectItem key={unidade} value={unidade}>
                      {unidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nível Mínimo</Label>
              <Input
                type="number"
                placeholder="0"
                value={novoInsumoDados.nivel_minimo}
                onChange={(e) => setNovoInsumoDados({ ...novoInsumoDados, nivel_minimo: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label>Tipo de Insumo *</Label>
              <Select
                value={novoInsumoDados.tipo_produto}
                onValueChange={(value) =>
                  setNovoInsumoDados({ ...novoInsumoDados, tipo_produto: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Láticinio">Láticinio</SelectItem>
                  <SelectItem value="Perecível">Perecível</SelectItem>
                  <SelectItem value="Não-Perecível">Não-Perecível</SelectItem>
                  <SelectItem value="Congelado">Congelado</SelectItem>
                  <SelectItem value="Seco">Seco</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCriarInsumoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateInsumo} disabled={createInsumoMutation.isPending}>
              {createInsumoMutation.isPending ? "Criando..." : "Criar Insumo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}

