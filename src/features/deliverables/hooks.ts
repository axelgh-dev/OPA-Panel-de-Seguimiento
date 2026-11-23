import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getDeliverables,
  reviewDeliverable,
  submitDeliverable,
  type ReviewDeliverableInput,
} from '@/data'
import { useSession } from '@/lib/session'

export function useDeliverables(projectId: string | undefined) {
  const { user } = useSession()
  return useQuery({
    queryKey: [user.id, 'deliverables', projectId],
    queryFn: () => getDeliverables(projectId!),
    enabled: !!projectId,
  })
}

export function useReviewDeliverable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ReviewDeliverableInput) => reviewDeliverable(input),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function useSubmitDeliverable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => submitDeliverable(id),
    onSuccess: () => qc.invalidateQueries(),
  })
}
