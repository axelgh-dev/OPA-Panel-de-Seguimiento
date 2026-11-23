import { SignalHigh, SignalLow, SignalMedium } from 'lucide-react'
import type {
  ChangeReqStatus,
  DeliverableStatus,
  MilestoneStatus,
  PriorityLevel,
  ProjectHealth,
  ProjectStatus,
  ReviewDecision,
  TaskStatus,
  UpdateType,
} from '@/data'
import {
  CHANGE_REQ_STATUS,
  DELIVERABLE_STATUS,
  HEALTH,
  MILESTONE_STATUS,
  PRIORITY,
  PROJECT_STATUS,
  REVIEW_DECISION,
  TASK_STATUS,
  UPDATE_TYPE,
  type Tone,
} from '@/lib/labels'
import { Chip } from './Chip'

interface ChipProps<T extends string> {
  value: T
  className?: string
}

function MetaChip<T extends string>({
  map,
  value,
  className,
}: ChipProps<T> & { map: Record<T, { label: string; tone: Tone }> }) {
  return (
    <Chip tone={map[value].tone} className={className}>
      {map[value].label}
    </Chip>
  )
}

export function ProjectStatusChip(props: ChipProps<ProjectStatus>) {
  return <MetaChip map={PROJECT_STATUS} {...props} />
}
export function HealthChip(props: ChipProps<ProjectHealth>) {
  return <MetaChip map={HEALTH} {...props} />
}
export function MilestoneStatusChip(props: ChipProps<MilestoneStatus>) {
  return <MetaChip map={MILESTONE_STATUS} {...props} />
}
export function TaskStatusChip(props: ChipProps<TaskStatus>) {
  return <MetaChip map={TASK_STATUS} {...props} />
}
export function DeliverableStatusChip(props: ChipProps<DeliverableStatus>) {
  return <MetaChip map={DELIVERABLE_STATUS} {...props} />
}
export function ReviewDecisionChip(props: ChipProps<ReviewDecision>) {
  return <MetaChip map={REVIEW_DECISION} {...props} />
}
export function ChangeReqStatusChip(props: ChipProps<ChangeReqStatus>) {
  return <MetaChip map={CHANGE_REQ_STATUS} {...props} />
}
export function UpdateTypeChip(props: ChipProps<UpdateType>) {
  return <MetaChip map={UPDATE_TYPE} {...props} />
}

const SIGNAL = { alta: SignalHigh, media: SignalMedium, baja: SignalLow } as const

/** La prioridad no usa color de estatus (no es salud): va con un indicador de intensidad. */
export function PriorityLabel({ value }: { value: PriorityLevel }) {
  const Icon = SIGNAL[value]
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
      <Icon aria-hidden className="h-4 w-4 text-primary" strokeWidth={1.5} />
      {PRIORITY[value].label}
    </span>
  )
}
