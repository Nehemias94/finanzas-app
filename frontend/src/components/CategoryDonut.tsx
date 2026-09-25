'use client'; // Recharts necesita el navegador para medir y dibujar

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DEFAULT_COLOR } from '@/lib/colors';
import { formatMoney } from '@/lib/format';
import type { CategoryBreakdown } from '@/lib/types';

interface CategoryDonutProps {
  items: CategoryBreakdown[];
  total: string; // Se muestra en el centro de la dona
}

export function CategoryDonut({ items, total }: CategoryDonutProps) {
  // Recharts trabaja con números, así que convertimos los montos (vienen como texto)
  const data = items.map((item) => ({
    name: item.name,
    value: Number(item.total),
    color: item.color ?? DEFAULT_COLOR,
  }));

  return (
    // relative: para poder poner el total encima, en el centro de la dona
    <div className="relative h-56">
      {/* ResponsiveContainer hace que la gráfica ocupe todo el espacio de su contenedor
          y se ajuste si cambia el tamaño de la pantalla */}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"      // Qué campo define el tamaño de cada porción
            nameKey="name"       // Qué campo es el nombre (se ve en el tooltip)
            innerRadius="62%"    // El hueco del centro: esto convierte el pastel en dona
            outerRadius="90%"
            paddingAngle={2}     // Pequeña separación entre porciones
            stroke="none"
          >
            {/* Cell define el color de cada porción: usamos el color de cada categoría */}
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>

          {/* Tooltip: el cuadrito que aparece al pasar el mouse sobre una porción */}
          <Tooltip formatter={(value) => formatMoney(Number(value))} />
        </PieChart>
      </ResponsiveContainer>

      {/* Total en el centro. pointer-events-none: deja pasar el mouse a la gráfica de abajo */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-gray-500">Total</span>
        <span className="text-lg font-bold text-gray-900">{formatMoney(total)}</span>
      </div>
    </div>
  );
}