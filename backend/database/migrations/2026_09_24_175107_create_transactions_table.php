<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Crea la tabla "transactions" (movimientos: ingresos y gastos)
        Schema::create('transactions', function (Blueprint $table) {

            // Llave primaria autoincremental
            $table->id();

            // A qué usuario pertenece el movimiento
            // Si se borra el usuario, se borran también sus movimientos
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // A qué categoría pertenece el movimiento (ej: "Ropa")
            // restrictOnDelete() IMPIDE borrar una categoría que tenga movimientos
            // Así no pierdes tu historial por accidente
            $table->foreignId('category_id')->constrained()->restrictOnDelete();

            // Monto del movimiento
            // decimal(12, 2) = hasta 12 dígitos en total, 2 de ellos decimales
            // Ejemplo: 9999999999.99 es el máximo
            // Usamos decimal y no float porque float guarda números aproximados,
            // y con dinero necesitamos exactitud
            $table->decimal('amount', 12, 2);

            // Fecha en que ocurrió el movimiento (solo fecha, sin hora)
            // Puede ser distinta de created_at: por ejemplo, registras hoy un gasto de ayer
            $table->date('date');

            // Descripción opcional (ej: "Camisa en el centro comercial")
            $table->string('description', 255)->nullable();

            // created_at y updated_at automáticos
            $table->timestamps();

            // Índice para acelerar búsquedas por usuario y fecha
            // Como casi siempre buscaremos "movimientos de este usuario en este mes",
            // el índice funciona como el índice de un libro: encuentra rápido sin revisar todo
            $table->index(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        // Deshace la migración borrando la tabla
        Schema::dropIfExists('transactions');
    }
};
