import { useQuery } from '@tanstack/react-query'
import { getDashboardKpis, getProjects, type ProjectFilters } from '@/data'
import { useSession } from '@/lib/session'

export function useDashboardKpis() {
  const { user } = useSession()
  return useQuery({ queryKey: [user.id, 'dashboard'], queryFn: getDashboardKpis })
}

export function useProjects(filters: ProjectFilters) {
  const { user } = useSession()
  return useQuery({
    queryKey: [user.id, 'projects', filters],
    queryFn: () => getProjects(filters),
    placeholderData: (previous) => previous,
  })
}
