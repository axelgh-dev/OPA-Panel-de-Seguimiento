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
  DeliverableInput,
  EditCommentInput,
  MilestoneInput,
  ProfileUpdate,
  Project,
  ProjectInput,
  TaskInput,
  UpdateInput,
  ProjectUpdate,
  Deliverable,
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

  // Captura (solo dev; la base de datos lo hace cumplir con RLS)
  createProject(input: ProjectInput): Promise<Project>
  updateProject(id: string, patch: Partial<ProjectInput>): Promise<void>
  deleteProject(id: string): Promise<void>
  createMilestone(input: MilestoneInput): Promise<Milestone>
  updateMilestone(id: string, patch: Partial<Omit<MilestoneInput, 'project_id'>>): Promise<void>
  deleteMilestone(id: string): Promise<void>
  /** Fija el orden de los hitos según la lista de ids. */
  reorderMilestones(projectId: string, orderedIds: string[]): Promise<void>
  createTask(input: TaskInput): Promise<Task>
  updateTask(id: string, patch: Partial<Omit<TaskInput, 'project_id'>>): Promise<void>
  deleteTask(id: string): Promise<void>
  createDeliverable(input: DeliverableInput): Promise<Deliverable>
  updateDeliverable(id: string, patch: Partial<Omit<DeliverableInput, 'project_id'>>): Promise<void>
  deleteDeliverable(id: string): Promise<void>
  /** Sube el archivo al almacenamiento y lo asocia al entregable. */
  uploadDeliverableFile(deliverableId: string, file: File): Promise<void>
  /** URL temporal de descarga del archivo de un entregable (null si no hay almacenamiento). */
  getDeliverableFileUrl(storagePath: string): Promise<string | null>
  createUpdate(input: UpdateInput): Promise<ProjectUpdate>
  updateUpdate(id: string, patch: Partial<Omit<UpdateInput, 'project_id'>>): Promise<void>
  deleteUpdate(id: string): Promise<void>
  updateProfile(id: string, patch: ProfileUpdate): Promise<void>
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
