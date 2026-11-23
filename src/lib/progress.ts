import type { Milestone } from '@/data/types'

/**
 * % de avance de un proyecto (§7.2, vista project_overview):
 * suma de pesos de hitos completados / suma de pesos totales, redondeado a entero.
 * Si hay `progressOverride`, se usa tal cual (acotado a 0–100).
 */
export function computeProgress(
  milestones: Pick<Milestone, 'weight' | 'status'>[],
  progressOverride: number | null = null,
): number {
  if (progressOverride !== null) return Math.min(100, Math.max(0, Math.round(progressOverride)))
  const total = milestones.reduce((sum, m) => sum + m.weight, 0)
  if (total <= 0) return 0
  const done = milestones.filter((m) => m.status === 'completado').reduce((s, m) => s + m.weight, 0)
  return Math.round((done / total) * 100)
}
