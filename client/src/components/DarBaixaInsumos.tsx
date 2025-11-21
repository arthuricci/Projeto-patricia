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
import { Search, TrendingDown } from "lucide-react";
import { toast } from "sonner";

const UNIDADES_MEDIDA = ["Kg", "G", "Ml", "L", "unidade", "lata", "caixa"];
const ITEMS_PER_PAGE = 10;

export default function DarBaixaInsumos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnidade, setSelectedUnidade] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInsumo, setSelectedInsumo] = useState<any>(null);
  const [showLotesModal, setShowLotesModal] = useState(false);
  const [selectedLote, setSelectedLote] = useState<any>(null);
  const [showBaixaDialog, setShowBaixaDialog] = useState(false);
  const [quantidadeBaixa, setQuantidadeBaixa] = useState("");
  const [dataBaixa, setDataBaixa] = useState(new Date().toISOString().split('T')[0]);
  const [motivoBaixa, setMotivoBaixa] = useState("desperdicio");
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);

  const MOTIVOS_PERDA = ["desperdicio", "vencimento", "dano", "roubo", "outro"];

  // Queries
  const { data: insumos = [], isLoading, refetch } = trpc.insumos.list.useQuery();
  const { data: lotes = [], refetch: refetchLotes } = trpc.lotes.list.useQuery({});
  const { data: estoqueAtual = [], refetch: refetchEstoque } = trpc.insumos.getEstoqueAtual.useQuery();

  // Mutations
  const createBaixaMutation = trpc.baixasEstoque.create.useMutation({
    onSuccess: () => {
      toast.success("Baixa registrada com sucesso!");
      setShowConfirmAlert(false);
      setShowBaixaDialog(false);
      setQuantidadeBaixa("");
      setSelectedLote(null);
      refetchLotes();
      refetchEstoque();
    },
    onError: (error) => {
      toast.error(`Erro ao registrar baixa: ${error.message}`);
    },
  });

  const updateLoteMutation = trpc.lotes.update.useMutation({
    onSuccess: () => {
      // Já feito na mutation anterior
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar lote: ${error.message}`);
    },
  });

  // Calcular estoque total por insumo
  const insumosComEstoque = useMemo(() => {
    return insumos.map((insumo) => {
      const estoqueInfo = estoqueAtual.find((e: any) => e.insumo_id === insumo.id);
      const estoqueTotal = estoqueInfo?.estoque_atual || 0;
      return {
        ...insumo,
        estoqueTotal,
        temEstoque: estoqueTotal > 0,
      };
    }).filter((insumo) => insumo.temEstoque);
  }, [insumos, estoqueAtual]);

  // Filtrar
  const filteredInsumos = useMemo(() => {
    return insumosComEstoque.filter((insumo) => {
      const matchesSearch = insumo.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUnidade = !selectedUnidade || insumo.unidade_base === selectedUnidade;
      return matchesSearch && matchesUnidade;
    });
  }, [insumosComEstoque, searchTerm, selectedUnidade]);

  // Paginar
  const totalPages = Math.ceil(filteredInsumos.length / ITEMS_PER_PAGE);
  const paginatedInsumos = filteredInsumos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSelectInsumo = (insumo: any) => {
    setSelectedInsumo(insumo);
    setShowLotesModal(true);
  };

  const handleSelectLote = (lote: any) => {
    setSelectedLote(lote);
    setShowBaixaDialog(true);
  };

  const handleSubmitBaixa = () => {
    if (!quantidadeBaixa || parseFloat(quantidadeBaixa) <= 0) {
      toast.error("Quantidade deve ser maior que 0");
      return;
    }

    if (!dataBaixa) {
      toast.error("Data da baixa é obrigatória");
      return;
    }

    const quantidade = parseFloat(quantidadeBaixa);
    if (quantidade > (selectedLote.quantidade_inicial || 0)) {
      toast.error(`Quantidade nao pode ser maior que ${selectedLote.quantidade_inicial}`);
      return;
    }

    setShowConfirmAlert(true);
  };

  const handleConfirmBaixa = () => {
    const quantidade = parseFloat(quantidadeBaixa);

    // Criar registro de baixa (lote original permanece intacto)
    createBaixaMutation.mutate({
      lote_id: selectedLote.id,
      quantidade_baixada: quantidade,
      motivo: motivoBaixa,
      data_baixa: dataBaixa,
    });
  };

  const lotesDoInsumo = selectedInsumo
    ? lotes.filter((lote) => lote.insumo_id === selectedInsumo.id && (lote.quantidade_atual || 0) > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 flex-wrap items-center">
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
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Estoque Atual</TableHead>
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
            ) : paginatedInsumos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  Nenhum insumo com estoque encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedInsumos.map((insumo: any) => (
                <TableRow key={insumo.id}>
                  <TableCell className="font-medium">{insumo.nome}</TableCell>
                  <TableCell>{insumo.unidade_base}</TableCell>
                  <TableCell>{insumo.estoqueTotal}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleSelectInsumo(insumo)}
                      className="flex items-center gap-2 ml-auto"
                    >
                      <TrendingDown className="h-4 w-4" />
                      Dar Baixa
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

      {/* Modal de Lotes */}
      <Dialog open={showLotesModal} onOpenChange={setShowLotesModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lotes de {selectedInsumo?.nome}</DialogTitle>
            <DialogDescription>
              Selecione um lote para dar baixa
            </DialogDescription>
          </DialogHeader>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Data Validade</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotesDoInsumo.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      Nenhum lote com estoque
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
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSelectLote(lote)}
                          className="flex items-center gap-2 ml-auto"
                        >
                          <TrendingDown className="h-4 w-4" />
                          Baixar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowLotesModal(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Baixa */}
      <Dialog open={showBaixaDialog} onOpenChange={setShowBaixaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar Baixa em Insumo</DialogTitle>
            <DialogDescription>
              Insumo: <strong>{selectedInsumo?.nome}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Quantidade disponível no lote</p>
              <p className="text-2xl font-bold">{selectedLote?.quantidade_atual} {selectedInsumo?.unidade_base}</p>
            </div>

            <div>
              <Label>Quantidade a Baixar ({selectedInsumo?.unidade_base})</Label>
              <Input
                type="number"
                placeholder="0"
                value={quantidadeBaixa}
                onChange={(e) => setQuantidadeBaixa(e.target.value)}
                min="0"
                max={selectedLote?.quantidade_atual}
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo: {selectedLote?.quantidade_atual}
              </p>
            </div>

            <div>
              <Label>Data da Baixa *</Label>
              <Input
                type="date"
                value={dataBaixa}
                onChange={(e) => setDataBaixa(e.target.value)}
              />
            </div>

            <div>
              <Label>Motivo da Perda *</Label>
              <Select value={motivoBaixa} onValueChange={setMotivoBaixa}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desperdicio">Desperdício</SelectItem>
                  <SelectItem value="vencimento">Vencimento</SelectItem>
                  <SelectItem value="dano">Dano</SelectItem>
                  <SelectItem value="roubo">Roubo</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowBaixaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitBaixa} disabled={createBaixaMutation.isPending || updateLoteMutation.isPending}>
              Confirmar Baixa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert de confirmação */}
      <AlertDialog open={showConfirmAlert} onOpenChange={setShowConfirmAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Baixa</AlertDialogTitle>
            <AlertDialogDescription>
              Você está registrando uma baixa de <strong>{quantidadeBaixa} {selectedInsumo?.unidade_base}</strong> de <strong>{selectedInsumo?.nome}</strong>.
              <br />
              <br />
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBaixa}>
              Confirmar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

