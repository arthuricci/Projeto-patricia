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
const ITEMS_PER_PAGE = 10;

export default function RegistrarInsumos() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnidade, setSelectedUnidade] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [insumoToDelete, setInsumoToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    unidade_base: "",
    nivel_minimo: 0,
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
      return matchesSearch && matchesUnidade;
    });
  }, [insumos, searchTerm, selectedUnidade]);

  const totalPages = Math.ceil(filteredInsumos.length / ITEMS_PER_PAGE);
  const paginatedInsumos = filteredInsumos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resetForm = () => {
    setFormData({ nome: "", unidade_base: "", nivel_minimo: 0 });
    setEditingId(null);
  };

  const handleEdit = (insumo: any) => {
    setFormData({
      nome: insumo.nome || "",
      unidade_base: insumo.unidade_base || "",
      nivel_minimo: insumo.nivel_minimo || 0,
    });
    setEditingId(insumo.id);
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nome || !formData.unidade_base) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        nome: formData.nome,
        unidade_base: formData.unidade_base,
        nivel_minimo: formData.nivel_minimo,
      });
    } else {
      createMutation.mutate({
        nome: formData.nome,
        unidade_base: formData.unidade_base,
        nivel_minimo: formData.nivel_minimo,
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
          <Button
            variant="outline"
            onClick={() => {
              setSelectedUnidade("");
              setCurrentPage(1);
            }}
            className="text-xs"
          >
            Limpar Filtro
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
              <TableHead>Unidade</TableHead>
              <TableHead>Nível Mínimo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : paginatedInsumos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  Nenhum insumo encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedInsumos.map((insumo) => (
                <TableRow key={insumo.id}>
                  <TableCell className="font-medium">{insumo.nome}</TableCell>
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

      {/* Alert de confirmação de delete */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {insumoUsage && insumoUsage.isUsed ? (
                <div>
                  <p className="mb-2">
                    Este insumo está sendo usado em {insumoUsage.recipes.length} receita(s):
                  </p>
                  <ul className="list-disc list-inside text-sm">
                    {insumoUsage.recipes.map((recipe: any) => (
                      <li key={recipe.nome}>{recipe.nome}</li>
                    ))}
                  </ul>
                  <p className="mt-2">Deseja continuar com a exclusão?</p>
                </div>
              ) : (
                "Tem certeza que deseja excluir este insumo?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

