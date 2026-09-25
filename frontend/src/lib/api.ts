
import { getToken, removeToken, setLogoutReason } from './token';
import type { ValidationErrors } from './types';

// Leemos la URL de la API desde .env.local
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Clase de error personalizada para los errores de la API
// Extiende la clase Error normal y le agrega el código HTTP y los errores de validación
export class ApiError extends Error {
  status: number;
  errors: ValidationErrors;

  constructor(status: number, message: string, errors: ValidationErrors = {}) {
    super(message); // Llama al constructor de Error con el mensaje
    this.status = status;
    this.errors = errors;
  }
}

// Función genérica para hablar con la API
// <T> es un "genérico": quien la llama indica qué tipo de dato espera recibir
// Ejemplo: apiFetch<User>('/me') devuelve una Promise<User>
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  // Armamos los encabezados, conservando los que vengan en options
  const headers = new Headers(options.headers);

  // Siempre pedimos JSON (recuerda el error "Route [login] not defined" sin esto)
  headers.set('Accept', 'application/json');

  // Si enviamos datos en el cuerpo, avisamos que van en JSON
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Si hay token, lo agregamos con el formato que espera Sanctum
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  // ===== CAMBIO: fetch con tiempo límite =====
  try {
    // fetch es la función del navegador para hacer peticiones HTTP
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      // AbortSignal.timeout cancela la petición si tarda más de 15 segundos
      // (15000 milisegundos). Sin esto, fetch podría esperar para siempre
      // Si quien llama ya envió su propio signal, respetamos ese
      signal: options.signal ?? AbortSignal.timeout(15000),
    });
  } catch (err) {
    // Si se canceló por el tiempo límite, el error se llama "TimeoutError"
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new ApiError(0, 'El servidor tardó demasiado en responder. Intenta de nuevo.');
    }

    // Cualquier otro fallo de conexión (servidor apagado, sin internet, CORS)
    throw new ApiError(0, 'No se pudo conectar con el servidor. ¿Está encendido Laravel?');
  }
  // ===== FIN DEL CAMBIO =====

  // 401 con token = el token ya no es válido (expiró o lo borraron)
  // Lo eliminamos y mandamos al usuario al login
  if (response.status === 401 && token) {
    removeToken();
    setLogoutReason('expired'); // <-- para que el login muestre el mensaje
    window.location.href = '/login';
    throw new ApiError(401, 'Tu sesión expiró. Inicia sesión de nuevo.');
  }

  // 204 = sin contenido (ej: al borrar). No hay JSON que leer
  if (response.status === 204) {
    return undefined as T;
  }

  // Convertimos la respuesta a objeto. Si no es JSON válido, queda en null
  const data = await response.json().catch(() => null);

  // response.ok es true para los códigos 200 a 299
  if (!response.ok) {
    // ?. (optional chaining): si data es null, no falla, devuelve undefined
    // ?? (nullish coalescing): si lo de la izquierda es null/undefined, usa lo de la derecha
    throw new ApiError(
      response.status,
      data?.message ?? 'Ocurrió un error inesperado.',
      data?.errors ?? {},
    );
  }

  return data as T;
}