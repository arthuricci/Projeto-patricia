import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ChevronDown, ChevronUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

type FilterType = "semana" | "mes" | "trimestre" | "semestre" | "ano" | "tudo";

export default function DesperdícioPage() {
  const [filterType, setFilterType] = useState<FilterType>("mes");
  const [expandedInsumo, setExpandedInsumo] = useState<string | null>(null);

  // Buscar todas as baixas
  const { data: baixas = [] } = trpc.baixasEstoque.list.useQuery({});
  const { data: insumos = [] } = trpc.insumos.list.useQuery();
  const { data: lotes = [] } = trpc.lotes.list.useQuery({});

  // Calcular datas para filtros
  const getDateRange = (type: FilterType) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (type) {
      case "semana":
        const weekStart = new Date(startOfDay);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return { start: weekStart, end: now };
      
      case "mes":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart, end: now };
      
      case "trimestre":
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        return { start: quarterStart, end: now };
      
      case "semestre":
        const semester = now.getMonth() < 6 ? 0 : 6;
        const semesterStart = new Date(now.getFullYear(), semester, 1);
        return { start: semesterStart, end: now };
      
      case "ano":
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return { start: yearStart, end: now };
      
      case "tudo":
        return { start: new Date(2000, 0, 1), end: now };
    }
  };

  // Filtrar baixas por período
  const baixasFiltradas = useMemo(() => {
    const { start, end } = getDateRange(filterType);
    
    return baixas.filter((baixa) => {
      const dataBaixa = baixa.data_baixa ? new Date(baixa.data_baixa) : new Date(baixa.created_at || 0);
      return dataBaixa >= start && dataBaixa <= end;
    });
  }, [baixas, filterType]);

  // Agrupar por insumo
  const insumosComBaixas = useMemo(() => {
    const grouped: Record<string, any> = {};

    baixasFiltradas.forEach((baixa) => {
      const lote = lotes.find((l) => l.id === baixa.lote_id);
      if (!lote) return;

      const insumo = insumos.find((i) => i.id === lote.insumo_id);
      if (!insumo) return;

      if (!grouped[insumo.id]) {
        grouped[insumo.id] = {
          insumo,
          totalBaixado: 0,
          baixas: [],
        };
      }

      grouped[insumo.id].totalBaixado += baixa.quantidade_baixada || 0;
      grouped[insumo.id].baixas.push({
        ...baixa,
        lote,
        insumo,
      });
    });

    return Object.values(grouped).sort(
      (a, b) => b.totalBaixado - a.totalBaixado
    );
  }, [baixasFiltradas, lotes, insumos]);

  const filterLabels: Record<FilterType, string> = {
    semana: "Última Semana",
    mes: "Último Mês",
    trimestre: "Último Trimestre",
    semestre: "Último Semestre",
    ano: "Último Ano",
    tudo: "Todo Tempo",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingDown className="h-8 w-8 text-red-500" />
            Análise de Desperdício
          </h1>
          <p className="text-gray-600 mt-1">
            Visualize e analise as perdas de insumos no estoque
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <p className="text-sm font-semibold mb-3">Período</p>
        <div className="flex flex-wrap gap-2">
          {(["semana", "mes", "trimestre", "semestre", "ano", "tudo"] as FilterType[]).map((filter) => (
            <Button
              key={filter}
              variant={filterType === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(filter)}
            >
              {filterLabels[filter]}
            </Button>
          ))}
        </div>
      </div>

      {/* Cards de Insumos */}
      <div className="space-y-4">
        {insumosComBaixas.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Nenhuma baixa registrada neste período
            </CardContent>
          </Card>
        ) : (
          insumosComBaixas.map((item) => (
            <Card key={item.insumo.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader
                onClick={() =>
                  setExpandedInsumo(
                    expandedInsumo === item.insumo.id ? null : item.insumo.id
                  )
                }
                className="pb-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.insumo.nome}</CardTitle>
                    <CardDescription>
                      Total desperdiçado: <span className="font-semibold text-red-600">
                        {item.totalBaixado} {item.insumo.unidade_base}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="text-gray-400">
                    {expandedInsumo === item.insumo.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Detalhes expandidos */}
              {expandedInsumo === item.insumo.id && (
                <CardContent className="pt-0">
                  <div className="space-y-3 border-t pt-4">
                    {item.baixas.map((baixa: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {baixa.quantidade_baixada} {item.insumo.unidade_base}
                          </p>
                          <p className="text-gray-600 text-xs">
                            {baixa.data_baixa
                              ? new Date(baixa.data_baixa).toLocaleDateString("pt-BR")
                              : new Date(baixa.created_at || 0).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            {baixa.motivo || "sem motivo"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
