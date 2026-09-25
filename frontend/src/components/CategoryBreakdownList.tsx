// Ahora necesita 'use client' porque usa estado (useState) para desplegar la lista
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CategoryDonut } from '@/components/CategoryDonut';
import { DEFAULT_COLOR } from '@/lib/colors';
import { formatMoney } from '@/lib/format';
import type { CategoryBreakdown } from '@/lib/types';

// Cuántas categorías se muestran antes de presionar "Ver todas"
const VISIBLE_LIMIT = 5;

interface CategoryBreakdownListProps {
  title: string;
  items: CategoryBreakdown[];
  total: string;        // Total del mes, para el centro de la gráfica de dona
  month: string;        // Mes que se está viendo, para armar el enlace a Movimientos
  emptyMessage: string; // Texto cuando no hay datos
}

export function CategoryBreakdownList({ title, items, total, month, emptyMessage }: CategoryBreakdownListProps) {
  // ¿La lista está desplegada completa?
  const [expanded, setExpanded] = useState(false);

  // Si está desplegada, todas; si no, solo las primeras 5 (las más grandes)
  const visibleItems = expanded ? items : items.slice(0, VISIBLE_LIMIT);

  // ¿Hay categorías ocultas? Solo entonces mostramos el botón
  const hasMore = items.length > VISIBLE_LIMIT;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 font-semibold text-gray-900">{title}</h2>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      ) : (
        <>
          <CategoryDonut items={items} total={total} />

          <ul className="mt-4 space-y-2">
            {visibleItems.map((item) => {
              const color = item.color ?? DEFAULT_COLOR;

              return (
                <li key={item.id}>
                  <Link
                    href={`/transactions?month=${month}&category_id=${item.id}`}
                    title={`Ver los movimientos de ${item.name}`}
                    className="-mx-2 block rounded-lg px-2 py-1.5 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <span className="text-gray-400">
                          ({item.count} {item.count === 1 ? 'movimiento' : 'movimientos'})
                        </span>
                      </div>

                      <span className="font-semibold text-gray-900">{formatMoney(item.total)}</span>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${item.percentage}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs text-gray-500">{item.percentage}%</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Botón para desplegar u ocultar el resto de las categorías */}
          {hasMore && (
            <button
              onClick={() => setExpanded((current) => !current)} // Invierte el valor: true <-> false
              className="mt-3 w-full rounded-lg bg-gray-50 py-2 text-sm font-medium text-emerald-700 hover:bg-gray-100"
            >
              {expanded ? 'Ver menos' : `Ver las ${items.length} categorías`}
            </button>
          )}
        </>
      )}
    </div>
  );
}