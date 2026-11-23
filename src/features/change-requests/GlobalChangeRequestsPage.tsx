import { Plus } from 'lucide-react'
import { useState } from 'react'
import type { ChangeReqStatus } from '@/data'
import { PageHeader } from '@/components/layout/PageHeader'
import { RoleGate } from '@/components/shared/RoleGate'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MetaSelectItems } from '@/components/shared/MetaSelectItems'
import { CHANGE_REQ_STATUS } from '@/lib/labels'
import { ChangeRequestDialog } from './ChangeRequestForm'
import { ChangeRequestList } from './ChangeRequestList'

export function GlobalChangeRequestsPage() {
  const [status, setStatus] = useState<ChangeReqStatus | 'todas'>('todas')
  const [creating, setCreating] = useState(false)
  return (
    <div>
      <PageHeader
        title="Solicitudes de cambio"
        description="Cambios de alcance pedidos por el despacho en todos los proyectos."
        actions={
          <>
            <Select value={status} onValueChange={(v) => setStatus(v as ChangeReqStatus | 'todas')}>
              <SelectTrigger aria-label="Filtrar por estatus" className="w-44 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="todas">Todos los estatus</SelectItem>
                <MetaSelectItems map={CHANGE_REQ_STATUS} />
              </SelectContent>
            </Select>
            <RoleGate action="change_request.create">
              <Button onClick={() => setCreating(true)}>
                <Plus aria-hidden className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
                Nueva solicitud
              </Button>
            </RoleGate>
          </>
        }
      />
      <div className="max-w-3xl">
        <ChangeRequestList showProject status={status} />
      </div>
      <ChangeRequestDialog open={creating} onOpenChange={setCreating} />
    </div>
  )
}
