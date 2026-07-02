/**
 * Bulk Generate Invoices — selection state helpers.
 *
 * Pure functions over a `SelectionState`. No React, no I/O. Wizard owns
 * the state and calls these to produce the next state on every operator
 * action.
 *
 * The recipient set is one Set<string>; individual ticks, grade-group
 * ticks, and segment chips all manipulate the same set. Selection survives
 * mode switches (operator can toggle between "By student" and "By grade"
 * without losing their work).
 */

import type {
  SelectionState,
  SelectionMode,
  SegmentId,
  StudentSearchResult,
} from './types'

// ---------------------------------------------------------------------------
// Single-student / many-student ticks
// ---------------------------------------------------------------------------

export function toggleStudent(state: SelectionState, id: string): SelectionState {
  const next = new Set(state.selectedIds)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return { ...state, selectedIds: next }
}

export function addStudents(
  state: SelectionState,
  ids: ReadonlyArray<string>,
): SelectionState {
  if (ids.length === 0) return state
  const next = new Set(state.selectedIds)
  for (const id of ids) next.add(id)
  return { ...state, selectedIds: next }
}

export function removeStudents(
  state: SelectionState,
  ids: ReadonlyArray<string>,
): SelectionState {
  if (ids.length === 0) return state
  const next = new Set(state.selectedIds)
  for (const id of ids) next.delete(id)
  return { ...state, selectedIds: next }
}

export function clearSelection(state: SelectionState): SelectionState {
  if (state.selectedIds.size === 0 && state.activeSegments.size === 0) return state
  return {
    ...state,
    selectedIds: new Set<string>(),
    activeSegments: new Set<SegmentId>(),
  }
}

export function setMode(state: SelectionState, mode: SelectionMode): SelectionState {
  if (state.mode === mode) return state
  return { ...state, mode }
}

// ---------------------------------------------------------------------------
// Grade-group tri-state
// ---------------------------------------------------------------------------

export type GroupTickState = 'off' | 'mixed' | 'on'

export function gradeGroupState(
  state: SelectionState,
  students: ReadonlyArray<StudentSearchResult>,
): GroupTickState {
  if (students.length === 0) return 'off'
  let selected = 0
  for (const s of students) {
    if (state.selectedIds.has(s.studentId)) selected++
  }
  if (selected === 0) return 'off'
  if (selected === students.length) return 'on'
  return 'mixed'
}

/**
 * Tick or untick a whole grade group. Tri-state: off → on (add all),
 * mixed → on (add the rest), on → off (remove all).
 */
export function toggleGradeGroup(
  state: SelectionState,
  students: ReadonlyArray<StudentSearchResult>,
): SelectionState {
  const st = gradeGroupState(state, students)
  const ids = students.map(s => s.studentId)
  if (st === 'on') return removeStudents(state, ids)
  return addStudents(state, ids)
}

// ---------------------------------------------------------------------------
// Segment chips
// ---------------------------------------------------------------------------

export function toggleSegment(state: SelectionState, segment: SegmentId): SelectionState {
  const nextSegs = new Set(state.activeSegments)
  if (nextSegs.has(segment)) nextSegs.delete(segment)
  else nextSegs.add(segment)
  return { ...state, activeSegments: nextSegs }
}

/**
 * Apply a segment chip's resolved student set to the selection. Phase 1
 * only invokes this for the three derivable segments — the others stay
 * greyed in the UI because we have no way to compute their membership
 * client-side without Phase 2 demographic fields on student.
 */
export function applySegmentMembers(
  state: SelectionState,
  segment: SegmentId,
  memberIds: ReadonlyArray<string>,
): SelectionState {
  const stWithSeg = toggleSegment(state, segment)
  // Only ADD members on the toggle-on transition; toggle-off doesn't auto-
  // remove (operator may have ticked individuals; we don't second-guess).
  if (stWithSeg.activeSegments.has(segment)) {
    return addStudents(stWithSeg, memberIds)
  }
  return stWithSeg
}

// ---------------------------------------------------------------------------
// Grouping for display
// ---------------------------------------------------------------------------

export interface GradeBucket {
  grade: string
  students: StudentSearchResult[]
}

const GRADE_ORDER_INDEX: ReadonlyMap<string, number> = new Map(
  [
    'PG', 'NUR', 'LKG', 'UKG',
    'ECD', 'PPC',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
  ].map((g, i) => [g, i]),
)

export function bucketByGrade(
  students: ReadonlyArray<StudentSearchResult>,
): GradeBucket[] {
  const buckets = new Map<string, StudentSearchResult[]>()
  for (const s of students) {
    const g = s.currentGradeLevel || 'Unknown'
    const arr = buckets.get(g) ?? []
    arr.push(s)
    buckets.set(g, arr)
  }
  // Sort each bucket by name; sort buckets by canonical grade order
  // (unknown grades trail).
  for (const arr of buckets.values()) {
    arr.sort((a, b) => a.fullName.localeCompare(b.fullName))
  }
  return [...buckets.entries()]
    .map(([grade, ss]) => ({ grade, students: ss }))
    .sort((a, b) => {
      const ai = GRADE_ORDER_INDEX.get(a.grade) ?? 999
      const bi = GRADE_ORDER_INDEX.get(b.grade) ?? 999
      if (ai !== bi) return ai - bi
      return a.grade.localeCompare(b.grade)
    })
}

// ---------------------------------------------------------------------------
// Resolved-selection summary for the rail
// ---------------------------------------------------------------------------

export interface SelectionSummary {
  /** Total students in the selection. */
  total: number
  /** Per-grade breakdown of the SELECTED set (skips empty grades). */
  perGrade: Array<{ grade: string; count: number }>
}

export function summarize(
  state: SelectionState,
  allStudents: ReadonlyArray<StudentSearchResult>,
): SelectionSummary {
  if (state.selectedIds.size === 0) {
    return { total: 0, perGrade: [] }
  }
  const counts = new Map<string, number>()
  for (const s of allStudents) {
    if (!state.selectedIds.has(s.studentId)) continue
    const g = s.currentGradeLevel || 'Unknown'
    counts.set(g, (counts.get(g) ?? 0) + 1)
  }
  const perGrade = [...counts.entries()]
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => {
      const ai = GRADE_ORDER_INDEX.get(a.grade) ?? 999
      const bi = GRADE_ORDER_INDEX.get(b.grade) ?? 999
      if (ai !== bi) return ai - bi
      return a.grade.localeCompare(b.grade)
    })
  return { total: state.selectedIds.size, perGrade }
}
