'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';
import type { User, ValidationErrors } from '@/lib/types';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500';

export default function SettingsPage() {
  // setUser lo dejamos preparado en el AuthContext desde el Paso 8, justo para esto
  const { user, setUser } = useAuth();

  // Los valores iniciales salen del usuario actual
  const [name, setName] = useState(user?.name ?? '');
  const [initialBalance, setInitialBalance] = useState(user?.initial_balance ?? '0.00');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setMessage('');
    setSuccess('');
    setSubmitting(true);

    try {
      // La ruta del Paso 7: actualiza nombre y saldo inicial, y devuelve el usuario actualizado
      const updated = await apiFetch<User>('/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          // Si el campo quedó vacío, enviamos 0
          initial_balance: initialBalance === '' ? 0 : initialBalance,
        }),
      });

      // Actualizamos el usuario en el contexto: así el nombre de la barra superior
      // y el aviso del dashboard se enteran del cambio sin recargar la página
      setUser(updated);
      setInitialBalance(updated.initial_balance);
      setSuccess('Cambios guardados correctamente.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setErrors(err.errors);
      } else {
        setMessage(err instanceof ApiError ? err.message : 'No se pudieron guardar los cambios.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500">Tus datos y el punto de partida de tus finanzas</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
        {/* Correo: solo lectura (cambiarlo requiere pasos de seguridad extra) */}
        <div className="space-y-1">
          <span className="block text-sm font-medium text-gray-700">Correo</span>
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-gray-600">{user?.email}</p>
        </div>

        {/* Nombre */}
        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            id="name"
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          {errors.name?.map((m) => <p key={m} className="text-sm text-red-600">{m}</p>)}
        </div>

        {/* Saldo inicial, con su explicación */}
        <div className="space-y-1">
          <label htmlFor="initial_balance" className="block text-sm font-medium text-gray-700">
            Saldo inicial
          </label>
          <p className="text-sm text-gray-500">
            El dinero que ya tenías ahorrado cuando empezaste a usar la app. Se suma a tu saldo acumulado, pero
            no cuenta como ingreso de ningún mes.
          </p>
          <div className="relative">
            {/* Símbolo $ dentro del campo, a la izquierda */}
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              id="initial_balance"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className={`${inputClass} pl-7`}
            />
          </div>
          {errors.initial_balance?.map((m) => <p key={m} className="text-sm text-red-600">{m}</p>)}
        </div>

        {message && <p className="text-sm text-red-600">{message}</p>}
        {success && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}