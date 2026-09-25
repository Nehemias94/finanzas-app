// Colores que se ofrecen para las categorías
// Antes vivían dentro de CategoryCombobox; ahora los comparten varios componentes
export const COLOR_PALETTE = [
  '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6',
  '#1ABC9C', '#E67E22', '#34495E', '#EC407A', '#8D6E63',
];

// Color para las categorías que no tienen uno asignado
export const DEFAULT_COLOR = '#9CA3AF';

// Sugiere un color para una categoría nueva
// Los gastos empiezan en el rojo (posición 0) y los ingresos en el verde (posición 2)
// "existingCount" es cuántas categorías de ese tipo ya existen, para ir rotando colores
export function suggestColor(type: 'income' | 'expense', existingCount: number): string {
  const offset = type === 'income' ? 2 : 0;
  return COLOR_PALETTE[(existingCount + offset) % COLOR_PALETTE.length];
}