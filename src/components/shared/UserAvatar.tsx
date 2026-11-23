import type { Profile } from '@/data'
import { cn } from '@/lib/utils'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (a + b).toUpperCase()
}

export function UserAvatar({
  user,
  size = 'md',
  className,
}: {
  user: Pick<Profile, 'full_name' | 'role'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium',
        user.role === 'dev'
          ? 'bg-gold-100 text-foreground'
          : 'bg-secondary text-secondary-foreground',
        size === 'sm' && 'h-6 w-6 text-[10px]',
        size === 'md' && 'h-8 w-8 text-xs',
        size === 'lg' && 'h-10 w-10 text-sm',
        className,
      )}
    >
      {initials(user.full_name)}
    </span>
  )
}
