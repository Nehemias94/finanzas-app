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

// La fecha de hoy en formato "AAAA-MM-DD", según la hora de TU computadora
// Reutilizamos toMonthString para el año y el mes, y le agregamos el día
export function todayString(): string {
  const now = new Date();
  return `${toMonthString(now)}-${String(now.getDate()).padStart(2, '0')}`;
}

// Formateador de fechas cortas en español, ej: "sáb, 20 sept"
const shortDateFormatter = new Intl.DateTimeFormat('es', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

// Convierte "2026-09-20" en "sáb, 20 sept"
export function formatShortDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);

  // IMPORTANTE: creamos la fecha con new Date(año, mes, día) y NO con new Date("2026-09-20")
  // new Date("2026-09-20") interpreta el texto como medianoche en hora UTC,
  // y en tu zona horaria eso todavía es el día 19 por la noche: mostraría la fecha de ayer
  return shortDateFormatter.format(new Date(year, month - 1, day));
}

// Prepara un texto para comparar: sin tildes, en minúsculas y sin espacios en los extremos
// Así "Educación", "educacion" y " EDUCACIÓN " se consideran iguales
// (antes vivía dentro de CategoryCombobox con el nombre "normalize")
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// Formateador de meses cortos, ej: "sept 26"
const shortMonthFormatter = new Intl.DateTimeFormat('es', { month: 'short', year: '2-digit' });

// Convierte "2026-09" en "sept 26" (para las etiquetas de las gráficas, donde hay poco espacio)
export function formatMonthShort(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return shortMonthFormatter.format(new Date(year, monthNumber - 1, 1));
}