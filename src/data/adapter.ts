import type {
  ActivityWithActor,
  AddCommentInput,
  ChangeRequest,
  ChangeRequestWithMeta,
  CommentTarget,
  CommentWithAuthor,
  CreateChangeRequestInput,
  DashboardKpis,
  DeliverableWithReviews,
  EditCommentInput,
  Milestone,
  PriorityLevel,
  Profile,
  ProjectFilters,
  ProjectOverview,
  ReviewDeliverableInput,
  SetChangeRequestStatusInput,
  Task,
  TaskStatus,
  UpdateWithMeta,
} from './types'

/**
 * Contrato que implementan el adaptador mock y el de Supabase.
 * La UI no lo ve: solo usa las funciones que `src/data/index.ts` re-exporta.
 */
export interface DataAdapter {
  getProfiles(): Promise<Profile[]>
  getProjects(filters?: ProjectFilters): Promise<ProjectOverview[]>
  getProject(slug: string): Promise<ProjectOverview | null>
  getMilestones(projectId: string): Promise<Milestone[]>
  getTasks(projectId: string): Promise<Task[]>
  getDeliverables(projectId: string): Promise<DeliverableWithReviews[]>
  getUpdates(opts?: { projectId?: string }): Promise<UpdateWithMeta[]>
  getChangeRequests(opts?: { projectId?: string }): Promise<ChangeRequestWithMeta[]>
  getComments(target_type: CommentTarget, target_id: string): Promise<CommentWithAuthor[]>
  getActivity(projectId: string): Promise<ActivityWithActor[]>
  getDashboardKpis(): Promise<DashboardKpis>
  reviewDeliverable(input: ReviewDeliverableInput): Promise<void>
  submitDeliverable(deliverableId: string): Promise<void>
  addComment(input: AddCommentInput): Promise<void>
  editComment(input: EditCommentInput): Promise<void>
  deleteComment(id: string): Promise<void>
  createChangeRequest(input: CreateChangeRequestInput): Promise<ChangeRequest>
  setChangeRequestStatus(input: SetChangeRequestStatusInput): Promise<void>
  setProjectPriority(projectId: string, priority: PriorityLevel): Promise<void>
  updateTaskStatus(taskId: string, status: TaskStatus): Promise<void>
  markProjectRead(projectId: string): Promise<void>
}

/** Autenticación real (solo con Supabase). */
export interface AuthApi {
  /** Perfil de la sesión actual, o null si no hay sesión o la cuenta está desactivada. */
  getSessionProfile(): Promise<Profile | null>
  /** Avisa de inicios/cierres de sesión. Devuelve la función para cancelar la suscripción. */
  onAuthChange(callback: () => void): () => void
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  updatePassword(newPassword: string): Promise<void>
}
