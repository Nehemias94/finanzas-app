<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    // se agrega HasApiTokens al inicio:
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'initial_balance',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            // Siempre se devuelve con 2 decimales, igual que los montos de los movimientos
            'initial_balance' => 'decimal:2',
        ];
    }

    // Relación: un usuario TIENE MUCHAS categorías
    // Permite hacer $usuario->categories para obtener solo SUS categorías
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    // Relación: un usuario TIENE MUCHOS movimientos
    // Permite hacer $usuario->transactions para obtener solo SUS movimientos
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
