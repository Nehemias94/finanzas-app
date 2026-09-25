// Las "props" son los datos que un componente recibe desde afuera
// Esta interface define qué props acepta FormInput
interface FormInputProps {
  label: string;                     // Texto visible encima del campo
  name: string;                      // Identificador del campo
  type?: string;                     // El ? significa opcional (por defecto será "text")
  value: string;                     // Valor actual
  onChange: (value: string) => void; // Función que se llama cuando el usuario escribe
  error?: string[];                  // Errores de validación de este campo (si hay)
  autoComplete?: string;             // Ayuda al navegador a autocompletar
}

export function FormInput({
  label,
  name,
  type = 'text', // Valor por defecto si no se indica
  value,
  onChange,
  error,
  autoComplete,
}: FormInputProps) {
  return (
    <div className="space-y-1">
      {/* htmlFor conecta la etiqueta con el campo: al hacer clic en el texto, se enfoca el campo */}
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        required
        // e.target.value es el texto actual del campo
        onChange={(e) => onChange(e.target.value)}
        // Si hay error, el borde se pone rojo; si no, gris
        className={`w-full rounded-lg border px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />

      {/* Si hay errores, mostramos cada uno debajo del campo */}
      {error?.map((message) => (
        <p key={message} className="text-sm text-red-600">
          {message}
        </p>
      ))}
    </div>
  );
}