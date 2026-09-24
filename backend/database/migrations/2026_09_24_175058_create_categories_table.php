<?php

// Importamos las clases que Laravel necesita para crear tablas
use Illuminate\Database\Migrations\Migration; // Clase base de toda migración
use Illuminate\Database\Schema\Blueprint;     // El "plano" donde definimos las columnas
use Illuminate\Support\Facades\Schema;        // Herramienta para crear, modificar o borrar tablas

// Una migración es una clase anónima (sin nombre) que extiende de Migration
return new class extends Migration
{
    // up() se ejecuta cuando corres "php artisan migrate"
    // Aquí describimos cómo CREAR la tabla
    public function up(): void
    {
        // Crea una tabla llamada "categories"
        // $table es el plano donde vamos agregando columnas
        Schema::create('categories', function (Blueprint $table) {
            // Es la llave primaria
            $table->id();

            // Columna "user_id": guarda a qué usuario pertenece la categoría
            // constrained() la enlaza con la columna "id" de la tabla "users"
            // cascadeOnDelete() hace que si se borra el usuario, se borren sus categorías
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Columna "name": texto de máximo 100 caracteres (ej: "Ropa", "Salario")
            $table->string('name', 100);

            // Columna "type": solo acepta "income" (ingreso) o "expense" (egreso)
            // Si intentas guardar otro valor, la base de datos lo rechaza
            $table->enum('type', ['income', 'expense']);

            // Columna "color": texto de 7 caracteres para un color como "#FF5733"
            // nullable() significa que es opcional (puede quedar vacía)
            $table->string('color', 7)->nullable();

            // Crea dos columnas: "created_at" y "updated_at"
            // Laravel las llena automáticamente con la fecha de creación y de última modificación
            $table->timestamps();

            // Regla de unicidad: no puede repetirse la combinación usuario + nombre + tipo
            // Así no tienes dos "Ropa" de egreso, pero otro usuario sí puede tener su propia "Ropa"
            $table->unique(['user_id', 'name', 'type']);
        });
    }

    // down() se ejecuta cuando deshaces la migración ("php artisan migrate:rollback")
    // Debe hacer lo contrario de up(): en este caso, borrar la tabla
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
