'use client';

import { useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { COLOR_PALETTE } from '@/lib/colors';
import type { Category, TransactionType, ValidationErrors } from '@/lib/types';

interface CategoryFormModalProps {
  category?: Category | null;    // Si viene, la ventana EDITA esa categoría
  defaultType: TransactionType;  // Tipo inicial al crear (la pestaña que estabas viendo)
  suggestedColor: string;        // Color inicial al crear
  onClose: () => void;
  onSaved: () => void;
}

export function CategoryFormModal({ category, defaultType, suggestedColor, onClose, onSaved }: CategoryFormModalProps) {
  const isEditing = Boolean(category);

  const [name, setName] = useState(category?.name ?? '');
  const [type, setType] = useState<TransactionType>(category?.type ?? defaultType);
  const [color, setColor] = useState(category?.color ?? suggestedColor);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setMessage('');
    setSubmitting(true);

    try {
      if (category) {
        // Al editar solo enviamos nombre y color: el tipo no se puede cambiar (regla del Paso 5)
        await apiFetch(`/categories/${category.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: name.trim(), color }),
        });
      } else {
        await apiFetch('/categories', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), type, color }),
        });
      }

      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setErrors(err.errors);
      } else {
        setMessage(err instanceof ApiError ? err.message : 'No se pudo guardar la categoría.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div role="dialog" aria-modal="true" aria-labelledby="category-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="category-title" className="mb-4 text-lg font-bold text-gray-900">
          {isEditing ? 'Editar categoría' : 'Nueva categoría'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo: solo se elige al crear. Al editar se muestra como texto fijo */}
          {isEditing ? (
            <p className="text-sm text-gray-500">
              Categoría de{' '}
              <strong className={type === 'income' ? 'text-emerald-600' : 'text-red-600'}>
                {type === 'income' ? 'ingreso' : 'gasto'}
              </strong>
              . El tipo no se puede cambiar.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`rounded-md py-2 text-sm font-medium ${
                  type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`rounded-md py-2 text-sm font-medium ${
                  type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                Ingreso
              </button>
            </div>
          )}

          {/* Nombre */}
          <div className="space-y-1">
            <label htmlFor="category-name" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              id="category-name"
              type="text"
              required
              autoFocus
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'expense' ? 'Ej: Comida' : 'Ej: Salario'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.name?.map((m) => <p key={m} className="text-sm text-red-600">{m}</p>)}
          </div>

          {/* Color */}
          <div className="space-y-2">
            <span className="block text-sm font-medium text-gray-700">Color</span>

            <div className="flex flex-wrap items-center gap-2">
              {/* Muestras de la paleta: un botón redondo por cada color */}
              {COLOR_PALETTE.map((paletteColor) => {
                // Comparamos en minúsculas porque el selector del navegador devuelve "#e74c3c"
                // y la paleta tiene "#E74C3C": son el mismo color escrito distinto
                const selected = color.toLowerCase() === paletteColor.toLowerCase();

                return (
                  <button
                    key={paletteColor}
                    type="button"
                    onClick={() => setColor(paletteColor)}
                    aria-label={`Elegir color ${paletteColor}`}
                    aria-pressed={selected} // Indica a los lectores de pantalla cuál está elegido
                    // ring: anillo alrededor del color seleccionado
                    className={`h-8 w-8 rounded-full ${selected ? 'ring-2 ring-gray-900 ring-offset-2' : ''}`}
                    style={{ backgroundColor: paletteColor }}
                  />
                );
              })}

              {/* Selector libre del navegador, por si quieres un color fuera de la paleta */}
              <label className="flex h-8 cursor-pointer items-center gap-1 rounded-full border border-gray-300 px-2 text-xs text-gray-600">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                />
                Otro
              </label>
            </div>

            {errors.color?.map((m) => <p key={m} className="text-sm text-red-600">{m}</p>)}
          </div>

          {/* Vista previa: así se verá la categoría en las listas */}
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-sm font-medium text-gray-800">{name.trim() || 'Vista previa'}</span>
          </div>

          {message && <p className="text-sm text-red-600">{message}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}