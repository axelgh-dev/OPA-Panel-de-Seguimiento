import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createDeliverable,
  createMilestone,
  createProject,
  createTask,
  createUpdate,
  deleteDeliverable,
  deleteMilestone,
  deleteProject,
  deleteTask,
  deleteUpdate,
  reorderMilestones,
  updateDeliverable,
  updateMilestone,
  updateProfile,
  updateProject,
  updateTask,
  updateUpdate,
  uploadDeliverableFile,
} from '@/data'

/** Mutación de captura: al terminar se refrescan todas las consultas (los datos son pocos y siempre coherentes). */
function useAction<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries() })
}

export const useCreateProject = () => useAction(createProject)
export const useUpdateProject = () =>
  useAction((a: { id: string; patch: Parameters<typeof updateProject>[1] }) =>
    updateProject(a.id, a.patch),
  )
export const useDeleteProject = () => useAction(deleteProject)

export const useCreateMilestone = () => useAction(createMilestone)
export const useUpdateMilestone = () =>
  useAction((a: { id: string; patch: Parameters<typeof updateMilestone>[1] }) =>
    updateMilestone(a.id, a.patch),
  )
export const useDeleteMilestone = () => useAction(deleteMilestone)
export const useReorderMilestones = () =>
  useAction((a: { projectId: string; orderedIds: string[] }) =>
    reorderMilestones(a.projectId, a.orderedIds),
  )

export const useCreateTask = () => useAction(createTask)
export const useUpdateTask = () =>
  useAction((a: { id: string; patch: Parameters<typeof updateTask>[1] }) =>
    updateTask(a.id, a.patch),
  )
export const useDeleteTask = () => useAction(deleteTask)

export const useCreateDeliverable = () => useAction(createDeliverable)
export const useUpdateDeliverable = () =>
  useAction((a: { id: string; patch: Parameters<typeof updateDeliverable>[1] }) =>
    updateDeliverable(a.id, a.patch),
  )
export const useDeleteDeliverable = () => useAction(deleteDeliverable)
export const useUploadDeliverableFile = () =>
  useAction((a: { id: string; file: File }) => uploadDeliverableFile(a.id, a.file))

export const useCreateUpdate = () => useAction(createUpdate)
export const useUpdateUpdate = () =>
  useAction((a: { id: string; patch: Parameters<typeof updateUpdate>[1] }) =>
    updateUpdate(a.id, a.patch),
  )
export const useDeleteUpdate = () => useAction(deleteUpdate)

export const useUpdateProfile = () =>
  useAction((a: { id: string; patch: Parameters<typeof updateProfile>[1] }) =>
    updateProfile(a.id, a.patch),
  )
