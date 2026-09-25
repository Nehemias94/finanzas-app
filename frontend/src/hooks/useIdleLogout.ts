'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import {
  IDLE_WARNING_SECONDS,
  getIdleRemainingMs,
  setLastActivity,
  setLogoutReason,
} from '@/lib/token';

// Eventos que cuentan como "el usuario está activo"
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const;

// Cada cuánto, como máximo, le avisamos a Laravel que seguimos activos (2 minutos)
const KEEP_ALIVE_MS = 2 * 60 * 1000;

// El hook ahora DEVUELVE datos para que el layout muestre el aviso
export function useIdleLogout() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Segundos que faltan para el cierre, o null si el aviso no debe mostrarse
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    let lastWrite = 0;             // Última vez que guardamos la actividad
    let lastPing = Date.now();     // Última vez que le avisamos a Laravel
    let warningVisible = false;    // ¿Se está mostrando el aviso?
    let loggingOut = false;        // Evita cerrar la sesión dos veces

    function handleActivity() {
      // Si el aviso está visible, el movimiento NO cuenta:
      // el usuario debe presionar "Continuar sesión"
      if (warningVisible) return;

      const now = Date.now();

      // Guardamos la actividad como máximo cada 10 segundos
      if (now - lastWrite > 10_000) {
        setLastActivity();
        lastWrite = now;
      }

      // KEEP-ALIVE: si pasaron 2 minutos desde el último aviso a Laravel,
      // hacemos una petición ligera para que actualice last_used_at del token
      // .catch(() => {}) ignora errores: si falla, no interrumpimos al usuario
      if (now - lastPing > KEEP_ALIVE_MS) {
        lastPing = now;
        apiFetch('/me').catch(() => {});
      }
    }

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));

    // Revisamos CADA SEGUNDO para que la cuenta regresiva se vea fluida
    const interval = setInterval(async () => {
      const remaining = getIdleRemainingMs();


      // TEMPORAL: muestra en la consola cuántos segundos faltan para el cierre
      console.log('Segundos restantes:', Math.ceil(remaining / 1000));

      // Se acabó el tiempo: cerramos la sesión
      if (remaining <= 0) {
        if (loggingOut) return;
        loggingOut = true;
        clearInterval(interval);
        setSecondsLeft(null);
        setLogoutReason('inactivity');
        await logout();
        router.replace('/login');
        return;
      }

      // Estamos en los últimos segundos: mostramos el aviso con la cuenta regresiva
      // Math.ceil redondea hacia arriba: 29.4 segundos se muestran como 30
      if (remaining <= IDLE_WARNING_SECONDS * 1000) {
        warningVisible = true;
        setSecondsLeft(Math.ceil(remaining / 1000));
      } else {
        // Hay tiempo de sobra: ocultamos el aviso
        // (esto también cubre el caso de que el usuario esté activo en OTRA pestaña)
        warningVisible = false;
        setSecondsLeft(null);
      }
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
      clearInterval(interval);
    };
  }, [user, logout, router]);

  // Se ejecuta cuando el usuario presiona "Continuar sesión"
  // useCallback guarda la función para no recrearla en cada dibujado
  const stayLoggedIn = useCallback(async () => {
    setLastActivity();     // Reinicia el contador de inactividad
    setSecondsLeft(null);  // Oculta el aviso de inmediato

    // Le avisamos a Laravel que seguimos activos
    // Si el token ya no es válido (ej: la computadora estuvo suspendida mucho tiempo),
    // apiFetch recibirá 401 y nos llevará al login automáticamente
    try {
      await apiFetch('/me');
    } catch {
      // Si fue otro tipo de error, no hacemos nada
    }
  }, []);

  return { secondsLeft, stayLoggedIn };
}