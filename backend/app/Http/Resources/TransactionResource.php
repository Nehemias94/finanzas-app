<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            // El monto sale como texto, por ejemplo "800.00", no como número
            // Es a propósito: así se conserva exacto, sin los errores de redondeo de los decimales
            // En el frontend lo convertiremos a número solo para mostrarlo o sumarlo
            'amount' => $this->amount,

            // format('Y-m-d') devuelve la fecha limpia, ej: "2026-09-15"
            // Sin esto, saldría como "2026-09-15T00:00:00.000000Z", con hora y zona horaria,
            // y en el navegador podría mostrarse como el día 14 por la diferencia de horario
            'date' => $this->date->format('Y-m-d'),

            'description' => $this->description,

            // El tipo (income/expense) lo tomamos de la categoría
            // whenLoaded() solo lo incluye si la categoría ya fue cargada en la consulta
            'type' => $this->whenLoaded('category', fn() => $this->category->type),

            // Incluimos la categoría completa usando el Resource que hicimos en el Paso 5
            // Así el frontend puede mostrar "Ropa" con su color sin hacer otra petición
            'category' => new CategoryResource($this->whenLoaded('category')),

            'created_at' => $this->created_at,
        ];
    }
}
