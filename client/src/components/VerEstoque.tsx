import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Edit2, Trash2, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

const UNIDADES_MEDIDA = ["Kg", "G", "Ml", "L", "unidade", "lata", "caixa"];
const ITEMS_PER_PAGE = 10;

type SortConfig = {
  key: "nome" | "nivel_minimo" | "quantidade" | null;
  direction: "asc" | "desc";
};

export default function VerEstoque() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnidade, setSelectedUnidade] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "asc" });
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [insumoToDelete, setInsumoToDelete] = useState<string | null>(null);

  // Queries
  const { data: insumos = [], isLoading, refetch } = trpc.insumos.list.useQuery();
  const { data: lotes = [] } = trpc.lotes.list.useQuery({});

  // Mutations
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

  // Calcular quantidade em estoque por insumo
  const insumosComEstoque = useMemo(() => {
    return insumos.map((insumo) => {
      const quantidadeTotal = lotes
        .filter((lote: any) => lote.insumo_id === insumo.id)
        .reduce((sum: number, lote: any) => sum + (lote.quantidade_atual || 0), 0);

      const status = quantidadeTotal < insumo.nivel_minimo ? "critico" : quantidadeTotal === insumo.nivel_minimo ? "minimo" : "ok";

      return {
        ...insumo,
        quantidade_estoque: quantidadeTotal,
        status,
      };
    });
  }, [insumos, lotes]);

  // Filtrar
  const filteredInsumos = useMemo(() => {
    return insumosComEstoque.filter((insumo) => {
      const matchesSearch = insumo.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUnidade = !selectedUnidade || insumo.unidade_base === selectedUnidade;
      return matchesSearch && matchesUnidade;
    });
  }, [insumosComEstoque, searchTerm, selectedUnidade]);

  // Ordenar
  const sortedInsumos = useMemo(() => {
    const sorted = [...filteredInsumos];
    if (sortConfig.key) {
      sorted.sort((a: any, b: any) => {
        const aValue = a[sortConfig.key as string];
        const bValue = b[sortConfig.key as string];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredInsumos, sortConfig]);

  // Paginar
  const totalPages = Math.ceil(sortedInsumos.length / ITEMS_PER_PAGE);
  const paginatedInsumos = sortedInsumos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (key: "nome" | "nivel_minimo" | "quantidade") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critico":
        return "bg-red-100 text-red-800";
      case "minimo":
        return "bg-yellow-100 text-yellow-800";
      case "ok":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "critico":
        return "Crítico";
      case "minimo":
        return "Mínimo";
      case "ok":
        return "OK";
      default:
        return "Desconhecido";
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
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("nome")}>
                <div className="flex items-center gap-2">
                  Nome
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("nivel_minimo")}>
                <div className="flex items-center gap-2">
                  Nível Mínimo
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("quantidade")}>
                <div className="flex items-center gap-2">
                  Quantidade
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : paginatedInsumos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Nenhum insumo encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedInsumos.map((insumo: any) => (
                <TableRow key={insumo.id}>
                  <TableCell className="font-medium">{insumo.nome}</TableCell>
                  <TableCell>{insumo.nivel_minimo}</TableCell>
                  <TableCell>{insumo.unidade_base}</TableCell>
                  <TableCell>{insumo.tipo_produto || '-'}</TableCell>
                  <TableCell>{insumo.quantidade_estoque}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(insumo.status)}`}>
                      {getStatusLabel(insumo.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {}}
                      disabled
                      title="Editar (em desenvolvimento)"
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
            Página {currentPage} de {totalPages} ({sortedInsumos.length} itens)
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
              Tem certeza que deseja excluir este insumo?
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

