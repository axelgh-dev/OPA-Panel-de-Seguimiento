import type {
  ActivityEvent,
  ChangeRequest,
  Comment,
  Deliverable,
  DeliverableReview,
  Milestone,
  Profile,
  Project,
  ProjectUpdate,
  Task,
} from '../types'
import { activity } from './activity'
import { changeRequests } from './change-requests'
import { comments } from './comments'
import { t } from './dates'
import { deliverables, reviews } from './deliverables'
import { profiles } from './profiles'
import { milestones, projects } from './projects'
import { tasks } from './tasks'
import { updates } from './updates'

/** Almacén en memoria. Se pierde al recargar la página (fase 1). */
export interface Db {
  profiles: Profile[]
  projects: Project[]
  milestones: Milestone[]
  tasks: Task[]
  deliverables: Deliverable[]
  reviews: DeliverableReview[]
  updates: ProjectUpdate[]
  changeRequests: ChangeRequest[]
  comments: Comment[]
  activity: ActivityEvent[]
  /** Equivale a `read_receipts`: última vez que cada usuario vio cada proyecto. */
  readAt: Record<string, Record<string, string>>
  /** Marca de lectura por defecto por usuario (antes de abrir un proyecto). */
  defaultReadAt: Record<string, string>
}

function seed(): Db {
  return structuredClone({
    profiles,
    projects,
    milestones,
    tasks,
    deliverables,
    reviews,
    updates,
    changeRequests,
    comments,
    activity,
    readAt: {},
    // Todos vieron el panel por última vez hace dos días.
    defaultReadAt: Object.fromEntries(profiles.map((p) => [p.id, t(-2, 8)])),
  })
}

let current: Db = seed()

export function getDb(): Db {
  return current
}

/** Restaura los datos de ejemplo (útil para pruebas). */
export function resetDb(): void {
  current = seed()
}
