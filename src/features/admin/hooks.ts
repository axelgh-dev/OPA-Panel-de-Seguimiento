import { useQuery } from '@tanstack/react-query'
import { getProfiles } from '@/data'
import { useSession } from '@/lib/session'

export function useProfiles() {
  const { user } = useSession()
  return useQuery({ queryKey: [user.id, 'profiles'], queryFn: getProfiles })
}
