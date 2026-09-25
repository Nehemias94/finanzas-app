// 'use client' indica que este componente se ejecuta en el NAVEGADOR
// Es necesario porque usamos estado (useState), efectos (useEffect) y localStorage
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
//import { apiFetch } from '@/lib/api'; // @/ es un atajo que apunta a la carpeta src/
//import { getToken, removeToken, setToken } from '@/lib/token';
import { getToken, isSessionIdle, removeToken, setLogoutReason, setToken } from '@/lib/token';
import type { AuthResponse, User } from '@/lib/types';
import { apiFetch, ApiError } from '@/lib/api';

// Describimos todo lo que el contexto ofrece
interface AuthContextValue {
  user: User | null;  // El usuario actual, o null si no hay sesión
  loading: boolean;   // true mientras verificamos si hay una sesión guardada
  error: string | null; // <-- mensaje si no se pudo verificar la sesión
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void; // Para actualizar el usuario (ej: al editar el perfil)
}

// Creamos el contexto. Empieza en null hasta que el Provider le dé un valor
const AuthContext = createContext<AuthContextValue | null>(null);

// El Provider "envuelve" la aplicación y le entrega los datos a todos los componentes de adentro
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect con [] se ejecuta UNA vez, cuando la aplicación carga en el navegador
  // Aquí revisamos si ya había una sesión guardada (por ejemplo, si recargaste la página)
  useEffect(() => {
    async function loadUser() {
      // Sin token no hay sesión: terminamos de cargar
      if (!getToken()) {
        setLoading(false);
        return;
      }

        // si pasó demasiado tiempo desde la última actividad,
      // cerramos la sesión sin siquiera preguntarle a Laravel
      if (isSessionIdle()) {
        removeToken();
        setLogoutReason('inactivity');
        setLoading(false);
        return;
      }

      try {
        // Con token, le preguntamos a Laravel "¿quién soy?"
        // Si el token es válido, obtenemos el usuario
        const me = await apiFetch<User>('/me');
        setUser(me);
      } catch (err){
        // Si fue 401, apiFetch ya borró el token: la sesión realmente no es válida
        // Si fue OTRO error (servidor apagado, error 500, lentitud),
        // conservamos el token y avisamos, en vez de cerrar la sesión
        if (!(err instanceof ApiError && err.status === 401)) {
          setError('No se pudo conectar con el servidor. Revisa que Laravel esté encendido.');
        }
      } finally {
        // finally se ejecuta siempre, haya salido bien o mal
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // Inicia sesión: pide el token a Laravel, lo guarda y guarda el usuario
  async function login(email: string, password: string) {
    const data = await apiFetch<AuthResponse>('/login', {
      method: 'POST',
      // JSON.stringify convierte el objeto en texto JSON para enviarlo
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
        password_confirmation: passwordConfirmation, // Laravel espera este nombre exacto
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
      // Aunque Laravel falle, cerramos la sesión localmente
      removeToken();
      setUser(null);
    }
  }

  // value es lo que reciben todos los componentes que usen el contexto
  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto fácilmente: const { user } = useAuth();
// Los hooks en React siempre empiezan con "use"
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  // Si alguien usa useAuth() fuera del AuthProvider, avisamos con un error claro
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }

  return context;
}