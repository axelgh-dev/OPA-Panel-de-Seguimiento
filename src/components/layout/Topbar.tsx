import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoleSwitcher } from './RoleSwitcher'

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6 lg:px-10">
      <Button
        variant="ghost"
        size="icon"
        className="-ml-2 lg:hidden"
        onClick={onOpenMenu}
        aria-label="Abrir menú de navegación"
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </Button>
      <img src="/brand/logo.png" alt="OP&A" className="h-6 w-auto lg:hidden" />
      <div className="ml-auto">
        <RoleSwitcher />
      </div>
    </div>
  )
}
