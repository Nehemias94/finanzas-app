'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { FormInput } from '@/components/FormInput';
import type { ValidationErrors } from '@/lib/types';

// Misma estructura que el login, con dos campos más
export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setMessage('');
    setSubmitting(true);

    try {
      await register(name, email, password, passwordConfirmation);
      router.replace('/dashboard');
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setErrors(error.errors);
      } else if (error instanceof ApiError) {
        setMessage(error.message);
      } else {
        setMessage('Ocurrió un error inesperado.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Crear cuenta</h1>
      <p className="mb-6 text-sm text-gray-500">Empieza a controlar tus finanzas</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput label="Nombre" name="name" value={name} onChange={setName} error={errors.name} autoComplete="name" />
        <FormInput label="Correo" name="email" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" />
        <FormInput label="Contraseña" name="password" type="password" value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" />

        {/* El error de "las contraseñas no coinciden" Laravel lo devuelve en el campo password */}
        <FormInput
          label="Confirmar contraseña"
          name="password_confirmation"
          type="password"
          value={passwordConfirmation}
          onChange={setPasswordConfirmation}
          autoComplete="new-password"
        />

        {message && <p className="text-sm text-red-600">{message}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-medium text-emerald-600 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}