'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';
import { currentMonth } from '@/lib/format';
import { MonthSelector } from '@/components/MonthSelector';
import { SummaryCards } from '@/components/SummaryCards';
import { CategoryBreakdownList } from '@/components/CategoryBreakdownList';
import { MonthlyHistoryChart } from '@/components/MonthlyHistoryChart';
import { RecentTransactions } from '@/components/RecentTransactions';
import { InitialBalanceTip } from '@/components/InitialBalanceTip';
import { TransactionFormModal } from '@/components/TransactionFormModal';
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

  // Contador para recargar. Lo comparten el resumen, el historial y los últimos movimientos:
  // al cambiarlo, los tres se actualizan al mismo tiempo
  const [reloadKey, setReloadKey] = useState(0);

  // ¿Se muestra la ventana para registrar un movimiento?
  const [showForm, setShowForm] = useState(false);

  // Cada vez que cambia el mes (o se pide recargar), pedimos el resumen
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

  // Se ejecuta cuando el formulario guardó un movimiento
  function handleSaved(date: string) {
    setShowForm(false);

    // Mostramos el mes del movimiento: "2026-09-20".slice(0, 7) -> "2026-09"
    // Si registraste un gasto de un mes anterior, el dashboard va a ese mes
    setMonth(date.slice(0, 7));

    // Recargamos todo: resumen, historial y últimos movimientos
    setReloadKey((key) => key + 1);
  }

  return (
    <div className="space-y-6">
      {/* Encabezado: saludo a la izquierda, selector de mes y botón a la derecha */}
      {/* flex-col en celular (uno debajo del otro), flex-row en pantallas medianas */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {user?.name} 👋</h1>
          <p className="text-gray-500">Este es el resumen de tu mes</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <MonthSelector month={month} onChange={setMonth} />
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Registrar movimiento
          </button>
        </div>
      </div>

      {/* Aviso para configurar el saldo inicial (solo si está en $0 y no se cerró antes) */}
      <InitialBalanceTip />

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

          {/* Dos columnas en pantallas medianas: egresos a la izquierda, ingresos a la derecha
              month: lo necesitan para armar el enlace de cada categoría hacia Movimientos */}
          <div className="grid gap-6 md:grid-cols-2">
            <CategoryBreakdownList
              title="¿En qué gastaste?"
              items={summary.expenses_by_category}
              total={summary.total_expense}
              month={month}
              emptyMessage="No registraste gastos este mes."
            />
            <CategoryBreakdownList
              title="¿De dónde vinieron tus ingresos?"
              items={summary.income_by_category}
              total={summary.total_income}
              month={month}
              emptyMessage="No registraste ingresos este mes."
            />
          </div>
        </div>
      )}

      {/* Historial y últimos movimientos, lado a lado en pantallas grandes (lg:)
          El historial ocupa 2 de las 3 columnas (lg:col-span-2), y los movimientos 1
          Van FUERA del bloque del resumen: así se muestran aunque el resumen tenga un error */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyHistoryChart month={month} reloadKey={reloadKey} />
        </div>
        <RecentTransactions month={month} reloadKey={reloadKey} />
      </div>

      {/* Ventana para registrar un movimiento: solo se muestra cuando showForm es true */}
      {showForm && (
        <TransactionFormModal onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}