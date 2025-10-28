import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, Eye, ShoppingCart, TrendingDown, ListChecks } from "lucide-react";
import { useLocation } from "wouter";

export default function Estoque() {
  const [, setLocation] = useLocation();

  const tabs = [
    {
      id: "registrar-insumos",
      label: "Registrar Insumos",
      description: "Cadastre novos insumos",
      icon: <Package className="h-5 w-5" />,
      path: "/estoque/registrar-insumos",
    },
    {
      id: "ver-estoque",
      label: "Ver Estoque",
      description: "Visualize o estoque atual",
      icon: <Eye className="h-5 w-5" />,
      path: "/estoque/ver-estoque",
    },
    {
      id: "registrar-compras",
      label: "Registrar Compras",
      description: "Registre novas compras",
      icon: <ShoppingCart className="h-5 w-5" />,
      path: "/estoque/registrar-compras",
    },
    {
      id: "dar-baixa",
      label: "Dar Baixa",
      description: "Remova itens do estoque",
      icon: <TrendingDown className="h-5 w-5" />,
      path: "/estoque/dar-baixa",
    },
    {
      id: "lista-compras",
      label: "Lista de Compras",
      description: "Gerencie lista de compras",
      icon: <ListChecks className="h-5 w-5" />,
      path: "/estoque/lista-compras",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header com botão voltar */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Estoque</h1>
            <p className="text-gray-600">Gerencie seu estoque de insumos</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Menu de abas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {tabs.map((tab) => (
            <Card
              key={tab.id}
              className="cursor-pointer transition-all hover:shadow-lg"
              onClick={() => setLocation(tab.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {tab.icon}
                  </div>
                </div>
                <CardTitle className="text-base">{tab.label}</CardTitle>
                <CardDescription className="text-xs">{tab.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

