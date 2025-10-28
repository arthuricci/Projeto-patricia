import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import RegistrarInsumos from "@/components/RegistrarInsumos";

export default function RegistrarInsumosPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header com botão voltar */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Registrar Insumos</h1>
            <p className="text-gray-600">Cadastre e gerencie seus insumos</p>
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

        {/* Conteúdo */}
        <div className="bg-white rounded-lg shadow p-6">
          <RegistrarInsumos />
        </div>
      </div>
    </div>
  );
}

