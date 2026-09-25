<?php

// ------------------------------------------------------------
// Importaciones: los controladores que atienden cada ruta
// ------------------------------------------------------------
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\SummaryController;
use App\Http\Controllers\Api\SummaryHistoryController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

// Todas las rutas de este archivo tienen automáticamente el prefijo /api
// Por ejemplo, '/register' en realidad es http://localhost:8000/api/register

// ============================================================
// RUTAS PÚBLICAS (no necesitan token)
// ============================================================

// Salud del servidor: responde rápido y sin consultar la base de datos
// Render la usa para saber si la app arrancó, y el frontend para "despertar" al servidor
// fn () => ... es una función flecha: una función corta en una sola línea
Route::get('/health', fn() => response()->json(['status' => 'ok']));

// Registro de cuentas nuevas
// Se puede desactivar con REGISTRATION_ENABLED=false (ver AuthController)
Route::post('/register', [AuthController::class, 'register']);

// Inicio de sesión
// throttle:5,1 permite máximo 5 intentos por minuto
// Protege contra ataques que prueban miles de contraseñas seguidas
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// ============================================================
// RUTAS PROTEGIDAS (necesitan token)
// ============================================================

// El middleware 'auth:sanctum' revisa el token ANTES de entrar a estas rutas
// Si no hay token, es inválido o expiró por inactividad, responde 401
// y la petición nunca llega al controlador
Route::middleware('auth:sanctum')->group(function () {

    // --- Sesión y perfil ---

    // Cerrar sesión: borra el token con el que se hizo la petición
    Route::post('/logout', [AuthController::class, 'logout']);

    // Datos del usuario actual ("¿quién soy?")
    Route::get('/me', [AuthController::class, 'me']);

    // Editar nombre y saldo inicial (página de Configuración)
    Route::patch('/me', [AuthController::class, 'updateMe']);

    // --- Categorías y movimientos ---

    // apiResource crea las 5 rutas del CRUD en una sola línea:
    // GET /categories, POST /categories, GET /categories/{id},
    // PATCH /categories/{id} y DELETE /categories/{id}
    Route::apiResource('categories', CategoryController::class);

    // Las mismas 5 rutas para los movimientos (ingresos y egresos)
    // Acepta filtros: ?month=2026-09, ?type=expense, ?category_id=3, ?per_page=5
    Route::apiResource('transactions', TransactionController::class);

    // --- Resúmenes ---

    // Resumen de un mes: tarjetas, donas y desglose por categoría
    // Ejemplo: GET /summary?month=2026-09
    // Los controladores invocables (con un solo método) se registran sin indicar el método
    Route::get('/summary', SummaryController::class);

    // Historial de varios meses: gráfica de barras y línea del saldo
    // Ejemplo: GET /summary/history?month=2026-09&months=6
    Route::get('/summary/history', SummaryHistoryController::class);
});
