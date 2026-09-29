'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch, ApiError, wakeServer } from '@/lib/api';
import { getToken, isSessionIdle, removeToken, setLogoutReason, setToken } from '@/lib/token';
import type { AuthResponse, User } from '@/lib/types';

// Describimos todo lo que el contexto ofrece
interface AuthContextValue {
  user: User | null;     // El usuario actual, o null si no hay sesión
  loading: boolean;      // true mientras se prepara la app (despertar servidor + verificar sesión)
  waking: boolean;       // NUEVO: true si el servidor está tardando en despertar
  error: string | null;  // Mensaje si no se pudo conectar con el servidor
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Si el servidor tarda más que esto en responder, avisamos que está despertando
const WAKING_MESSAGE_DELAY_MS = 3000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Se ejecuta UNA vez, cuando la aplicación carga en el navegador
  useEffect(() => {
    async function loadUser() {
      // 1. Si había una sesión guardada pero pasó demasiado tiempo sin actividad,
      //    la cerramos de inmediato (sin preguntarle nada al servidor)
      if (getToken() && isSessionIdle()) {
        removeToken();
        setLogoutReason('inactivity');
      }

      // 2. Despertamos al servidor ANTES de cualquier otra petición
      //    Si tarda más de 3 segundos, activamos el mensaje "Despertando el servidor..."
      //    setTimeout ejecuta una función después de cierto tiempo, sin detener el resto del código
      const wakingTimer = setTimeout(() => setWaking(true), WAKING_MESSAGE_DELAY_MS);
      const awake = await wakeServer();
      clearTimeout(wakingTimer); // Si respondió antes de 3 segundos, el mensaje nunca aparece
      setWaking(false);

      // 3. Sin token no hay sesión que verificar: mostramos el login
      //    (si el servidor no despertó, el propio login mostrará el error al intentar entrar)
      if (!getToken()) {
        setLoading(false);
        return;
      }

      // 4. Hay sesión guardada, pero el servidor no respondió: avisamos sin cerrar la sesión
      if (!awake) {
        setError('No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
        setLoading(false);
        return;
      }

      // 5. Servidor despierto y con token: preguntamos "¿quién soy?"
      try {
        const me = await apiFetch<User>('/me');
        setUser(me);
      } catch (err) {
        // Si fue 401, apiFetch ya borró el token: la sesión realmente no es válida
        // Si fue otro error, conservamos el token y avisamos
        if (!(err instanceof ApiError && err.status === 401)) {
          setError('No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // Inicia sesión: pide el token a Laravel, lo guarda y guarda el usuario
  async function login(email: string, password: string) {
    const data = await apiFetch<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, device_name: 'web' }),
    });

    setToken(data.token);
    setUser(data.user);
  }

  // Registro: igual que el login, pero creando la cuenta
  async function register(name: string, email: string, password: string, passwordConfirmation: string) {
    const data = await apiFetch<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        device_name: 'web',
      }),
    });

    setToken(data.token);
    setUser(data.user);
  }

  // Cierra sesión: le pide a Laravel que borre el token, y lo borra del navegador
  async function logout() {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } finally {
      removeToken();
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, waking, error, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto: const { user } = useAuth();
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }

  return context;
}