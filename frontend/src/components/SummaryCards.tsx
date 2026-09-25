import { formatMoney } from '@/lib/format';
import type { Summary } from '@/lib/types';

interface SummaryCardsProps {
  summary: Summary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  // ¿El mes terminó en positivo o en negativo?
  const monthBalance = Number(summary.month_balance);
  const saved = monthBalance >= 0;

    // ¿Hubo algún movimiento este mes?
  const hasMovements = Number(summary.total_income) > 0 || Number(summary.total_expense) > 0;

  // Lista de tarjetas: así las dibujamos con un solo map() en vez de repetir el HTML 4 veces
  const cards = [
    { label: 'Saldo inicial', value: summary.opening_balance, color: 'text-gray-900', hint: 'Lo que traías de meses anteriores' },
    { label: 'Ingresos', value: summary.total_income, color: 'text-emerald-600', hint: 'Lo que entró este mes' },
    { label: 'Egresos', value: summary.total_expense, color: 'text-red-600', hint: 'Lo que gastaste este mes' },
    { label: 'Saldo final', value: summary.closing_balance, color: 'text-gray-900', hint: 'Pasa al próximo mes' },
  ];

  return (
    <div className="space-y-4">
      {/* grid: 2 columnas en celular, 4 en pantallas medianas (md:) o más grandes */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => (
          // key: React necesita un identificador único por elemento de una lista
          <div key={card.label} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`mt-1 text-xl font-bold ${card.color}`}>{formatMoney(card.value)}</p>
            <p className="mt-1 text-xs text-gray-400">{card.hint}</p>
          </div>
        ))}
      </div>

{/* Tres casos: sin movimientos (gris), ahorraste (verde), gastaste de más (rojo) */}
      {!hasMovements ? (
        <div className="rounded-2xl bg-gray-100 p-4 text-gray-600">
          <p>Aún no tienes movimientos registrados en este mes.</p>
        </div>
      ) : (
        <div className={`rounded-2xl p-4 ${saved ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
          {saved ? (
            <p>
              Este mes ahorraste <strong>{formatMoney(monthBalance)}</strong>
              {Number(summary.total_income) > 0 && (
                <>, el <strong>{summary.savings_rate}%</strong> de tus ingresos</>
              )}
              .
            </p>
          ) : (
            <p>
              Este mes gastaste <strong>{formatMoney(Math.abs(monthBalance))}</strong> más de lo que ingresaste.
              Esa diferencia salió de tus ahorros.
            </p>
          )}
        </div>
      )}
    </div>
  );
}