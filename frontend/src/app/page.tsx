import { redirect } from 'next/navigation';

// La página de inicio (/) no muestra nada: redirige al dashboard
// Si no hay sesión, el layout del dashboard se encargará de mandar al login
export default function Home() {
  redirect('/dashboard');
}