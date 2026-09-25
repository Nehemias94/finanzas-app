'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';
import { currentMonth } from '@/lib/format';
import { MonthSelector } from '@/components/MonthSelector';
import { SummaryCards } from '@/components/SummaryCards';
import { CategoryBreakdownList } from '@/components/CategoryBreakdownList';
import type { Summary } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();

  // Mes que se está viendo. Empieza en el mes actual
  // Pasamos la función (sin paréntesis) para que solo se ejecute al inicio
  const [month, setMonth] = useState(currentMonth);

  // Último resumen recibido de Laravel
  const [summary, setSummary] = useState<Summary | null>(null);

  // Error al cargar. Guardamos también el mes, para saber a qué mes corresponde
  const [error, setError] = useState<{ month: string; message: string } | null>(null);

  // Contador para el botón "Reintentar": al cambiarlo, el efecto se vuelve a ejecutar
  const [reloadKey, setReloadKey] = useState(0);

  // Cada vez que cambia el mes (o se presiona Reintentar), pedimos el resumen
  useEffect(() => {
    // "cancelled" evita un problema llamado "condición de carrera":
    // si cambias de agosto a septiembre muy rápido, y la respuesta de agosto
    // llega DESPUÉS que la de septiembre, sin esto se mostraría agosto por error
    let cancelled = false;

    apiFetch<Summary>(`/summary?month=${month}`)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError({
            month,
            message: err instanceof ApiError ? err.message : 'No se pudo cargar el resumen.',
          });
        }
      });

    // La limpieza se ejecuta cuando el mes cambia ANTES de que llegue la respuesta:
    // marca la petición vieja como cancelada para ignorar su resultado
    return () => {
      cancelled = true;
    };
  }, [month, reloadKey]);

  // Estados "derivados": no se guardan, se calculan a partir de los que ya tenemos
  // Hay error si el error guardado es del mes que estamos viendo
  const currentError = error?.month === month ? error : null;

  // Está cargando si el resumen que tenemos NO es del mes actual y tampoco hubo error
  const loading = summary?.month !== month && !currentError;

  function handleRetry() {
    setError(null);
    setReloadKey((key) => key + 1); // Forma segura de actualizar un estado basado en su valor anterior
  }

  return (
    <div className="space-y-6">
      {/* Encabezado: saludo a la izquierda, selector de mes a la derecha */}
      {/* flex-col en celular (uno debajo del otro), flex-row en pantallas medianas */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {user?.name} 👋</h1>
          <p className="text-gray-500">Este es el resumen de tu mes</p>
        </div>

        <MonthSelector month={month} onChange={setMonth} />
      </div>

      {/* Error con botón para reintentar */}
      {currentError && (
        <div className="rounded-2xl bg-red-50 p-4 text-red-800">
          <p>{currentError.message}</p>
          <button onClick={handleRetry} className="mt-2 font-medium underline">
            Reintentar
          </button>
        </div>
      )}

      {/* Primera carga: todavía no tenemos ningún resumen */}
      {loading && !summary && <p className="text-gray-500">Cargando resumen...</p>}

      {/* Cuando ya hay un resumen, lo mostramos
          Si estamos cargando OTRO mes, mostramos el anterior semitransparente,
          así la pantalla no "parpadea" mientras llega la respuesta */}
      {summary && !currentError && (
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-50' : ''}`}>
          <SummaryCards summary={summary} />

          {/* Dos columnas en pantallas medianas: egresos a la izquierda, ingresos a la derecha */}
          <div className="grid gap-6 md:grid-cols-2">
            <CategoryBreakdownList
              title="¿En qué gastaste?"
              items={summary.expenses_by_category}
              emptyMessage="No registraste gastos este mes."
            />
            <CategoryBreakdownList
              title="¿De dónde vinieron tus ingresos?"
              items={summary.income_by_category}
              emptyMessage="No registraste ingresos este mes."
            />
          </div>
        </div>
      )}
    </div>
  );
}