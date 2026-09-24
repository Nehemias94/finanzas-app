<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Brick\Math\BigDecimal;          // Números decimales exactos
use Brick\Math\RoundingMode;        // Cómo redondear (ej: hacia arriba desde .5)
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;  // Query Builder: consultas más directas que Eloquent

class SummaryController extends Controller
{
    /**
     * RESUMEN MENSUAL: GET /api/summary?month=2026-09
     * __invoke() es el único método: se ejecuta al llamar la ruta
     */
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
        ]);

        // Mismo cálculo del mes que en TransactionController (con el "-01" para evitar el error del día 30)
        $month = $request->input('month')
            ? Carbon::createFromFormat('Y-m-d', $request->input('month') . '-01')
            : now();

        $start = $month->copy()->startOfMonth()->toDateString(); // ej: 2026-09-01
        $end = $month->copy()->endOfMonth()->toDateString();     // ej: 2026-09-30

        $user = $request->user();

        // ------------------------------------------------------------
        // CONSULTA 1: los cuatro totales en UNA sola consulta
        // ------------------------------------------------------------
        $totals = DB::table('transactions')
            // join une cada movimiento con su categoría, para saber si es ingreso o egreso
            ->join('categories', 'categories.id', '=', 'transactions.category_id')

            // Solo los movimientos de este usuario (la base de la privacidad)
            ->where('transactions.user_id', $user->id)

            // Solo hasta el último día del mes: lo posterior no afecta este resumen
            ->where('transactions.date', '<=', $end)

            // selectRaw permite escribir SQL directamente
            // SUM(...) FILTER (WHERE ...) es una función de PostgreSQL:
            // suma SOLO las filas que cumplen la condición del FILTER
            // COALESCE(..., 0) devuelve 0 si no hay filas (en vez de null)
            // Los ? se reemplazan de forma segura por los valores del arreglo (evita inyección SQL)
            ->selectRaw("
                COALESCE(SUM(transactions.amount) FILTER (WHERE categories.type = 'income'  AND transactions.date < ?), 0) AS prev_income,
                COALESCE(SUM(transactions.amount) FILTER (WHERE categories.type = 'expense' AND transactions.date < ?), 0) AS prev_expense,
                COALESCE(SUM(transactions.amount) FILTER (WHERE categories.type = 'income'  AND transactions.date >= ?), 0) AS month_income,
                COALESCE(SUM(transactions.amount) FILTER (WHERE categories.type = 'expense' AND transactions.date >= ?), 0) AS month_expense
            ", [$start, $start, $start, $start])
            ->first(); // first() porque el resultado es una sola fila

        // ------------------------------------------------------------
        // CÁLCULO DE SALDOS con BigDecimal (exacto)
        // ------------------------------------------------------------

        // BigDecimal::of() convierte un texto como "300.00" en un número exacto
        $initialBalance = BigDecimal::of($user->initial_balance);
        $monthIncome = BigDecimal::of($totals->month_income);
        $monthExpense = BigDecimal::of($totals->month_expense);

        // Saldo inicial del mes = saldo inicial del usuario
        //                       + ingresos de meses anteriores
        //                       - egresos de meses anteriores
        $openingBalance = $initialBalance
            ->plus($totals->prev_income)
            ->minus($totals->prev_expense);

        // Balance del mes = ingresos del mes - egresos del mes (puede ser negativo)
        $monthBalance = $monthIncome->minus($monthExpense);

        // Saldo final = saldo inicial + balance del mes
        // Este será el saldo inicial del mes siguiente
        $closingBalance = $openingBalance->plus($monthBalance);

        // ------------------------------------------------------------
        // CONSULTA 2: totales agrupados por categoría (solo este mes)
        // ------------------------------------------------------------
        $byCategory = DB::table('transactions')
            ->join('categories', 'categories.id', '=', 'transactions.category_id')
            ->where('transactions.user_id', $user->id)
            ->whereBetween('transactions.date', [$start, $end])

            // groupBy junta todos los movimientos de una misma categoría en una fila
            ->groupBy('categories.id', 'categories.name', 'categories.color', 'categories.type')

            // Por cada categoría: sus datos, la suma de sus montos y cuántos movimientos tiene
            ->selectRaw('categories.id, categories.name, categories.color, categories.type, SUM(transactions.amount) AS total, COUNT(*) AS count')

            // De mayor a menor: así ves primero en qué gastaste más
            ->orderByDesc('total')
            ->get();

        // Función auxiliar para calcular porcentajes: (parte * 100) / total
        // Devuelve 0 si el total es 0, para no dividir entre cero
        $percentage = function (BigDecimal|string $part, BigDecimal $whole): float {
            if ($whole->isZero()) {
                return 0.0;
            }

            // dividedBy(valor, 1 decimal, redondeo normal)
            return BigDecimal::of($part)
                ->multipliedBy(100)
                ->dividedBy($whole, 1, RoundingMode::HALF_UP)
                ->toFloat();
        };

        // Función auxiliar para dar forma a cada categoría del desglose
        // $whole es el total contra el que se calcula el porcentaje
        $formatCategory = fn($row, BigDecimal $whole) => [
            'id' => $row->id,
            'name' => $row->name,
            'color' => $row->color,
            'total' => (string) BigDecimal::of($row->total)->toScale(2, RoundingMode::HALF_UP),
            'count' => (int) $row->count,
            'percentage' => $percentage($row->total, $whole),
        ];

        // Separamos las categorías en egresos e ingresos
        // where() aquí filtra la colección en PHP (ya no es una consulta a la base de datos)
        // values() reordena los índices del arreglo (0, 1, 2...) después de filtrar
        $expensesByCategory = $byCategory
            ->where('type', 'expense')
            ->values()
            ->map(fn($row) => $formatCategory($row, $monthExpense));

        $incomeByCategory = $byCategory
            ->where('type', 'income')
            ->values()
            ->map(fn($row) => $formatCategory($row, $monthIncome));

        // Función auxiliar para convertir un BigDecimal en texto con 2 decimales, ej: "629.50"
        $money = fn(BigDecimal $value) => (string) $value->toScale(2, RoundingMode::HALF_UP);

        return response()->json([
            'month' => $month->format('Y-m'),
            'initial_balance' => $money($initialBalance),
            'opening_balance' => $money($openingBalance),
            'total_income' => $money($monthIncome),
            'total_expense' => $money($monthExpense),
            'month_balance' => $money($monthBalance),
            'closing_balance' => $money($closingBalance),

            // Porcentaje de tus ingresos que ahorraste este mes
            'savings_rate' => $percentage($monthBalance, $monthIncome),

            'expenses_by_category' => $expensesByCategory,
            'income_by_category' => $incomeByCategory,
        ]);
    }
}
