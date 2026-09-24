<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon; // Librería para trabajar con fechas
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    /**
     * LISTAR: GET /api/transactions
     * Filtros opcionales: ?month=2026-09  ?type=expense  ?category_id=3  ?page=2
     */
    public function index(Request $request)
    {
        $request->validate([
            // date_format:Y-m exige el formato año-mes, ej: 2026-09
            'month' => ['nullable', 'date_format:Y-m'],
            'type' => ['nullable', Rule::in(['income', 'expense'])],
            'category_id' => ['nullable', 'integer'],
        ]);

        // Si enviaron un mes, lo usamos; si no, usamos el mes actual
        // Le agregamos "-01" para crear la fecha con el día 1 del mes
        // (Si no fijamos el día, Carbon usaría el día de hoy, y en un día 30
        // pedir febrero daría "30 de febrero", ¡que Carbon convierte en marzo!)
        $month = $request->input('month')
            ? Carbon::createFromFormat('Y-m-d', $request->input('month') . '-01')
            : now();

        // Primer y último día del mes, ej: 2026-09-01 y 2026-09-30
        // copy() crea una copia para no modificar la fecha original
        $start = $month->copy()->startOfMonth()->toDateString();
        $end = $month->copy()->endOfMonth()->toDateString();

        $transactions = $request->user()->transactions()
            // with('category') carga las categorías de TODOS los movimientos en una sola consulta
            // (ver la explicación del problema N+1 más abajo)
            ->with('category')

            // Solo los movimientos cuya fecha esté entre el primer y el último día del mes
            ->whereBetween('date', [$start, $end])

            // whereHas filtra por un dato de OTRA tabla: la categoría debe ser del tipo pedido
            ->when($request->input('type'), fn($query, $type) => $query->whereHas(
                'category',
                fn($categoryQuery) => $categoryQuery->where('type', $type)
            ))

            // Filtrar por una categoría específica
            // No necesitamos verificar que sea del usuario: la consulta ya parte de SUS movimientos
            ->when($request->input('category_id'), fn($query, $categoryId) => $query->where('category_id', $categoryId))

            // Los más recientes primero; si dos tienen la misma fecha, el último registrado primero
            ->orderByDesc('date')
            ->orderByDesc('id')

            // paginate(50) devuelve 50 movimientos por página
            // withQueryString() mantiene los filtros (?month=...) en los enlaces a otras páginas
            ->paginate(50)
            ->withQueryString();

        return TransactionResource::collection($transactions);
    }

    /**
     * CREAR: POST /api/transactions
     */
    public function store(StoreTransactionRequest $request)
    {
        // Creamos a través de la relación: user_id se asigna solo
        $transaction = $request->user()->transactions()->create($request->validated());

        // load('category') carga la categoría para incluirla en la respuesta
        return (new TransactionResource($transaction->load('category')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * MOSTRAR: GET /api/transactions/{transaction}
     */
    public function show(Transaction $transaction)
    {
        Gate::authorize('view', $transaction);

        return new TransactionResource($transaction->load('category'));
    }

    /**
     * EDITAR: PATCH /api/transactions/{transaction}
     */
    public function update(UpdateTransactionRequest $request, Transaction $transaction)
    {
        Gate::authorize('update', $transaction);

        $transaction->update($request->validated());

        return new TransactionResource($transaction->load('category'));
    }

    /**
     * BORRAR: DELETE /api/transactions/{transaction}
     */
    public function destroy(Transaction $transaction)
    {
        Gate::authorize('delete', $transaction);

        $transaction->delete();

        return response()->noContent();
    }
}
