<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest; // Clase base de las validaciones
use Illuminate\Validation\Rule;             // Para reglas más avanzadas (unique, in)

class StoreCategoryRequest extends FormRequest
{
    // authorize() decide si el usuario puede hacer esta petición
    // Devolvemos true porque el middleware auth:sanctum ya verificó que tiene sesión
    public function authorize(): bool
    {
        return true;
    }

    // rules() define las reglas de validación
    // Si alguna falla, Laravel responde 422 automáticamente y el controlador nunca se ejecuta
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:100',
                // El nombre debe ser único, pero SOLO entre las categorías de este usuario y de este tipo
                // Sin el where(), si otro usuario tuviera "Ropa", tú no podrías crear la tuya
                Rule::unique('categories')->where(
                    fn($query) => $query
                        ->where('user_id', $this->user()->id)
                        ->where('type', $this->input('type'))
                ),
            ],

            // Solo se permiten estos dos valores
            'type' => ['required', Rule::in(['income', 'expense'])],

            // Opcional, pero si llega debe tener formato #RRGGBB (ej: #FF5733)
            // La expresión regular revisa: un "#" seguido de exactamente 6 caracteres hexadecimales
            'color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }

    // messages() personaliza los mensajes de error (por defecto vienen en inglés)
    public function messages(): array
    {
        return [
            'name.unique' => 'Ya tienes una categoría con ese nombre.',
            'color.regex' => 'El color debe tener el formato #RRGGBB.',
        ];
    }
}
