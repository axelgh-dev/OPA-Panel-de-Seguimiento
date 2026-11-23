import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createChangeRequest,
  getChangeRequests,
  setChangeRequestStatus,
  type CreateChangeRequestInput,
  type SetChangeRequestStatusInput,
} from '@/data'
import { useSession } from '@/lib/session'

export function useChangeRequests(projectId?: string) {
  const { user } = useSession()
  return useQuery({
    queryKey: [user.id, 'change-requests', projectId ?? 'all'],
    queryFn: () => getChangeRequests({ projectId }),
  })
}

export function useCreateChangeRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateChangeRequestInput) => createChangeRequest(input),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function useSetChangeRequestStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SetChangeRequestStatusInput) => setChangeRequestStatus(input),
    onSuccess: () => qc.invalidateQueries(),
  })
}
