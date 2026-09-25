'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { DEFAULT_COLOR, suggestColor } from '@/lib/colors';
import { normalizeText } from '@/lib/format';
import { CategoryFormModal } from '@/components/CategoryFormModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { ApiResource, Category, TransactionType } from '@/lib/types';

const TABS: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: 'Gastos' },
  { value: 'income', label: 'Ingresos' },
];

export default function CategoriesPage() {
  const [type, setType] = useState<TransactionType>('expense');
  const [search, setSearch] = useState('');

  // Resultado guardado junto con el tipo que lo produjo (misma idea del queryKey)
  const [result, setResult] = useState<{ type: TransactionType; items: Category[] } | null>(null);
  const [error, setError] = useState<{ type: TransactionType; message: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Ventanas
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Cargamos las categorías del tipo seleccionado
  // La API ya incluye transactions_count gracias al withCount del Paso 5
  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiResource<Category[]>>(`/categories?type=${type}`)
      .then((response) => {
        if (!cancelled) setResult({ type, items: response.data });
      })
      .catch((err) => {
        if (!cancelled) {
          setError({ type, message: err instanceof ApiError ? err.message : 'No se pudieron cargar las categorías.' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [type, reloadKey]);

  // Estados derivados
  const currentError = error?.type === type ? error : null;
  const loading = result?.type !== type && !currentError;
  const categories = result?.items ?? [];

  // Filtro por nombre en el navegador (sin tildes ni mayúsculas), igual que el buscador del Paso 10
  const filtered = categories.filter((category) =>
    normalizeText(category.name).includes(normalizeText(search)),
  );

  function changeType(newType: TransactionType) {
    setType(newType);
    setSearch(''); // Al cambiar de pestaña, limpiamos la búsqueda
  }

  function reload() {
    setError(null);
    setReloadKey((key) => key + 1);
  }

  function openForm(category: Category | null) {
    setEditing(category);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function handleSaved() {
    closeForm();
    reload();
  }

  async function handleDelete() {
    if (!toDelete) return;

    setDeleting(true);
    setDeleteError('');

    try {
      await apiFetch(`/categories/${toDelete.id}`, { method: 'DELETE' });
      setToDelete(null);
      reload();
    } catch (err) {
      // Si tiene movimientos, Laravel responde 409 con un mensaje claro (Paso 5)
      setDeleteError(err instanceof ApiError ? err.message : 'No se pudo eliminar la categoría.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500">Organiza en qué gastas y de dónde vienen tus ingresos</p>
        </div>

        <button
          onClick={() => openForm(null)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Nueva categoría
        </button>
      </div>

      {/* Pestañas y buscador */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex gap-1 rounded-lg bg-gray-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => changeType(tab.value)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium ${
                type === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="search" // type="search" agrega una X para borrar el texto en algunos navegadores
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar categoría..."
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 sm:w-64"
        />
      </div>

      {currentError && (
        <div className="rounded-2xl bg-red-50 p-4 text-red-800">
          <p>{currentError.message}</p>
          <button onClick={reload} className="mt-2 font-medium underline">Reintentar</button>
        </div>
      )}

      {loading && !result && <p className="text-gray-500">Cargando categorías...</p>}

      {result && !currentError && (
        <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {categories.length === 0 ? (
            // No hay ninguna categoría de este tipo
            <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
              Aún no tienes categorías de {type === 'expense' ? 'gasto' : 'ingreso'}. Crea una con el botón
              &quot;+ Nueva categoría&quot;.
            </div>
          ) : filtered.length === 0 ? (
            // Hay categorías, pero ninguna coincide con la búsqueda
            <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
              Ninguna categoría coincide con &quot;{search}&quot;.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm">
              {filtered.map((category) => {
                const count = category.transactions_count ?? 0;
                const hasTransactions = count > 0;

                return (
                  <li key={category.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color ?? DEFAULT_COLOR }}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{category.name}</p>
                      <p className="text-sm text-gray-500">
                        {count === 0 ? 'Sin movimientos' : `${count} ${count === 1 ? 'movimiento' : 'movimientos'}`}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => openForm(category)}
                        className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError('');
                          setToDelete(category);
                        }}
                        // Si tiene movimientos, no se puede eliminar (regla del Paso 5)
                        // Lo deshabilitamos para que el usuario lo sepa antes de intentarlo
                        disabled={hasTransactions}
                        title={
                          hasTransactions
                            ? 'No se puede eliminar: tiene movimientos registrados. Puedes editarla para cambiarle el nombre.'
                            : undefined
                        }
                        className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Ventana para crear o editar */}
      {formOpen && (
        <CategoryFormModal
          key={editing?.id ?? 'new'}
          category={editing}
          defaultType={type}
          suggestedColor={suggestColor(type, categories.length)}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}

      {/* Confirmación para eliminar */}
      {toDelete && (
        <ConfirmDialog
          title="¿Eliminar categoría?"
          message={
            <>
              Vas a eliminar la categoría <strong>{toDelete.name}</strong>. Esta acción no se puede deshacer.
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