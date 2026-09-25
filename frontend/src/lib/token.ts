// Nombre de la "llave" con la que guardamos el token en localStorage
const TOKEN_KEY = 'finanzas_token';
const ACTIVITY_KEY = 'finanzas_last_activity'; // Momento de la última actividad del usuario
const REASON_KEY = 'finanzas_logout_reason';    // Por qué se cerró la sesión

// Minutos de inactividad permitidos. Debe ser MENOR que 'idle_timeout' de Laravel
export const IDLE_TIMEOUT_MINUTES = 5;
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

// Cuántos segundos antes del cierre se muestra el aviso
export const IDLE_WARNING_SECONDS = 30;

// Motivos posibles de cierre de sesión (TypeScript solo permite estos dos textos)
export type LogoutReason = 'inactivity' | 'expired';

// Lee el token guardado. Devuelve null si no hay
export function getToken(): string | null {
  // Next también ejecuta código en el servidor, donde NO existe localStorage
  // typeof window === 'undefined' significa "estamos en el servidor"
  if (typeof window === 'undefined') return null;

  // try/catch porque algunos navegadores bloquean localStorage (ej: modo privado estricto)
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Guarda el token (se usa después del login o registro)
export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    setLastActivity(); // Al iniciar sesión, cuenta como actividad
  } catch {
    // Si falla, no hacemos nada: la sesión simplemente no se recordará
  }
}

// Borra el token (se usa al cerrar sesión)
export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACTIVITY_KEY); // Sin sesión, no hay actividad que recordar
  } catch {
    // Nada que hacer
  }
}

// ----- ACTIVIDAD -----

// Guarda el momento actual como la última actividad
// Date.now() devuelve los milisegundos transcurridos desde 1970: sirve para comparar fechas fácilmente
export function setLastActivity(): void {
  try {
    localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
  } catch {
    // Nada que hacer
  }
}

// Milisegundos que faltan para que la sesión se cierre por inactividad
// Si el resultado es 0 o negativo, ya se superó el tiempo
export function getIdleRemainingMs(): number {
  try {
    const value = localStorage.getItem(ACTIVITY_KEY);

    // Sin registro de actividad, lo consideramos inactivo
    if (!value) return 0;

    // Tiempo permitido - tiempo que ya pasó desde la última actividad
    return IDLE_TIMEOUT_MS - (Date.now() - Number(value));
  } catch {
    // Si no podemos leer localStorage, no cerramos la sesión
    return IDLE_TIMEOUT_MS;
  }
}

// ¿Pasó demasiado tiempo desde la última actividad?
// Ahora reutiliza la función anterior, así el cálculo vive en un solo lugar
export function isSessionIdle(): boolean {
  return getIdleRemainingMs() <= 0;
}

// ----- MOTIVO DEL CIERRE -----
// Usamos sessionStorage (y no localStorage) porque este dato solo
// necesita vivir hasta que el login muestre el mensaje

export function setLogoutReason(reason: LogoutReason): void {
  try {
    sessionStorage.setItem(REASON_KEY, reason);
  } catch {
    // Nada que hacer
  }
}

// Lee el motivo del cierre SIN borrarlo
export function getLogoutReason(): LogoutReason | null {
  // En el servidor no existe sessionStorage
  if (typeof window === 'undefined') return null;

  try {
    return sessionStorage.getItem(REASON_KEY) as LogoutReason | null;
  } catch {
    return null;
  }
}

// Borra el motivo, para que el mensaje no se repita la próxima vez
export function clearLogoutReason(): void {
  try {
    sessionStorage.removeItem(REASON_KEY);
  } catch {
    // Nada que hacer
  }
}