import type { ReactNode } from 'react'

/** Marco común de las pantallas de acceso: logo, tarjeta y pie opcional. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <main className="w-full max-w-sm">
        <img
          src="/brand/logo.png"
          alt="OP&A Business and Tax Consultants"
          className="mx-auto mb-8 h-auto w-52"
        />
        <div className="rounded-xl border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-2xl">{title}</h1>
          <p className="mt-1 text-muted-foreground">{description}</p>
          {children}
        </div>
        {footer && <p className="mt-6 text-center text-xs text-muted-foreground">{footer}</p>}
      </main>
    </div>
  )
}
