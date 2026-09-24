<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Conectado a la tabla "transactions"
class Transaction extends Model
{
    // Columnas que se pueden llenar de golpe
    // Otra vez, "user_id" queda fuera por seguridad
    protected $fillable = ['category_id', 'amount', 'date', 'description'];

    // casts() convierte automáticamente los valores al leerlos de la base de datos
    protected function casts(): array
    {
        return [
            // "amount" siempre se devuelve con 2 decimales (ej: "25.50")
            'amount' => 'decimal:2',

            // "date" se convierte en un objeto de fecha (Carbon)
            // Así puedes hacer cosas como $movimiento->date->format('d/m/Y')
            'date' => 'date',
        ];
    }

    // Relación: un movimiento PERTENECE A un usuario
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Relación: un movimiento PERTENECE A una categoría
    // Permite hacer $movimiento->category->name para saber si fue "Ropa", "Comida", etc.
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
