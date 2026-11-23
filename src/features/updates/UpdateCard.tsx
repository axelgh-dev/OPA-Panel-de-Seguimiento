import { Link } from 'react-router-dom'
import type { UpdateWithMeta } from '@/data'
import { DateLabel } from '@/components/shared/DateLabel'
import { Markdown } from '@/components/shared/Markdown'
import { UpdateTypeChip } from '@/components/shared/chips'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Skeleton } from '@/components/ui/skeleton'
import { CommentsToggle } from '@/features/comments/CommentsToggle'

export function UpdateCard({
  update: u,
  showProject = false,
}: {
  update: UpdateWithMeta
  showProject?: boolean
}) {
  return (
    <article className="rounded-xl border bg-card p-5 shadow-card">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <UpdateTypeChip value={u.type} />
          {u.is_new && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              Nuevo
            </span>
          )}
          {showProject && (
            <Link
              to={`/proyectos/${u.project_slug}`}
              className="text-sm text-primary hover:underline"
            >
              {u.project_name}
            </Link>
          )}
        </div>
        <h3 className="font-serif text-lg font-semibold leading-snug text-primary">{u.title}</h3>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserAvatar user={u.author} size="sm" />
          {u.author.full_name} · <DateLabel value={u.published_at} mode="relative" />
        </p>
      </header>
      <Markdown className="mt-4">{u.body_md}</Markdown>
      <div className="mt-5 border-t pt-4">
        <CommentsToggle
          projectId={u.project_id}
          targetType="update"
          targetId={u.id}
          count={u.comment_count}
        />
      </div>
    </article>
  )
}

export function UpdateListSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 rounded-xl border bg-card p-5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  )
}
