import { SelectItem } from '@/components/ui/select'

/** Opciones de un `<Select>` a partir de un mapa de etiquetas (lib/labels.ts). */
export function MetaSelectItems({
  map,
  className,
}: {
  map: Record<string, { label: string }>
  className?: string
}) {
  return (
    <>
      {Object.entries(map).map(([value, { label }]) => (
        <SelectItem key={value} value={value} className={className}>
          {label}
        </SelectItem>
      ))}
    </>
  )
}
