import { useQuery } from '@tanstack/react-query'
import { getUpdates } from '@/data'
import { useSession } from '@/lib/session'

export function useUpdates(projectId?: string) {
  const { user } = useSession()
  return useQuery({
    queryKey: [user.id, 'updates', projectId ?? 'all'],
    queryFn: () => getUpdates({ projectId }),
  })
}
