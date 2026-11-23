import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getActivity,
  getMilestones,
  getProject,
  getTasks,
  markProjectRead,
  setProjectPriority,
  updateTaskStatus,
  type PriorityLevel,
  type TaskStatus,
} from '@/data'
import { useSession } from '@/lib/session'

export function useProject(slug: string) {
  const { user } = useSession()
  return useQuery({ queryKey: [user.id, 'project', slug], queryFn: () => getProject(slug) })
}

export function useMilestones(projectId: string | undefined) {
  const { user } = useSession()
  return useQuery({
    queryKey: [user.id, 'milestones', projectId],
    queryFn: () => getMilestones(projectId!),
    enabled: !!projectId,
  })
}

export function useTasks(projectId: string | undefined) {
  const { user } = useSession()
  return useQuery({
    queryKey: [user.id, 'tasks', projectId],
    queryFn: () => getTasks(projectId!),
    enabled: !!projectId,
  })
}

export function useActivity(projectId: string | undefined) {
  const { user } = useSession()
  return useQuery({
    queryKey: [user.id, 'activity', projectId],
    queryFn: () => getActivity(projectId!),
    enabled: !!projectId,
  })
}

export function useSetProjectPriority() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, priority }: { projectId: string; priority: PriorityLevel }) =>
      setProjectPriority(projectId, priority),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      updateTaskStatus(taskId, status),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function useMarkProjectRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => markProjectRead(projectId),
    onSuccess: () =>
      qc.invalidateQueries({
        predicate: (q) => q.queryKey[1] === 'dashboard' || q.queryKey[1] === 'projects',
      }),
  })
}
