// Moneda que usa la app. Si algún día usas otra, cambias solo esta línea
const CURRENCY = 'USD';

// Intl es una herramienta incluida en JavaScript para formatear según el idioma y la región
// Lo creamos UNA vez afuera de las funciones para reutilizarlo (crearlo es costoso)
const moneyFormatter = new Intl.NumberFormat('es-US', {
  style: 'currency',
  currency: CURRENCY,
});

// Convierte "1079.5" en "$1,079.50"
// Recibe string porque así llegan los montos desde Laravel
// Number() lo convierte a número solo para MOSTRARLO; los cálculos los hace el backend
export function formatMoney(amount: string | number): string {
  return moneyFormatter.format(Number(amount));
}

// Convierte una fecha en texto "AAAA-MM", ej: "2026-09"
// padStart(2, '0') agrega un cero a la izquierda si hace falta: "9" -> "09"
// getMonth() devuelve los meses de 0 a 11, por eso le sumamos 1
function toMonthString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// El mes actual, ej: "2026-09"
export function currentMonth(): string {
  return toMonthString(new Date());
}

// Mueve un mes hacia adelante o hacia atrás
// shiftMonth("2026-01", -1) devuelve "2025-12"
export function shiftMonth(month: string, delta: number): string {
  // split('-') separa "2026-09" en ["2026", "09"], y map(Number) los convierte a números
  const [year, monthNumber] = month.split('-').map(Number);

  // new Date(año, mes, día) maneja solo los cambios de año:
  // si el mes queda en -1, JavaScript lo convierte en diciembre del año anterior
  return toMonthString(new Date(year, monthNumber - 1 + delta, 1));
}

// Convierte "2026-09" en "Septiembre de 2026"
export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);

  const label = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' })
    .format(new Date(year, monthNumber - 1, 1));

  // En español los meses van en minúscula ("septiembre de 2026")
  // Ponemos en mayúscula solo la primera letra para usarlo como título
  return label.charAt(0).toUpperCase() + label.slice(1);
}