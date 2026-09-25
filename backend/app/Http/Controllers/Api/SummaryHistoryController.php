<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SummaryHistoryController extends Controller
{
    /**
     * HISTORIAL MENSUAL: GET /api/summary/history?month=2026-09&months=6
     * Devuelve los totales de los últimos N meses, terminando en "month"
     */
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
            // Entre 1 y 24 meses, para que nadie pida 10,000 meses de golpe
            'months' => ['nullable', 'integer', 'min:1', 'max:24'],
        ]);

        $months = (int) $request->input('months', 6);

        // Último mes del periodo (el que se está viendo en el dashboard)
        $lastMonth = $request->input('month')
            ? Carbon::createFromFormat('Y-m-d', $request->input('month') . '-01')
            : now()->startOfMonth();

        // Primer mes del periodo. Si son 6 meses terminando en septiembre, empieza en abril
        // Partimos del día 1 ANTES de restar meses: así evitamos el error del día 31
        // (31 de marzo menos un mes daría "31 de febrero", que Carbon convierte en marzo)
        $start = $lastMonth->copy()->startOfMonth()->subMonths($months - 1);
        $end = $lastMonth->copy()->endOfMonth();

        $user = $request->user();

        // ------------------------------------------------------------
        // CONSULTA 1: lo acumulado ANTES del periodo
        // Lo necesitamos para calcular el saldo con el que empieza el primer mes
        // ------------------------------------------------------------
        $prior = DB::table('transactions')
            ->join('categories', 'categories.id', '=', 'transactions.category_id')
            ->where('transactions.user_id', $user->id)
            ->where('transactions.date', '<', $start->toDateString())
            ->selectRaw("
                COALESCE(SUM(transactions.amount) FILTER (WHERE categories.type = 'income'), 0) AS income,
                COALESCE(SUM(transactions.amount) FILTER (WHERE categories.type = 'expense'), 0) AS expense
            ")
            ->first();

        // ------------------------------------------------------------
        // CONSULTA 2: ingresos y egresos de CADA mes del periodo, en una sola consulta
        // ------------------------------------------------------------
        $rows = DB::table('transactions')
            ->join('categories', 'categories.id', '=', 'transactions.category_id')
            ->where('transactions.user_id', $user->id)
            ->whereBetween('transactions.date', [$start->toDateString(), $end->toDateString()])
            // to_char convierte la fecha en texto "2026-09": así agrupamos por mes
            ->selectRaw("
                to_char(transactions.date, 'YYYY-MM') AS month,
                COALESCE(SUM(transactions.amount) FILTER (WHERE categories.type = 'income'), 0) AS income,
                COALESCE(SUM(transactions.amount) FILTER (WHERE categories.type = 'expense'), 0) AS expense
            ")
            ->groupBy('month')
            ->get()
            // keyBy convierte la lista en un "diccionario" cuya llave es el mes
            // Así podemos buscar rápido: $rows->get('2026-09')
            ->keyBy('month');

        // ------------------------------------------------------------
        // Recorremos los meses uno por uno, en orden
        // ------------------------------------------------------------

        // Saldo con el que empieza el periodo
        $running = BigDecimal::of($user->initial_balance)
            ->plus($prior->income)
            ->minus($prior->expense);

        $money = fn(BigDecimal $value) => (string) $value->toScale(2, RoundingMode::HALF_UP);

        $history = [];
        $cursor = $start->copy();

        // lte = "less than or equal" (menor o igual): mientras no pasemos del último mes
        while ($cursor->lte($end)) {
            $key = $cursor->format('Y-m');

            // Si un mes no tiene movimientos, NO aparece en $rows
            // En ese caso usamos 0, para que el mes igual salga en la gráfica
            $row = $rows->get($key);
            $income = BigDecimal::of($row->income ?? 0);
            $expense = BigDecimal::of($row->expense ?? 0);

            $balance = $income->minus($expense);

            // El saldo se va acumulando mes a mes, como en la tabla del Paso 7
            $running = $running->plus($balance);

            $history[] = [
                'month' => $key,
                'income' => $money($income),
                'expense' => $money($expense),
                'balance' => $money($balance),
                'closing_balance' => $money($running),
            ];

            $cursor->addMonth(); // Seguro porque $cursor siempre está en el día 1
        }

        return response()->json(['data' => $history]);
    }
}
