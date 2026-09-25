'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { currentMonth, formatMoney, formatShortDate } from '@/lib/format';
import { MonthSelector } from '@/components/MonthSelector';
import { TransactionFormModal } from '@/components/TransactionFormModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Paginated, Transaction, TransactionType } from '@/lib/types';

// El filtro puede ser "todos" o uno de los dos tipos
type TypeFilter = 'all' | TransactionType;

const FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'expense', label: 'Gastos' },
  { value: 'income', label: 'Ingresos' },
];

const DEFAULT_COLOR = '#9CA3AF';

export default function TransactionsPage() {
  // ----- Qué estamos viendo -----
  const [month, setMonth] = useState(currentMonth);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [page, setPage] = useState(1);

  // ----- Datos recibidos -----
  // Guardamos el resultado junto con la "llave" de la consulta que lo produjo
  // (mes + filtro + página), para saber si corresponde a lo que estamos viendo
  const [result, setResult] = useState<{ key: string; data: Paginated<Transaction> } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // ----- Ventanas -----
  // formOpen: si la ventana está abierta. editing: el movimiento a editar (null = nuevo)
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Llave que identifica la consulta actual
  const queryKey = `${month}|${typeFilter}|${page}`;

  // Cargamos los movimientos cada vez que cambia la consulta (o se pide recargar)
  useEffect(() => {
    let cancelled = false;

    // URLSearchParams arma el texto "?month=2026-09&page=1" de forma segura
    const params = new URLSearchParams({ month, page: String(page) });
    if (typeFilter !== 'all') params.set('type', typeFilter);

    apiFetch<Paginated<Transaction>>(`/transactions?${params}`)
      .then((data) => {
        if (!cancelled) setResult({ key: queryKey, data });
      })
      .catch((err) => {
        if (!cancelled) {
          setError({
            key: queryKey,
            message: err instanceof ApiError ? err.message : 'No se pudieron cargar los movimientos.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [queryKey, month, typeFilter, page, reloadKey]);

  // Estados derivados, igual que en el dashboard
  const currentError = error?.key === queryKey ? error : null;
  const loading = result?.key !== queryKey && !currentError;

  // Al cambiar de mes o de filtro, volvemos a la página 1
  // (la página 3 de septiembre puede no existir en agosto)
  function changeMonth(newMonth: string) {
    setMonth(newMonth);
    setPage(1);
  }

  function changeFilter(filter: TypeFilter) {
    setTypeFilter(filter);
    setPage(1);
  }

  function reload() {
    setError(null);
    setReloadKey((key) => key + 1);
  }

  // Abrir la ventana para crear (sin movimiento) o para editar (con movimiento)
  function openForm(transaction: Transaction | null) {
    setEditing(transaction);
    setFormOpen(true);
  }

  function handleSaved(date: string) {
    setFormOpen(false);
    setEditing(null);
    changeMonth(date.slice(0, 7)); // Si cambiaste la fecha a otro mes, vamos a ese mes
    reload();
  }

  async function handleDelete() {
    if (!toDelete) return;

    setDeleting(true);
    setDeleteError('');

    try {
      await apiFetch(`/transactions/${toDelete.id}`, { method: 'DELETE' });
      setToDelete(null);

      // Si borramos el ÚNICO movimiento de una página que no es la primera,
      // esa página queda vacía: retrocedemos una
      if (result && result.data.data.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        reload();
      }
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'No se pudo eliminar el movimiento.');
    } finally {
      setDeleting(false);
    }
  }

  const transactions = result?.data.data ?? [];
  const meta = result?.data.meta;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimientos</h1>
          {/* Solo mostramos el total cuando ya cargó */}
          {meta && !loading && (
            <p className="text-gray-500">
              {meta.total} {meta.total === 1 ? 'movimiento' : 'movimientos'} en este mes
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <MonthSelector month={month} onChange={changeMonth} />
          <button
            onClick={() => openForm(null)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Registrar movimiento
          </button>
        </div>
      </div>

      {/* Filtros: Todos / Gastos / Ingresos */}
      <div className="inline-flex gap-1 rounded-lg bg-gray-100 p-1">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => changeFilter(filter.value)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium ${
              typeFilter === filter.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {currentError && (
        <div className="rounded-2xl bg-red-50 p-4 text-red-800">
          <p>{currentError.message}</p>
          <button onClick={reload} className="mt-2 font-medium underline">Reintentar</button>
        </div>
      )}

      {loading && !result && <p className="text-gray-500">Cargando movimientos...</p>}

      {result && !currentError && (
        <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {transactions.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
              No hay movimientos para mostrar en este mes.
            </div>
          ) : (
            // divide-y: dibuja una línea divisoria entre cada elemento de la lista
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm">
              {transactions.map((transaction) => {
                const isIncome = transaction.type === 'income';

                return (
                  <li key={transaction.id} className="flex items-center gap-3 px-4 py-3">
                    {/* shrink-0: el puntito nunca se encoge aunque falte espacio */}
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: transaction.category.color ?? DEFAULT_COLOR }}
                    />

                    {/* min-w-0 permite que "truncate" funcione dentro de un flex:
                        sin él, los textos largos empujarían los botones fuera de la pantalla */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{transaction.category.name}</p>
                      <p className="truncate text-sm text-gray-500">
                        {formatShortDate(transaction.date)}
                        {transaction.description && ` · ${transaction.description}`}
                      </p>
                    </div>

                    {/* Monto con signo: + verde para ingresos, - rojo para gastos */}
                    <p className={`shrink-0 font-semibold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'}{formatMoney(transaction.amount)}
                    </p>

                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => openForm(transaction)}
                        className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError('');
                          setToDelete(transaction);
                        }}
                        className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Paginación: solo si hay más de una página */}
          {meta && meta.last_page > 1 && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((current) => current - 1)}
                disabled={page <= 1}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {meta.current_page} de {meta.last_page}
              </span>
              <button
                onClick={() => setPage((current) => current + 1)}
                disabled={page >= meta.last_page}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ventana para crear o editar
          key: cambia al editar otro movimiento, así la ventana se reinicia con los datos correctos */}
      {formOpen && (
        <TransactionFormModal
          key={editing?.id ?? 'new'}
          transaction={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {/* Confirmación para eliminar */}
      {toDelete && (
        <ConfirmDialog
          title="¿Eliminar movimiento?"
          message={
            <>
              Vas a eliminar el {toDelete.type === 'income' ? 'ingreso' : 'gasto'} de{' '}
              <strong>{formatMoney(toDelete.amount)}</strong> en <strong>{toDelete.category.name}</strong> del{' '}
              {formatShortDate(toDelete.date)}. Esta acción no se puede deshacer.
            </>
          }
          loading={deleting}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}