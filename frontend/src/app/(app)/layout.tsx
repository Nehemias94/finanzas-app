'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useIdleLogout } from '@/hooks/useIdleLogout';
import { IdleWarningModal } from '@/components/IdleWarningModal';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// Páginas del menú. Para agregar una página nueva al menú, solo se agrega aquí
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Resumen' },
  { href: '/transactions', label: 'Movimientos' },
  { href: '/categories', label: 'Categorías' },
];

// Este layout envuelve TODAS las páginas privadas (dashboard, movimientos, categorías...)
// Funciona como un guardia: si no hay sesión, no deja ver nada
export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, error, logout } = useAuth();
  const router = useRouter();

  // usePathname devuelve la ruta actual, ej: "/transactions"
  // Lo usamos para resaltar en el menú la página en la que estás
  // Va ANTES de cualquier "if", por las reglas de los hooks
  const pathname = usePathname();

  // Activa el cierre por inactividad y nos da los datos para mostrar el aviso
  const { secondsLeft, stayLoggedIn } = useIdleLogout();

  // Cuando termine de cargar, si no hay usuario, mandamos al login
  useEffect(() => {
    if (!loading && !user && !error) {
      router.replace('/login');
    }
  }, [loading, user, error, router]);

  // Si hubo un error de conexión, lo mostramos con un botón para reintentar
  // (la sesión se conserva, porque el token sigue guardado)
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">
        <p className="text-center text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Mientras verificamos la sesión (o si no hay usuario), no mostramos el contenido privado
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra superior, visible en todas las páginas privadas */}
      <header className="border-b border-gray-200 bg-white">
        {/* flex-wrap: en pantallas pequeñas, el menú baja a una segunda línea */}
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="text-lg font-bold text-emerald-600">Egreso / Gasto</span>

          <nav className="order-last flex w-full gap-1 sm:order-none sm:w-auto">
            {NAV_ITEMS.map((item) => {
              // La página está activa si la ruta actual empieza con su dirección
              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.name}</span>
            <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-red-600">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Aquí se muestra la página actual (dashboard, etc.) */}
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
     {/* Aviso de inactividad: solo se muestra cuando secondsLeft tiene un número */}
      {secondsLeft !== null && (
        <IdleWarningModal
          secondsLeft={secondsLeft}
          onContinue={stayLoggedIn}
          onLogout={handleLogout}
        />
      )}
    </div>
  );


}