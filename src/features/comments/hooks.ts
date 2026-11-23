import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addComment, getComments, type AddCommentInput, type CommentTarget } from '@/data'
import { useSession } from '@/lib/session'

export function useComments(targetType: CommentTarget, targetId: string | undefined) {
  const { user } = useSession()
  return useQuery({
    queryKey: [user.id, 'comments', targetType, targetId],
    queryFn: () => getComments(targetType, targetId!),
    enabled: !!targetId,
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddCommentInput) => addComment(input),
    onSuccess: () => qc.invalidateQueries(),
  })
}
