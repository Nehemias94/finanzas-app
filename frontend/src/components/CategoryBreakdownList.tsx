import { CategoryDonut } from '@/components/CategoryDonut';
import { DEFAULT_COLOR } from '@/lib/colors';
import { formatMoney } from '@/lib/format';
import type { CategoryBreakdown } from '@/lib/types';

interface CategoryBreakdownListProps {
  title: string;
  items: CategoryBreakdown[];
  total: string;        // Total del mes, para el centro de la gráfica de dona
  emptyMessage: string; // Texto cuando no hay datos
}

// Lo usaremos DOS veces en el dashboard: para egresos y para ingresos
// Por eso recibe el título y los datos como props: el mismo componente sirve para ambos
// IMPORTANTE: "total" debe estar en esta lista para poder usarlo abajo
export function CategoryBreakdownList({ title, items, total, emptyMessage }: CategoryBreakdownListProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 font-semibold text-gray-900">{title}</h2>

      {/* Si la lista está vacía, mostramos el mensaje; si no, la dona y las categorías */}
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      ) : (
        // Fragment <>...</>: agrupa la dona y la lista sin agregar una etiqueta extra
        <>
          {/* La gráfica de dona arriba, con el total en el centro */}
          <CategoryDonut items={items} total={total} />

          {/* La lista con los detalles abajo. mt-4 la separa de la dona */}
          <ul className="mt-4 space-y-4">
            {items.map((item) => {
              const color = item.color ?? DEFAULT_COLOR;

              return (
                <li key={item.id}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {/* Puntito con el color de la categoría */}
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-medium text-gray-800">{item.name}</span>
                      <span className="text-gray-400">
                        ({item.count} {item.count === 1 ? 'movimiento' : 'movimientos'})
                      </span>
                    </div>

                    <span className="font-semibold text-gray-900">{formatMoney(item.total)}</span>
                  </div>

                  {/* Barra de porcentaje: el ancho interior es el porcentaje de la categoría */}
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.percentage}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs text-gray-500">{item.percentage}%</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}