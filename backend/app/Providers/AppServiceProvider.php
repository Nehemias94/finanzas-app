<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\PersonalAccessToken; // El modelo de los tokens de Sanctum
use Laravel\Sanctum\Sanctum;

// Los Service Providers configuran la aplicación al arrancar
// boot() se ejecuta en cada petición, antes de llegar a las rutas
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Le agregamos a Sanctum una regla extra para decidir si un token es válido
        // Sanctum llama a esta función cada vez que alguien usa un token
        Sanctum::authenticateAccessTokensUsing(function (PersonalAccessToken $token, bool $isValid) {
            // $isValid indica si el token pasó las revisiones normales de Sanctum
            // Si ya es inválido, no hay nada más que revisar
            if (! $isValid) {
                return false;
            }

            // Última vez que se usó el token
            // Si nunca se ha usado (recién creado), tomamos su fecha de creación
            $lastActivity = $token->last_used_at ?? $token->created_at;

            // El token solo es válido si se usó dentro de los últimos 30 minutos
            // gt() significa "greater than" (mayor que): ¿la última actividad es más reciente
            // que "ahora menos 30 minutos"?
            return $lastActivity->gt(now()->subMinutes(config('sanctum.idle_timeout')));
        });
    }
}
