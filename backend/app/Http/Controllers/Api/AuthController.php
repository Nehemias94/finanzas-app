<?php

// Dirección de la clase: está en la carpeta Controllers/Api
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;          // Controlador base de Laravel
use App\Models\User;                          // Nuestro modelo de usuario
use Illuminate\Http\JsonResponse;             // Tipo de respuesta en formato JSON
use Illuminate\Http\Request;                  // Representa la petición que llega
use Illuminate\Support\Facades\Hash;          // Herramienta para comparar contraseñas cifradas
use Illuminate\Validation\ValidationException; // Para lanzar errores de validación

class AuthController extends Controller
{
    /**
     * REGISTRO: crea un usuario nuevo y le devuelve un token.
     * Ruta: POST /api/register
     */
    public function register(Request $request): JsonResponse
    {
        // validate() revisa los datos que llegaron
        // Si algo no cumple las reglas, Laravel detiene todo aquí
        // y responde automáticamente con un error 422 explicando qué falló
        $data = $request->validate([
            // Obligatorio, texto, máximo 100 caracteres
            'name' => ['required', 'string', 'max:100'],

            // Obligatorio, con formato de correo, y que no exista ya en la tabla users
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],

            // Obligatorio, mínimo 8 caracteres
            // "confirmed" exige que también llegue "password_confirmation" con el mismo valor
            'password' => ['required', 'string', 'min:8', 'confirmed'],

            // Opcional: nombre del dispositivo (ej: "web", "android")
            // Nos servirá cuando tengamos la app de Flutter
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        // Crea el usuario en la base de datos
        // La contraseña se cifra sola gracias al cast 'hashed' del modelo
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        // Crea un token para este usuario
        // El texto entre paréntesis es el nombre del token (el dispositivo)
        // "?? 'web'" significa: si no enviaron device_name, usa "web"
        // plainTextToken es el token legible: solo se puede ver UNA vez, en este momento
        $token = $user->createToken($data['device_name'] ?? 'web')->plainTextToken;

        // Responde con el usuario y su token
        // El 201 es el código HTTP que significa "creado correctamente"
        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * LOGIN: verifica correo y contraseña, y devuelve un token.
     * Ruta: POST /api/login
     */
    public function login(Request $request): JsonResponse
    {
        // Validamos que lleguen los datos necesarios
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        // Busca el primer usuario con ese correo
        // Si no existe, $user queda en null
        $user = User::where('email', $data['email'])->first();

        // Si no existe el usuario, O si la contraseña no coincide, rechazamos
        // Hash::check compara la contraseña escrita con la cifrada en la base de datos
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            // Usamos el MISMO mensaje en ambos casos a propósito:
            // si dijéramos "ese correo no existe", un atacante sabría qué correos están registrados
            throw ValidationException::withMessages([
                'email' => ['El correo o la contraseña son incorrectos.'],
            ]);
        }

        // Si todo está bien, creamos un token nuevo
        $token = $user->createToken($data['device_name'] ?? 'web')->plainTextToken;

        // Respondemos con el usuario y el token (200 = OK, es el valor por defecto)
        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * LOGOUT: borra el token con el que se hizo esta petición.
     * Ruta: POST /api/logout (requiere token)
     */
    public function logout(Request $request): JsonResponse
    {
        // $request->user() es el usuario dueño del token enviado
        // currentAccessToken() es justamente ESE token
        // delete() lo borra de la base de datos, así que deja de funcionar
        // Solo cierra la sesión de este dispositivo; si tienes sesión en Flutter, esa sigue activa
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }

    /**
     * ME: devuelve los datos del usuario que está autenticado.
     * Ruta: GET /api/me (requiere token)
     * El frontend la usará para saber "¿quién soy?" y si el token sigue siendo válido
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
