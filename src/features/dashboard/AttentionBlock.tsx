import {
  CircleCheckBig,
  FileCheck2,
  FileX2,
  GitPullRequestArrow,
  MessageSquareReply,
  MessagesSquare,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AttentionItem, AttentionKind } from '@/data'
import { DateLabel } from '@/components/shared/DateLabel'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'

const ICON: Record<AttentionKind, LucideIcon> = {
  deliverable_review: FileCheck2,
  change_request_reply: MessageSquareReply,
  change_request_new: GitPullRequestArrow,
  deliverable_rejected: FileX2,
  new_opa_comments: MessagesSquare,
}

export function AttentionBlock({
  items,
  isLoading,
  isError,
  onRetry,
}: {
  items?: AttentionItem[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  return (
    <section
      aria-labelledby="atencion"
      className="overflow-hidden rounded-xl border border-gold-500/40 bg-gold-100/60"
    >
      <div className="flex items-baseline justify-between gap-3 px-5 pb-2 pt-4">
        <h2 id="atencion" className="text-xl">
          Requiere tu atención
        </h2>
        {items && items.length > 0 && (
          <span className="text-sm tabular-nums text-muted-foreground">{items.length}</span>
        )}
      </div>

      {isError ? (
        <div className="p-4">
          <ErrorState onRetry={onRetry} className="bg-card" />
        </div>
      ) : isLoading ? (
        <div className="space-y-3 px-5 pb-5 pt-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full bg-card/70" />
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <ul className="divide-y divide-gold-500/20 border-t border-gold-500/20">
          {items.map((item) => {
            const Icon = ICON[item.kind]
            return (
              <li key={item.id}>
                <Link
                  to={`/proyectos/${item.project_slug}?tab=${item.tab}`}
                  className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-card/70 focus-visible:ring-inset"
                >
                  <Icon
                    aria-hidden
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-gold-600"
                    strokeWidth={1.5}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground">{item.title}</span>
                    <span className="block text-muted-foreground">
                      {item.title === item.project_name
                        ? item.detail
                        : `${item.detail} · ${item.project_name}`}
                    </span>
                  </span>
                  <DateLabel
                    value={item.at}
                    mode="relative"
                    className="shrink-0 pt-0.5 text-xs text-muted-foreground"
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="flex items-center gap-3 border-t border-gold-500/20 px-5 py-5 text-muted-foreground">
          <CircleCheckBig aria-hidden className="h-5 w-5 text-success" strokeWidth={1.5} />
          Estás al día: no hay nada pendiente de tu parte.
        </div>
      )}
    </section>
  )
}
