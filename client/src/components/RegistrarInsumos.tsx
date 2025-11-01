import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

const UNIDADES_MEDIDA = ["Kg", "G", "Ml", "L", "unidade", "lata", "caixa"];
const TIPOS_INSUMO = ["Láticinio", "Perecível", "Não-Perecível", "Congelado", "Seco"];
const ITEMS_PER_PAGE = 10;

export default function RegistrarInsumos() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnidade, setSelectedUnidade] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [insumoToDelete, setInsumoToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    unidade_base: "",
    nivel_minimo: 0,
    tipo_produto: "",
  });

  // Queries
  const { data: insumos = [], isLoading, refetch } = trpc.insumos.list.useQuery();
  const { data: insumoUsage } = trpc.insumos.checkUsage.useQuery(
    { id: insumoToDelete || "" },
    { enabled: !!insumoToDelete }
  );

  // Mutations
  const createMutation = trpc.insumos.create.useMutation({
    onSuccess: () => {
      toast.success("Insumo criado com sucesso!");
      setIsOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar insumo: ${error.message}`);
    },
  });

  const updateMutation = trpc.insumos.update.useMutation({
    onSuccess: () => {
      toast.success("Insumo atualizado com sucesso!");
      setIsOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar insumo: ${error.message}`);
    },
  });

  const deleteMutation = trpc.insumos.delete.useMutation({
    onSuccess: () => {
      toast.success("Insumo deletado com sucesso!");
      setDeleteAlertOpen(false);
      setInsumoToDelete(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao deletar insumo: ${error.message}`);
    },
  });

  // Filtrar e paginar
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

  const resetForm = () => {
    setFormData({ nome: "", unidade_base: "", nivel_minimo: 0, tipo_produto: "" });
    setEditingId(null);
  };

  const handleEdit = (insumo: any) => {
    setFormData({
      nome: insumo.nome || "",
      unidade_base: insumo.unidade_base || "",
      nivel_minimo: insumo.nivel_minimo || 0,
      tipo_produto: insumo.tipo_produto || "",
    });
    setEditingId(insumo.id);
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nome || !formData.unidade_base || !formData.tipo_produto) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        nome: formData.nome,
        unidade_base: formData.unidade_base,
        nivel_minimo: formData.nivel_minimo,
        tipo_produto: formData.tipo_produto,
      });
    } else {
      createMutation.mutate({
        nome: formData.nome,
        unidade_base: formData.unidade_base,
        nivel_minimo: formData.nivel_minimo,
        tipo_produto: formData.tipo_produto,
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setInsumoToDelete(id);
    setDeleteAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (insumoToDelete) {
      deleteMutation.mutate({ id: insumoToDelete });
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 flex-wrap">
          {/* Busca */}
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

          {/* Filtro por unidade */}
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

          {/* Filtro por tipo */}
          <Select value={selectedTipo} onValueChange={(value) => {
            setSelectedTipo(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_INSUMO.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSelectedUnidade("");
              setSelectedTipo("");
              setCurrentPage(1);
            }}
            className="text-xs"
          >
            Limpar Filtros
          </Button>

          {/* Botão adicionar */}
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Insumo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Insumo" : "Novo Insumo"}
                </DialogTitle>
                <DialogDescription>
                  {editingId
                    ? "Atualize as informações do insumo"
                    : "Preencha os dados do novo insumo"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Ex: Leite Condensado"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Unidade de Medida *</label>
                  <Select
                    value={formData.unidade_base}
                    onValueChange={(value) =>
                      setFormData({ ...formData, unidade_base: value })
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
                  <label className="text-sm font-medium">Tipo de Insumo *</label>
                  <Select
                    value={formData.tipo_produto}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipo_produto: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_INSUMO.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Nível Mínimo</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.nivel_minimo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nivel_minimo: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Ex: 100"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingId ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Nível Mínimo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
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
              paginatedInsumos.map((insumo) => (
                <TableRow key={insumo.id}>
                  <TableCell className="font-medium">{insumo.nome}</TableCell>
                  <TableCell>{insumo.tipo_produto || "-"}</TableCell>
                  <TableCell>{insumo.unidade_base}</TableCell>
                  <TableCell>{insumo.nivel_minimo}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(insumo)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(insumo.id)}
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

      {/* Alert Dialog */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Insumo</AlertDialogTitle>
            <AlertDialogDescription>
              {insumoUsage?.isUsed
                ? "Este insumo está sendo usado e não pode ser deletado."
                : "Tem certeza que deseja deletar este insumo? Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {!insumoUsage?.isUsed && (
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Deletar
              </AlertDialogAction>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

