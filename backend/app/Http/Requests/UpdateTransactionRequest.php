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
        return [
            'category_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('categories', 'id')->where('user_id', $this->user()->id),
            ],
            'amount' => ['sometimes', 'required', 'numeric', 'gt:0', 'max:9999999999.99', 'decimal:0,2'],
            'date' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
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
