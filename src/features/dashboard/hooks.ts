import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary, getProjects, type ProjectFilters } from '@/data'
import { useSession } from '@/lib/session'

export function useDashboardSummary() {
  const { user } = useSession()
  return useQuery({ queryKey: [user.id, 'dashboard'], queryFn: getDashboardSummary })
}

export function useProjects(filters: ProjectFilters) {
  const { user } = useSession()
  return useQuery({
    queryKey: [user.id, 'projects', filters],
    queryFn: () => getProjects(filters),
    placeholderData: (previous) => previous,
  })
}
