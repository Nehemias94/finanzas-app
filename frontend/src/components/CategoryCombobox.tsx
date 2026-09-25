'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { DEFAULT_COLOR, suggestColor } from '@/lib/colors';
import { normalizeText } from '@/lib/format';
import type { ApiResource, Category, TransactionType } from '@/lib/types';

// Una opción de la lista puede ser de DOS tipos:
// una categoría existente, o la opción de crear una nueva
// Esto se llama "unión discriminada": el campo "kind" dice de qué tipo es cada opción,
// y TypeScript sabe qué otros campos tiene según el valor de "kind"
type Option =
  | { kind: 'category'; category: Category }
  | { kind: 'create'; name: string };

interface CategoryComboboxProps {
  type: TransactionType;                        // Gasto o ingreso: define qué categorías se muestran
  value: Category | null;                       // Categoría seleccionada
  onChange: (category: Category | null) => void;
  error?: string[];
}

export function CategoryCombobox({ type, value, onChange, error }: CategoryComboboxProps) {
  const [categories, setCategories] = useState<Category[] | null>(null); // null = todavía cargando
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState(value?.name ?? ''); // Lo que el usuario escribe
  const [open, setOpen] = useState(false);               // ¿Se ve la lista?
  const [highlighted, setHighlighted] = useState(0);     // Opción resaltada (para el teclado)
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Cargamos las categorías del tipo elegido UNA vez
  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiResource<Category[]>>(`/categories?type=${type}`)
      .then((response) => {
        if (!cancelled) setCategories(response.data);
      })
      .catch(() => {
        if (!cancelled) setLoadError('No se pudieron cargar tus categorías.');
      });

    return () => {
      cancelled = true;
    };
  }, [type]);

  // ----- Datos derivados (se recalculan en cada dibujado) -----
  const typed = query.trim();
  const list = categories ?? [];

  // Categorías que contienen lo escrito (sin importar tildes ni mayúsculas)
  const matches = list.filter((category) => normalizeText(category.name).includes(normalizeText(typed)));

  // ¿Existe una categoría con EXACTAMENTE ese nombre?
  const exactMatch = list.some((category) => normalizeText(category.name) === normalizeText(typed));

  // Las opciones de la lista: las coincidencias, y al final "Crear" si hace falta
  // "as const" le dice a TypeScript que 'category' no es cualquier texto, sino ese valor exacto
  const options: Option[] = [
    ...matches.map((category) => ({ kind: 'category' as const, category })),
    ...(typed && !exactMatch && categories ? [{ kind: 'create' as const, name: typed }] : []),
  ];

  // Cuando el usuario escribe
  function handleInputChange(text: string) {
    setQuery(text);
    setOpen(true);
    setHighlighted(0);
    setCreateError('');

    // Si había una categoría seleccionada y el usuario cambia el texto, se deselecciona
    if (value) onChange(null);
  }

  // Cuando se elige una opción (con clic o con Enter)
  async function choose(option: Option) {
    // Caso 1: categoría existente -> la seleccionamos
    if (option.kind === 'category') {
      onChange(option.category);
      setQuery(option.category.name);
      setOpen(false);
      return;
    }

    // Caso 2: "Crear" -> la creamos en Laravel y la seleccionamos
    setCreating(true);
    setCreateError('');

    try {
      const response = await apiFetch<ApiResource<Category>>('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: option.name,
          type,
          // Color sugerido desde el archivo compartido lib/colors.ts
          // (gastos empiezan en rojo, ingresos en verde, y va rotando)
          color: suggestColor(type, list.length),
        }),
      });

      const created = response.data;

      // Agregamos la nueva categoría a la lista y la reordenamos alfabéticamente
      // localeCompare compara textos respetando el idioma (ñ, tildes...)
      setCategories((previous) =>
        [...(previous ?? []), created].sort((a, b) => a.name.localeCompare(b.name, 'es')),
      );

      onChange(created);
      setQuery(created.name);
      setOpen(false);
    } catch (err) {
      // Si Laravel devolvió un error del campo "name", mostramos ese; si no, el mensaje general
      setCreateError(
        err instanceof ApiError ? (err.errors.name?.[0] ?? err.message) : 'No se pudo crear la categoría.',
      );
    } finally {
      setCreating(false);
    }
  }

  // Navegación con el teclado
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault(); // Evita que el cursor se mueva dentro del texto
      setOpen(true);
      setHighlighted((index) => Math.min(index + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((index) => Math.max(index - 1, 0));
    } else if (e.key === 'Enter') {
      // IMPORTANTE: dentro de un <form>, Enter envía el formulario
      // Si la lista está abierta, Enter debe ELEGIR la opción, no enviar
      if (open && options[highlighted]) {
        e.preventDefault();
        choose(options[highlighted]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="space-y-1">
      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
        Categoría
      </label>

      {/* relative: la lista se posiciona respecto a este contenedor */}
      <div className="relative">
        <input
          id="category"
          // Atributos de accesibilidad: le dicen a los lectores de pantalla que esto es un buscador con lista
          role="combobox"
          aria-expanded={open}
          aria-controls="category-options"
          aria-autocomplete="list"
          autoComplete="off" // Desactiva las sugerencias del navegador, que taparían nuestra lista
          value={query}
          disabled={creating}
          placeholder={type === 'expense' ? 'Ej: Comida, Ropa, Transporte' : 'Ej: Salario, Trabajos extra'}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)} // Al salir del campo, se cierra la lista
          onKeyDown={handleKeyDown}
          className={`w-full rounded-lg border px-3 py-2 pr-8 text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />

        {/* Puntito de color a la derecha cuando hay una categoría seleccionada */}
        {value && (
          <span
            className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: value.color ?? DEFAULT_COLOR }}
          />
        )}

        {/* La lista de opciones: "absolute" hace que flote encima del resto del formulario */}
        {open && categories && options.length > 0 && (
          <ul
            id="category-options"
            role="listbox"
            className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            {options.map((option, index) => (
              <li
                key={option.kind === 'category' ? option.category.id : 'create'}
                role="option"
                aria-selected={index === highlighted}
                // Usamos onMouseDown (y no onClick) con preventDefault por un detalle del navegador:
                // al hacer clic en la lista, el campo pierde el foco ANTES del clic,
                // el onBlur cierra la lista, y el clic nunca llega a la opción.
                // preventDefault en mousedown evita que el campo pierda el foco
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(option);
                }}
                onMouseEnter={() => setHighlighted(index)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                  index === highlighted ? 'bg-emerald-50' : ''
                }`}
              >
                {option.kind === 'category' ? (
                  <>
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: option.category.color ?? DEFAULT_COLOR }}
                    />
                    <span className="text-gray-800">{option.category.name}</span>
                  </>
                ) : (
                  // &quot; es la forma de escribir comillas dobles dentro de JSX
                  <span className="font-medium text-emerald-700">+ Crear &quot;{option.name}&quot;</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mensajes de estado */}
      {categories === null && !loadError && <p className="text-xs text-gray-400">Cargando categorías...</p>}
      {categories?.length === 0 && !typed && (
        <p className="text-xs text-gray-400">Escribe un nombre para crear tu primera categoría.</p>
      )}
      {creating && <p className="text-xs text-gray-500">Creando categoría...</p>}
      {loadError && <p className="text-sm text-red-600">{loadError}</p>}
      {createError && <p className="text-sm text-red-600">{createError}</p>}
      {error?.map((message) => (
        <p key={message} className="text-sm text-red-600">
          {message}
        </p>
      ))}
    </div>
  );
}