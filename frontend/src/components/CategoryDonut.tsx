'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DEFAULT_COLOR } from '@/lib/colors';
import { formatMoney } from '@/lib/format';
import type { CategoryBreakdown } from '@/lib/types';

// Máximo de porciones individuales en la dona. Las demás se juntan en "Otras"
const MAX_SLICES = 5;

interface CategoryDonutProps {
  items: CategoryBreakdown[]; // Ya vienen ordenadas de mayor a menor desde Laravel
  total: string;
}

export function CategoryDonut({ items, total }: CategoryDonutProps) {
  // Las primeras MAX_SLICES categorías van como porciones propias
  const main = items.slice(0, MAX_SLICES);

  // El resto (si hay) se agrupa en una sola porción
  const rest = items.slice(MAX_SLICES);

  const data = main.map((item) => ({
    name: item.name,
    value: Number(item.total),
    color: item.color ?? DEFAULT_COLOR,
  }));

  if (rest.length > 0) {
    data.push({
      name: `Otras (${rest.length})`,
      // reduce suma los totales de todas las categorías restantes
      // (la suma es solo para dibujar la gráfica; los montos exactos los calculó Laravel)
      value: rest.reduce((sum, item) => sum + Number(item.total), 0),
      color: DEFAULT_COLOR, // Gris, para distinguirla de las categorías reales
    });
  }

  return (
    <div className="relative h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>

          <Tooltip formatter={(value) => formatMoney(Number(value))} />
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-gray-500">Total</span>
        <span className="text-lg font-bold text-gray-900">{formatMoney(total)}</span>
      </div>
    </div>
  );
}