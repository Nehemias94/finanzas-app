'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// Llave en localStorage para recordar que el usuario cerró el aviso
const DISMISS_KEY = 'finanzas_hide_initial_balance_tip';

// Lee si el aviso ya fue cerrado (con try/catch por si el navegador bloquea localStorage)
function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

// Aviso para usuarios nuevos: les sugiere configurar su saldo inicial
export function InitialBalanceTip() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(wasDismissed);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Si falla, solo se oculta mientras la página esté abierta
    }
    setDismissed(true);
  }

  // Solo se muestra si el saldo inicial es 0 y el usuario no lo cerró antes
  if (!user || Number(user.initial_balance) !== 0 || dismissed) {
    return null; // Devolver null en un componente significa "no dibujar nada"
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-sky-50 p-4 text-sky-900 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm">
        <strong>¿Ya tenías dinero ahorrado?</strong> Configura tu saldo inicial para que tu saldo acumulado
        refleje lo que realmente tienes.
      </p>
      <div className="flex shrink-0 gap-2">
        <button onClick={dismiss} className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-sky-100">
          Empiezo desde cero
        </button>
        <Link
          href="/settings"
          className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
        >
          Configurar
        </Link>
      </div>
    </div>
  );
}