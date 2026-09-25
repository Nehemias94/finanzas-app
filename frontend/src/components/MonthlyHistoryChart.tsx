'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiFetch, ApiError } from '@/lib/api';
import { formatMoney, formatMonthLabel, formatMonthShort } from '@/lib/format';
import type { ApiResource, MonthHistory } from '@/lib/types';

// Cuántos meses mostramos
const MONTHS = 6;

interface MonthlyHistoryChartProps {
  month: string;     // Último mes del periodo (el que se ve en el dashboard)
  reloadKey: number; // Cuando cambia, se vuelve a cargar (ej: al registrar un movimiento)
}

// Este componente carga SUS PROPIOS datos, a diferencia de la dona que los recibe por props
// Así el dashboard no tiene que saber nada del historial: solo le dice qué mes mostrar
export function MonthlyHistoryChart({ month, reloadKey }: MonthlyHistoryChartProps) {
  const [result, setResult] = useState<{ key: string; items: MonthHistory[] } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);

  // Incluimos reloadKey en la llave: al registrar un movimiento, cuenta como consulta nueva
  const queryKey = `${month}|${reloadKey}`;

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiResource<MonthHistory[]>>(`/summary/history?month=${month}&months=${MONTHS}`)
      .then((response) => {
        if (!cancelled) setResult({ key: queryKey, items: response.data });
      })
      .catch((err) => {
        if (!cancelled) {
          setError({ key: queryKey, message: err instanceof ApiError ? err.message : 'No se pudo cargar el historial.' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [queryKey, month]);

  const currentError = error?.key === queryKey ? error : null;
  const loading = result?.key !== queryKey && !currentError;
  const items = result?.items ?? [];

  // Datos en el formato que espera Recharts: una fila por mes, montos como números
  // Los nombres de los campos ("Ingresos", "Egresos"...) aparecen en la leyenda y el tooltip
  const data = items.map((item) => ({
    label: formatMonthShort(item.month),
    Ingresos: Number(item.income),
    Egresos: Number(item.expense),
    'Saldo final': Number(item.closing_balance),
  }));

  // ----- Los meses destacados -----
  // reduce recorre la lista y se queda con el elemento que cumpla la condición
  // Solo consideramos meses con movimientos, para no "destacar" un mes en cero
  const withExpense = items.filter((item) => Number(item.expense) > 0);
  const withIncome = items.filter((item) => Number(item.income) > 0);

  const topExpense = withExpense.length
    ? withExpense.reduce((max, item) => (Number(item.expense) > Number(max.expense) ? item : max))
    : null;

  const topIncome = withIncome.length
    ? withIncome.reduce((max, item) => (Number(item.income) > Number(max.income) ? item : max))
    : null;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 font-semibold text-gray-900">Tus últimos {MONTHS} meses</h2>

      {currentError && <p className="text-sm text-red-600">{currentError.message}</p>}
      {loading && !result && <p className="text-sm text-gray-400">Cargando historial...</p>}

      {result && !currentError && (
        <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {/* ComposedChart permite mezclar barras y líneas en la misma gráfica */}
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                {/* Líneas guía horizontales, punteadas */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />

                {/* Eje X: los meses */}
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />

                {/* Eje Y: los montos, con el símbolo $ */}
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} width={64} />

                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Legend />

                {/* Dos barras por mes: ingresos en verde y egresos en rojo */}
                <Bar dataKey="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Egresos" fill="#EF4444" radius={[4, 4, 0, 0]} />

                {/* La línea del saldo acumulado: muestra si tus ahorros crecen o bajan */}
                <Line type="monotone" dataKey="Saldo final" stroke="#374151" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Meses destacados */}
          {(topExpense || topIncome) && (
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {topIncome && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                  Mes con más ingresos: <strong>{formatMonthLabel(topIncome.month)}</strong> (
                  {formatMoney(topIncome.income)})
                </p>
              )}
              {topExpense && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-red-800">
                  Mes con más gastos: <strong>{formatMonthLabel(topExpense.month)}</strong> (
                  {formatMoney(topExpense.expense)})
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}