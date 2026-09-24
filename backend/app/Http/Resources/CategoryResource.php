<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// Un Resource transforma un modelo en el JSON que enviamos al frontend
// Así decidimos exactamente qué campos salen y con qué nombres
class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'color' => $this->color,

            // whenCounted() solo incluye este campo si en la consulta pedimos contar los movimientos
            // Si no lo pedimos, el campo simplemente no aparece
            // El frontend lo usará para saber si una categoría se puede borrar
            'transactions_count' => $this->whenCounted('transactions'),

            'created_at' => $this->created_at,

            // Fíjate que user_id NO lo enviamos: el frontend no lo necesita
        ];
    }
}
