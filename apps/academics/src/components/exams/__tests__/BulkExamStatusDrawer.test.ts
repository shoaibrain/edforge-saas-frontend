/**
 * computeTargetIntersection — unit tests (#254).
 *
 * The helper decides which transition actions every selected exam can take,
 * so the bulk drawer only offers a target that won't 409 on some row. It
 * returns the actions in canonical pipeline order (draft → scheduled →
 * in_progress → closed → published).
 *
 * Transition graph (mirror of the backend, exam-state-machine.ts):
 *   draft       → [scheduled]
 *   scheduled   → [in_progress, draft]
 *   in_progress → [closed, scheduled]
 *   closed      → [published]
 *   published   → []
 */

import { describe, it, expect } from 'vitest'
import type { ExamResponseDto, ExamStatus } from '@aibrains/shared-types'
import { computeTargetIntersection } from '../BulkExamStatusDrawer'

// The helper only reads `status`; a minimal fixture keeps the intent obvious.
const exam = (status: ExamStatus): ExamResponseDto =>
  ({ examId: `ex-${status}-${Math.random().toString(36).slice(2, 7)}`, status }) as ExamResponseDto

const targets = (exams: ExamResponseDto[]) =>
  computeTargetIntersection(exams).actions.map((a) => a.to)

describe('computeTargetIntersection', () => {
  it('empty input → empty intersection', () => {
    expect(computeTargetIntersection([]).actions).toEqual([])
  })

  it('all exams in the same single-action status → that status’s next actions', () => {
    // draft has exactly one outgoing action (→ scheduled).
    expect(targets([exam('draft'), exam('draft'), exam('draft')])).toEqual(['scheduled'])
  })

  it('all exams in the same multi-action status → all its actions, in pipeline order', () => {
    // scheduled → { in_progress, draft }; canonical order sorts by pipeline
    // index (draft=0 before in_progress=2), independent of declaration order.
    expect(targets([exam('scheduled'), exam('scheduled')])).toEqual(['draft', 'in_progress'])
  })

  it('mixed statuses sharing exactly one next state → that single state', () => {
    // draft → {scheduled}; in_progress → {closed, scheduled}. Only `scheduled`
    // is reachable from BOTH.
    expect(targets([exam('draft'), exam('in_progress')])).toEqual(['scheduled'])
  })

  it('mixed statuses with no common next state → empty intersection', () => {
    // draft → {scheduled}; closed → {published}. Disjoint.
    expect(computeTargetIntersection([exam('draft'), exam('closed')]).actions).toEqual([])
  })

  it('a terminal status in the selection collapses the intersection to empty', () => {
    // published has no outgoing actions, so nothing is reachable from every row.
    expect(computeTargetIntersection([exam('scheduled'), exam('published')]).actions).toEqual([])
  })

  it('preserves the action metadata (to/label/tone), not just the target', () => {
    const [action] = computeTargetIntersection([exam('closed')]).actions
    expect(action.to).toBe('published')
    expect(action.label).toBe('Publish Exam')
    expect(action.tone).toBe('primary')
  })
})
