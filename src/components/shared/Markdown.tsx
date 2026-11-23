import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

/** Markdown sin HTML crudo (no se usa `rehype-raw`; AGENT.md, regla 5). */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        'space-y-3 text-sm leading-relaxed text-foreground',
        '[&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-gold-500 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
        '[&_li]:ml-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5',
        className,
      )}
    >
      <ReactMarkdown
        components={{
          a: ({ href, children: c }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {c}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
