'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { DEFAULT_COLOR } from '@/lib/colors';
import { formatMoney, formatShortDate } from '@/lib/format';
import type { Paginated, Transaction } from '@/lib/types';

// Cuántos movimientos mostramos en la tarjeta
const LIMIT = 5;

interface RecentTransactionsProps {
  month: string;     // Mes que se está viendo en el dashboard
  reloadKey: number; // Cuando cambia, se vuelve a cargar (ej: al registrar un movimiento)
}

// Tarjeta con los últimos movimientos del mes. Carga sus propios datos
export function RecentTransactions({ month, reloadKey }: RecentTransactionsProps) {
  const [result, setResult] = useState<{ key: string; data: Paginated<Transaction> } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);

  const queryKey = `${month}|${reloadKey}`;

  useEffect(() => {
    let cancelled = false;

    // per_page=5: solo pedimos los 5 más recientes, no los 50
    apiFetch<Paginated<Transaction>>(`/transactions?month=${month}&per_page=${LIMIT}`)
      .then((data) => {
        if (!cancelled) setResult({ key: queryKey, data });
      })
      .catch((err) => {
        if (!cancelled) {
          setError({ key: queryKey, message: err instanceof ApiError ? err.message : 'No se pudieron cargar los movimientos.' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [queryKey, month]);

  const currentError = error?.key === queryKey ? error : null;
  const loading = result?.key !== queryKey && !currentError;
  const transactions = result?.data.data ?? [];

  // Total de movimientos del mes (no solo los 5 que mostramos), para el enlace "Ver todos"
  const total = result?.data.meta.total ?? 0;

  return (
    // flex-col + h-full: la tarjeta ocupa todo el alto disponible, y el enlace queda abajo
    <div className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 font-semibold text-gray-900">Últimos movimientos</h2>

      {currentError && <p className="text-sm text-red-600">{currentError.message}</p>}
      {loading && !result && <p className="text-sm text-gray-400">Cargando...</p>}

      {result && !currentError && (
        <div className={`flex flex-1 flex-col transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-400">No hay movimientos en este mes.</p>
          ) : (
            <ul className="flex-1 space-y-3">
              {transactions.map((transaction) => {
                const isIncome = transaction.type === 'income';

                return (
                  <li key={transaction.id} className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: transaction.category.color ?? DEFAULT_COLOR }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{transaction.category.name}</p>
                      <p className="truncate text-xs text-gray-500">
                        {formatShortDate(transaction.date)}
                        {transaction.description && ` · ${transaction.description}`}
                      </p>
                    </div>
                    <p className={`shrink-0 text-sm font-semibold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'}{formatMoney(transaction.amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Enlace a la página completa, llevando el mes en la URL */}
          {total > 0 && (
            <Link
              href={`/transactions?month=${month}`}
              className="mt-4 block rounded-lg bg-gray-50 py-2 text-center text-sm font-medium text-emerald-700 hover:bg-gray-100"
            >
              Ver todos ({total}) →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}