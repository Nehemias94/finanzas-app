<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => [
                'required',
                'integer',
                // exists: la categoría debe existir en la tabla categories...
                // ...Y además pertenecer a este usuario (el where)
                // Sin el where, alguien podría enviar el id de una categoría tuya
                // y registrar un gasto "dentro" de ella
                Rule::exists('categories', 'id')->where('user_id', $this->user()->id),
            ],

            'amount' => [
                'required',
                'numeric',              // Debe ser un número
                'gt:0',                 // Mayor que 0 (no aceptamos montos negativos ni cero)
                'max:9999999999.99',    // El máximo que cabe en decimal(12, 2)
                'decimal:0,2',          // Entre 0 y 2 decimales (acepta 25, 25.5 o 25.50)
            ],

            // La fecha debe venir con formato año-mes-día, por ejemplo 2026-09-15
            'date' => ['required', 'date_format:Y-m-d'],

            'description' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_id.exists' => 'La categoría seleccionada no existe.',
            'amount.gt' => 'El monto debe ser mayor que cero.',
            'amount.decimal' => 'El monto puede tener máximo 2 decimales.',
            'date.date_format' => 'La fecha debe tener el formato AAAA-MM-DD.',
        ];
    }
}
