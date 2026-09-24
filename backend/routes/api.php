<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use Illuminate\Support\Facades\Route;

// Todas las rutas de este archivo tienen automáticamente el prefijo /api
// Por ejemplo, '/register' en realidad es http://localhost:8000/api/register

// --- RUTAS PÚBLICAS (no necesitan token) ---

// Registro: llama al método register() del AuthController
Route::post('/register', [AuthController::class, 'register']);

// Login: throttle:5,1 permite máximo 5 intentos por minuto
// Esto protege contra ataques que prueban miles de contraseñas seguidas
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// --- RUTAS PROTEGIDAS (necesitan token) ---

// El middleware 'auth:sanctum' revisa el token ANTES de entrar a estas rutas
// Si no hay token o es inválido, responde 401 (no autorizado) y nunca llega al controlador
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // apiResource crea las 5 rutas del CRUD en una sola línea
    // (index, store, show, update, destroy)
    Route::apiResource('categories', CategoryController::class);
});
