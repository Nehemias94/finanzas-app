// Una "interface" de TypeScript describe la forma de un objeto
// Así el editor te avisa si escribes mal un campo o usas un tipo incorrecto

// Forma del usuario tal como lo devuelve Laravel
export interface User {
  id: number;
  name: string;
  email: string;
  initial_balance: string; // Viene como texto, ej: "300.00" (por la exactitud del decimal)
  created_at: string;
  updated_at: string;
}

// Lo que responden /register y /login
export interface AuthResponse {
  user: User;
  token: string;
}

// Errores de validación de Laravel (código 422)
// Record<string, string[]> significa: un objeto cuyas llaves son texto
// y cuyos valores son listas de texto. Ejemplo:
// { email: ["Ya tienes una cuenta"], password: ["Mínimo 8 caracteres"] }
export type ValidationErrors = Record<string, string[]>;

// Una categoría dentro del desglose del resumen
export interface CategoryBreakdown {
  id: number;
  name: string;
  color: string | null; // Puede no tener color
  total: string;        // Texto, ej: "180.00"
  count: number;        // Cuántos movimientos tiene en el mes
  percentage: number;   // Porcentaje del total, ej: 56.2
}

// Lo que responde GET /api/summary (igual a lo que armamos en el Paso 7)
export interface Summary {
  month: string;            // ej: "2026-09"
  initial_balance: string;
  opening_balance: string;  // Saldo con el que empieza el mes
  total_income: string;
  total_expense: string;
  month_balance: string;    // Ingresos - egresos del mes
  closing_balance: string;  // Saldo con el que termina el mes
  savings_rate: number;     // % de los ingresos que se ahorró
  expenses_by_category: CategoryBreakdown[]; // [] significa "lista de"
  income_by_category: CategoryBreakdown[];
}

// Los dos tipos posibles de movimiento y categoría
export type TransactionType = 'income' | 'expense';

// Una categoría, tal como la devuelve CategoryResource
export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  color: string | null;
  transactions_count?: number; // El ? indica que no siempre viene
  created_at: string;
}

// Un movimiento, tal como lo devuelve TransactionResource
export interface Transaction {
  id: number;
  amount: string;
  date: string;
  description: string | null;
  type: TransactionType;
  category: Category;
  created_at: string;
}

// Los Resources de Laravel envuelven la respuesta en una llave "data"
// <T> es un genérico: ApiResource<Category> significa { data: Category }
// y ApiResource<Category[]> significa { data: Category[] }
export interface ApiResource<T> {
  data: T;
}