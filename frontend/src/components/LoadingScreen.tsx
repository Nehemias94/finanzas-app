'use client';

import { useAuth } from '@/context/AuthContext';

// Pantalla que se muestra mientras la app se prepara
// Si el servidor está tardando en despertar, explica por qué
export function LoadingScreen() {
  const { waking } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
      {/* Círculo que gira: un borde gris con un tramo verde, y animate-spin lo hace rotar */}
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" />

      {waking ? (
        <div>
          <p className="font-medium text-gray-700">Despertando el servidor...</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Después de un rato sin uso, el servidor se apaga para ahorrar recursos. La primera carga puede tardar
            hasta un minuto.
          </p>
        </div>
      ) : (
        <p className="text-gray-500">Cargando...</p>
      )}
    </div>
  );
}