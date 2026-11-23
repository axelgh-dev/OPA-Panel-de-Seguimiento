import { FileText } from 'lucide-react'
import { useState } from 'react'
import { getDeliverableFileUrl } from '@/data'

/** Archivo de un entregable: pide una URL temporal firmada y lo abre en otra pestaña. */
export function FileLink({ storagePath }: { storagePath: string }) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const name = storagePath.split('/').pop()

  async function open() {
    setBusy(true)
    setError(null)
    try {
      const url = await getDeliverableFileUrl(storagePath)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      else setError('El archivo no está disponible en la demo.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos abrir el archivo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => void open()}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded font-medium text-primary hover:underline disabled:opacity-60"
      >
        <FileText aria-hidden className="h-4 w-4" strokeWidth={1.5} />
        {busy ? 'Abriendo…' : `Descargar ${name}`}
      </button>
      {error && (
        <span role="alert" className="text-danger-ink">
          {error}
        </span>
      )}
    </span>
  )
}
