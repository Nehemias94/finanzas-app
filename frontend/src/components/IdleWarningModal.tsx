import { IDLE_WARNING_SECONDS } from '@/lib/token';

interface IdleWarningModalProps {
  secondsLeft: number;       // Segundos que faltan
  onContinue: () => void;    // Qué hacer al presionar "Continuar sesión"
  onLogout: () => void;      // Qué hacer al presionar "Cerrar sesión"
}

export function IdleWarningModal({ secondsLeft, onContinue, onLogout }: IdleWarningModalProps) {
  // Porcentaje de la barra de progreso: 100% al inicio, 0% al final
  const progress = (secondsLeft / IDLE_WARNING_SECONDS) * 100;

  return (
    // Capa que cubre toda la pantalla con un fondo oscuro semitransparente
    // fixed inset-0: ocupa toda la ventana y no se mueve con el scroll
    // z-50: se dibuja por encima de todo lo demás
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      {/* role="dialog" y aria-modal ayudan a los lectores de pantalla (accesibilidad) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="idle-title"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="idle-title" className="text-lg font-bold text-gray-900">
          ¿Sigues ahí?
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Tu sesión ha estado sin actividad. Por seguridad se cerrará en{' '}
          <span className="font-bold text-amber-600">{secondsLeft} segundos</span>.
        </p>

        {/* Barra de progreso que se va vaciando */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cerrar sesión
          </button>

          {/* autoFocus: el botón queda seleccionado, así con solo presionar Enter continúas */}
          <button
            onClick={onContinue}
            autoFocus
            className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Continuar sesión
          </button>
        </div>
      </div>
    </div>
  );
}