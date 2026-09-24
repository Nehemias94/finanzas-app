<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Schema::table (y no Schema::create) modifica una tabla que YA existe
        Schema::table('users', function (Blueprint $table) {
            // Mismo tipo que los montos: decimal exacto con 2 decimales
            // default(0) hace que sea opcional: los usuarios que no lo configuren tendrán $0
            // Los usuarios que ya existen también reciben 0 automáticamente
            $table->decimal('initial_balance', 12, 2)->default(0);
        });
    }

    public function down(): void
    {
        // Para deshacer, eliminamos la columna
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('initial_balance');
        });
    }
};
