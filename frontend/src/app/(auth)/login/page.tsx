'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { clearLogoutReason, getLogoutReason } from '@/lib/token';
import Link from 'next/link'; // Enlaces entre páginas sin recargar todo el sitio
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { FormInput } from '@/components/FormInput';
import type { ValidationErrors } from '@/lib/types';

// Convierte el motivo del cierre en el texto que verá el usuario
function getNoticeMessage(): string {
  const reason = getLogoutReason();

  if (reason === 'inactivity') return 'Tu sesión se cerró por inactividad. Inicia sesión de nuevo.';
  if (reason === 'expired') return 'Tu sesión expiró. Inicia sesión de nuevo.';
  return '';
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  // Un estado por cada dato del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({}); // Errores por campo
  const [message, setMessage] = useState('');                 // Error general
  const [submitting, setSubmitting] = useState(false);        // true mientras se envía

  // El aviso se calcula UNA vez al crear el componente
  // Pasar una función a useState (y no su resultado) hace que solo se ejecute al inicio
  // Como el aviso nunca cambia, no necesitamos setNotice
  const [notice] = useState(getNoticeMessage);

  // Después de mostrar el aviso, borramos el motivo guardado
  // Este efecto no cambia ningún estado, así que no provoca otro dibujado
  useEffect(() => {
    clearLogoutReason();
  }, []);

  // Se ejecuta al enviar el formulario
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    // Evita que el navegador recargue la página (comportamiento normal de un <form>)
    e.preventDefault();

    // Limpiamos errores anteriores y marcamos que estamos enviando
    setErrors({});
    setMessage('');
    setSubmitting(true);

    try {
      await login(email, password);
      router.replace('/dashboard'); // replace: el login no queda en el historial del botón "atrás"
    } catch (error) {
      // instanceof revisa si el error es de nuestra clase ApiError
      if (error instanceof ApiError) {
        if (error.status === 422) {
          setErrors(error.errors); // Credenciales incorrectas o campos inválidos
        } else if (error.status === 429) {
          setMessage('Demasiados intentos. Espera un minuto e intenta de nuevo.');
        } else {
          setMessage(error.message);
        }
      } else {
        setMessage('Ocurrió un error inesperado.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Iniciar sesión</h1>
      <p className="mb-6 text-sm text-gray-500">Controla tus ingresos y gastos del mes</p>

      {/* Aviso en color ámbar: informa, pero no es un error del usuario */}
      {notice && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Correo"
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoComplete="email"
        />

        <FormInput
          label="Contraseña"
          name="password"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
        />

        {/* && en JSX: si message tiene texto, muestra el párrafo; si está vacío, no muestra nada */}
        {message && <p className="text-sm text-red-600">{message}</p>}

        <button
          type="submit"
          disabled={submitting} // Evita que se envíe dos veces con doble clic
          className="w-full rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="font-medium text-emerald-600 hover:underline">
          Regístrate
        </Link>
      </p>
    </>
  );
}