import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;      // ReactNode: puede ser texto o JSX (ej: con <strong>)
  confirmLabel?: string;   // Texto del botón rojo (por defecto "Eliminar")
  loading?: boolean;       // true mientras se ejecuta la acción
  error?: string;          // Mensaje si la acción falló
  onConfirm: () => void;
  onCancel: () => void;
}

// Ventana genérica para confirmar acciones peligrosas (como eliminar)
// No sabe QUÉ se va a eliminar: eso lo decide quien la usa. Por eso sirve para todo
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Eliminar',
  loading = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="confirm-title" className="text-lg font-bold text-gray-900">{title}</h2>
        <div className="mt-2 text-sm text-gray-600">{message}</div>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex gap-3">
          {/* autoFocus en Cancelar (y no en Eliminar): si presionas Enter sin pensar, no borras nada */}
          <button
            onClick={onCancel}
            autoFocus
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Eliminando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}