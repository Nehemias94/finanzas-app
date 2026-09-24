<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Obtenemos la categoría que se está editando (viene de la URL: /categories/{category})
        $category = $this->route('category');

        return [
            'name' => [
                // "sometimes" = valida este campo SOLO si viene en la petición
                // Así puedes editar solo el color sin tener que enviar el nombre
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('categories')
                    ->where(
                        fn($query) => $query
                            ->where('user_id', $this->user()->id)
                            ->where('type', $category->type)
                    )
                    // ignore() excluye la categoría actual de la revisión
                    // Si no, al guardar "Ropa" sin cambiar el nombre, diría que "Ropa" ya existe
                    ->ignore($category->id),
            ],

            'color' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],

            // Fíjate que "type" NO está aquí: el tipo no se puede cambiar después de crear la categoría
            // Si "Ropa" pasara de egreso a ingreso, todos tus gastos pasados se volverían ingresos
            // y tus resúmenes de meses anteriores quedarían mal
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'Ya tienes una categoría con ese nombre.',
            'color.regex' => 'El color debe tener el formato #RRGGBB.',
        ];
    }
}
