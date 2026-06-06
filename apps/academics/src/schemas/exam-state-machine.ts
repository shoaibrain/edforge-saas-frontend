/**
 * Exam status state machine — FRONTEND MIRROR of the backend
 * `exam-state-machine.ts` (`ALLOWED_EXAM_TRANSITIONS`) in the academics service.
 *
 * The backend is the source of truth — it returns 409
 * `EXAM_STATE_INVALID_TRANSITION` on an illegal jump. This mirror only decides
 * which action buttons to surface so the operator is never offered an action
 * that would 409.
 */

import type { ExamStatus } from '@aibrains/shared-types'

/** Display order for the status pipeline / stepper. */
export const EXAM_STATUS_PIPELINE: ExamStatus[] = [
  'draft',
  'scheduled',
  'in_progress',
  'closed',
  'published',
]

export interface ExamTransitionAction {
  to: ExamStatus
  label: string
  tone: 'primary' | 'neutral' | 'warning'
  /** When set, the action prompts a confirm with this message first. */
  confirm?: string
}

/**
 * Allowed transitions + their operator-facing action labels. Mirrors
 * `ALLOWED_EXAM_TRANSITIONS`: draft→scheduled→in_progress→closed→published,
 * with the scheduled⇄draft and in_progress⇄scheduled back-edges.
 */
const TRANSITION_ACTIONS: Record<ExamStatus, ExamTransitionAction[]> = {
  draft: [{ to: 'scheduled', label: 'Schedule', tone: 'primary' }],
  scheduled: [
    { to: 'in_progress', label: 'Start Exam', tone: 'primary' },
    { to: 'draft', label: 'Move to Draft', tone: 'neutral' },
  ],
  in_progress: [
    {
      to: 'closed',
      label: 'Close Exam',
      tone: 'warning',
      confirm:
        'Close this exam? Scores lock and result cards are generated for every enrolled student. You can only publish after closing.',
    },
    { to: 'scheduled', label: 'Back to Scheduled', tone: 'neutral' },
  ],
  closed: [
    {
      to: 'published',
      label: 'Publish Exam',
      tone: 'primary',
      confirm: 'Publish this exam? This marks the exam lifecycle complete.',
    },
  ],
  published: [],
}

export function getExamTransitionActions(status: ExamStatus): ExamTransitionAction[] {
  return TRANSITION_ACTIONS[status] ?? []
}

/**
 * Whether exam-courses (subjects) can be added / edited / removed. Mirrors the
 * backend `acceptsExamCourseMutations` guard — only while the exam is still
 * `draft` or `scheduled`; afterwards the backend 409s `EXAM_LOCKED`.
 */
export function acceptsExamCourseMutations(status: ExamStatus): boolean {
  return status === 'draft' || status === 'scheduled'
}
