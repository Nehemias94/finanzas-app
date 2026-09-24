<?php

// El namespace es como la "dirección" de esta clase dentro del proyecto
namespace App\Models;

use Illuminate\Database\Eloquent\Model;                 // Clase base de todos los modelos
use Illuminate\Database\Eloquent\Relations\BelongsTo;   // Tipo de relación "pertenece a"
use Illuminate\Database\Eloquent\Relations\HasMany;     // Tipo de relación "tiene muchos"

// Al extender de Model, esta clase queda conectada a la tabla "categories"
// Laravel deduce el nombre de la tabla: Category (singular) -> categories (plural)
class Category extends Model
{
    // Columnas que se pueden llenar de golpe con create() o update()
    // Por seguridad, "user_id" NO está aquí: siempre lo asignará Laravel
    // a partir del usuario autenticado, nunca lo que envíe el navegador
    protected $fillable = ['name', 'type', 'color'];

    // Relación: una categoría PERTENECE A un usuario
    // Permite hacer $categoria->user para obtener su dueño
    // Laravel usa la columna "user_id" para encontrarlo
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Relación: una categoría TIENE MUCHOS movimientos
    // Permite hacer $categoria->transactions para obtener todos sus gastos o ingresos
    // Laravel busca en "transactions" las filas con category_id igual al id de esta categoría
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
