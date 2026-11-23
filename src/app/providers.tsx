import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { SessionProvider } from './SessionProvider'

export function AppProviders({
  children,
  initialUserId,
}: {
  children: ReactNode
  initialUserId?: string
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 } },
      }),
  )
  return (
    <QueryClientProvider client={client}>
      <SessionProvider initialUserId={initialUserId}>{children}</SessionProvider>
    </QueryClientProvider>
  )
}
