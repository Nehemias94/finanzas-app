<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

// Una Policy agrupa las reglas de permisos de un modelo
// Laravel la conecta sola con Category por el nombre: Category -> CategoryPolicy
class CategoryPolicy
{
    // ¿Puede este usuario VER esta categoría?
    // Solo si el id del usuario coincide con el dueño de la categoría
    public function view(User $user, Category $category): bool
    {
        return $user->id === $category->user_id;
    }

    // ¿Puede EDITARLA? Misma regla: solo el dueño
    public function update(User $user, Category $category): bool
    {
        return $user->id === $category->user_id;
    }

    // ¿Puede BORRARLA? Solo el dueño
    public function delete(User $user, Category $category): bool
    {
        return $user->id === $category->user_id;
    }
}
