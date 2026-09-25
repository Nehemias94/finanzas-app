'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Este layout envuelve las páginas de login y registro
export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter(); // Permite cambiar de página desde el código

  // Si ya tienes sesión y entras a /login, te manda directo al dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]); // Se vuelve a ejecutar cuando cambia alguno de estos valores

  // ===== NUEVO =====
  // Mientras verificamos la sesión, o si ya sabemos que hay usuario
  // (y estamos a punto de redirigir), NO mostramos el formulario
  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }
  // ===== FIN DE LO NUEVO =====

  return (
    // Centra el contenido en la pantalla con un fondo gris claro
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}