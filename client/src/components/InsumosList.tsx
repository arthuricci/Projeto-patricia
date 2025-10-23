import { trpc } from '@/lib/trpc';

export default function InsumosList() {
  const { data: insumos, isLoading, error } = trpc.insumos.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Carregando insumos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-600">Erro: {error.message}</p>
      </div>
    );
  }

  if (!insumos || insumos.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Nenhum insumo encontrado.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Lista de Insumos</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nível Mínimo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {insumos.map((insumo) => (
              <tr key={insumo.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {insumo.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {insumo.unidade_base}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {insumo.nivel_minimo}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

