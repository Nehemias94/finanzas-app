import { currentMonth, formatMonthLabel, shiftMonth } from '@/lib/format';

interface MonthSelectorProps {
  month: string;                     // Mes seleccionado, ej: "2026-09"
  onChange: (month: string) => void; // Se llama al cambiar de mes
}

// Este componente no tiene estado propio: recibe el mes y avisa cuando cambia
// El que guarda el mes es el componente "padre" (el dashboard)
export function MonthSelector({ month, onChange }: MonthSelectorProps) {
  // No permitimos avanzar más allá del mes actual: el futuro aún no tiene movimientos
  // Los textos "AAAA-MM" se pueden comparar directamente: "2026-09" >= "2026-08" es true
  const isCurrentOrFuture = month >= currentMonth();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="Mes anterior" // Texto para lectores de pantalla, ya que el botón solo tiene un símbolo
        className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-gray-600 hover:bg-gray-100"
      >
        ←
      </button>

      {/* min-w evita que los botones "salten" cuando cambia el largo del nombre del mes */}
      <span className="min-w-44 text-center font-semibold text-gray-900">
        {formatMonthLabel(month)}
      </span>

      <button
        onClick={() => onChange(shiftMonth(month, 1))}
        disabled={isCurrentOrFuture}
        aria-label="Mes siguiente"
        className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        →
      </button>
    </div>
  );
}