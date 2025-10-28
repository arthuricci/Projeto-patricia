import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Users, ShoppingBag, ChefHat, Warehouse } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Entremet OS</h1>
          <p className="text-gray-600">Sistema de Gestão de Confeitaria</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card Estoque */}
          <Link href="/estoque">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Warehouse className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Estoque</CardTitle>
                    <CardDescription>Gerenciar estoque</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Registre insumos, controle estoque, registre compras e gerencie lista de compras.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Card Clientes */}
          <Link href="/clientes">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Clientes</CardTitle>
                    <CardDescription>Gerenciar clientes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Cadastre clientes com informações de contato, Instagram e observações.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Card Produtos */}
          <Link href="/produtos">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Produtos</CardTitle>
                    <CardDescription>Gerenciar produtos de venda</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Cadastre produtos, preços, descrições e controle o status de ativo/inativo.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Card Fichas Técnicas */}
          <Link href="/fichas-tecnicas">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ChefHat className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Fichas Técnicas</CardTitle>
                    <CardDescription>Gerenciar receitas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Cadastre receitas com ingredientes, modo de preparo e rendimento.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

