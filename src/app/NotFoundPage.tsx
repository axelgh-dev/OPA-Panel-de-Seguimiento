import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="No encontramos esa página"
      description="El enlace puede estar incompleto o ya no existir."
      action={
        <Button asChild>
          <Link to="/">Ir al inicio</Link>
        </Button>
      }
    />
  )
}
