<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate; // Gate es lo que ejecuta las policies
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /**
     * LISTAR: GET /api/categories
     * Filtros opcionales: ?type=expense  ?search=rop
     */
    public function index(Request $request)
    {
        // Validamos los filtros para que nadie envíe valores raros
        $request->validate([
            'type' => ['nullable', Rule::in(['income', 'expense'])],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        // $request->user()->categories() trae SOLO las categorías del usuario del token
        // Esta es la base de la privacidad: nunca consultamos Category::all()
        $categories = $request->user()->categories()
            // when() aplica el filtro SOLO si el parámetro llegó en la URL
            ->when($request->input('type'), fn($query, $type) => $query->where('type', $type))

            // ilike es una búsqueda de PostgreSQL que ignora mayúsculas y minúsculas
            // Los % significan "cualquier texto antes o después"
            // Así "rop" encuentra "Ropa", "Compra de ropa", "ROPA DEPORTIVA"...
            ->when($request->input('search'), fn($query, $search) => $query->where('name', 'ilike', "%{$search}%"))

            // Cuenta cuántos movimientos tiene cada categoría (en una sola consulta)
            ->withCount('transactions')

            // Orden alfabético
            ->orderBy('name')
            ->get();

        // collection() aplica el Resource a cada categoría de la lista
        return CategoryResource::collection($categories);
    }

    /**
     * CREAR: POST /api/categories
     * Al recibir StoreCategoryRequest, Laravel valida ANTES de entrar aquí
     */
    public function store(StoreCategoryRequest $request)
    {
        // validated() devuelve SOLO los campos que pasaron la validación
        // Creamos a través de la relación, así user_id se asigna solo con el usuario del token
        $category = $request->user()->categories()->create($request->validated());

        // Respondemos con código 201 (creado)
        return (new CategoryResource($category))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * MOSTRAR: GET /api/categories/{category}
     * "Category $category" hace que Laravel busque la categoría por el id de la URL
     * Esto se llama Route Model Binding. Si el id no existe, responde 404 solo
     */
    public function show(Category $category)
    {
        // Ejecuta el método view() de CategoryPolicy
        // Si devuelve false, responde 403 y no sigue
        Gate::authorize('view', $category);

        // loadCount() agrega el conteo de movimientos a una categoría ya cargada
        return new CategoryResource($category->loadCount('transactions'));
    }

    /**
     * EDITAR: PATCH /api/categories/{category}
     */
    public function update(UpdateCategoryRequest $request, Category $category)
    {
        Gate::authorize('update', $category);

        // Actualiza solo los campos validados (name y/o color)
        $category->update($request->validated());

        return new CategoryResource($category);
    }

    /**
     * BORRAR: DELETE /api/categories/{category}
     */
    public function destroy(Category $category)
    {
        Gate::authorize('delete', $category);

        // Si la categoría tiene movimientos, no se puede borrar
        // La base de datos ya lo impediría (restrictOnDelete), pero daría un error feo 500
        // Así que lo revisamos antes y respondemos con un mensaje claro
        // 409 significa "Conflicto": la petición choca con el estado actual de los datos
        if ($category->transactions()->exists()) {
            return response()->json([
                'message' => 'No puedes eliminar esta categoría porque tiene movimientos registrados.',
            ], 409);
        }

        $category->delete();

        // 204 = "sin contenido": se borró bien y no hay nada que devolver
        return response()->noContent();
    }
}
