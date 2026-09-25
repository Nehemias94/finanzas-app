'use client';

import { useState, type FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { todayString } from '@/lib/format';
import { CategoryCombobox } from '@/components/CategoryCombobox';
import type { Category, TransactionType, ValidationErrors } from '@/lib/types';

interface TransactionFormModalProps {
  onClose: () => void;              // Cerrar sin guardar
  onSaved: (date: string) => void;  // Se guardó: avisamos la fecha para mostrar ese mes
}

// Las clases de los campos se repiten, así que las guardamos en una constante
const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500';

export function TransactionFormModal({ onClose, onSaved }: TransactionFormModalProps) {
  const [type, setType] = useState<TransactionType>('expense'); // Lo más común es registrar gastos
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayString);
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Al cambiar entre Gasto e Ingreso, la categoría elegida ya no aplica
  function handleTypeChange(newType: TransactionType) {
    setType(newType);
    setCategory(null);
    setErrors({});
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setMessage('');

    // Validación en el navegador: nos ahorra una petición si falta la categoría
    // (Laravel igual valida todo; esto solo es para responder más rápido)
    if (!category) {
      setErrors({ category_id: ['Selecciona una categoría o crea una nueva.'] });
      return;
    }

    setSubmitting(true);

    try {
      await apiFetch('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          category_id: category.id,
          amount,
          date,
          // Si la descripción está vacía, enviamos null en vez de ""
          description: description.trim() || null,
        }),
      });

      onSaved(date);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setErrors(err.errors);
      } else {
        setMessage(err instanceof ApiError ? err.message : 'No se pudo guardar el movimiento.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div role="dialog" aria-modal="true" aria-labelledby="transaction-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="transaction-title" className="mb-4 text-lg font-bold text-gray-900">
          Registrar movimiento
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector Gasto / Ingreso */}
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
            <button
              type="button" // type="button" evita que este botón envíe el formulario
              onClick={() => handleTypeChange('expense')}
              className={`rounded-md py-2 text-sm font-medium ${
                type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`rounded-md py-2 text-sm font-medium ${
                type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Ingreso
            </button>
          </div>

          {/* Monto */}
          <div className="space-y-1">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Monto</label>
            <input
              id="amount"
              type="number"
              inputMode="decimal" // En celulares muestra el teclado numérico con punto decimal
              step="0.01"         // Permite hasta 2 decimales
              min="0.01"
              required
              autoFocus           // El cursor empieza aquí al abrir la ventana
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
            {errors.amount?.map((m) => <p key={m} className="text-sm text-red-600">{m}</p>)}
          </div>

          {/* Categoría
              key={type} hace que React DESTRUYA y cree de nuevo el buscador al cambiar de tipo.
              Así se reinicia todo su estado interno (texto, lista, categorías cargadas)
              y carga las categorías del nuevo tipo desde cero */}
          <CategoryCombobox
            key={type}
            type={type}
            value={category}
            onChange={setCategory}
            error={errors.category_id}
          />

          {/* Fecha: max impide elegir fechas futuras en el calendario */}
          <div className="space-y-1">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Fecha</label>
            <input
              id="date"
              type="date"
              required
              max={todayString()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
            {errors.date?.map((m) => <p key={m} className="text-sm text-red-600">{m}</p>)}
          </div>

          {/* Descripción opcional */}
          <div className="space-y-1">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              id="description"
              type="text"
              maxLength={255}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Camisa en el centro comercial"
              className={inputClass}
            />
            {errors.description?.map((m) => <p key={m} className="text-sm text-red-600">{m}</p>)}
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
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}