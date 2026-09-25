<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    // Mismas reglas que al crear, pero con "sometimes"
    // para poder editar solo un campo (por ejemplo, corregir solo el monto)
    public function rules(): array
    {
        // El movimiento que se está editando (viene de la URL: /transactions/{transaction})
        $transaction = $this->route('transaction');

        return [
            'category_id' => [
                'sometimes',
                'required',
                'integer',
                // La nueva categoría debe:
                // 1. Pertenecer a este usuario
                // 2. Ser del MISMO tipo que la categoría actual del movimiento
                //    (un gasto solo puede pasar a otra categoría de gasto)
                Rule::exists('categories', 'id')
                    ->where('user_id', $this->user()->id)
                    ->where('type', $transaction->category->type),
            ],
            'amount' => ['sometimes', 'required', 'numeric', 'gt:0', 'max:9999999999.99', 'decimal:0,2'],
            'date' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_id.exists' => 'Selecciona una categoría válida del mismo tipo que el movimiento.',
            'amount.gt' => 'El monto debe ser mayor que cero.',
            'amount.decimal' => 'El monto puede tener máximo 2 decimales.',
            'date.date_format' => 'La fecha debe tener el formato AAAA-MM-DD.',
        ];
    }
}
