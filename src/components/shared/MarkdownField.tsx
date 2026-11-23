import { useId, useState } from 'react'
import { Markdown } from '@/components/shared/Markdown'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

/** Campo de texto en Markdown con pestañas Escribir / Vista previa (la misma que verá el despacho). */
export function MarkdownField({
  value,
  onChange,
  label,
  rows = 8,
  placeholder,
  invalid,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  rows?: number
  placeholder?: string
  invalid?: boolean
}) {
  const [preview, setPreview] = useState(false)
  const id = useId()
  const tab = (active: boolean) =>
    cn(
      'rounded-md px-3 py-1 text-sm transition-colors',
      active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
    )
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div
          role="group"
          aria-label="Modo del editor"
          className="flex gap-1 rounded-lg bg-muted p-0.5"
        >
          <button
            type="button"
            aria-pressed={!preview}
            className={tab(!preview)}
            onClick={() => setPreview(false)}
          >
            Escribir
          </button>
          <button
            type="button"
            aria-pressed={preview}
            className={tab(preview)}
            onClick={() => setPreview(true)}
          >
            Vista previa
          </button>
        </div>
      </div>
      {preview ? (
        <div className="min-h-[8rem] rounded-md border bg-card px-4 py-3">
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">Nada que mostrar todavía.</p>
          )}
        </div>
      ) : (
        <Textarea
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.value)}
          className="bg-card font-mono text-[13px] leading-relaxed"
        />
      )}
      <p className="text-xs text-muted-foreground">
        Admite **negritas**, listas con guiones y [enlaces](https://…). No se permite HTML.
      </p>
    </div>
  )
}
