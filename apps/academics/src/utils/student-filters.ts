/**
 * Student preset-filter utilities
 *
 * Pure functions backing the preset filter chips on /academics/students
 * (All / Active / At-risk / Pending). Extracted from the StudentsModule
 * route component so they can be unit tested in isolation.
 *
 * Composition note: search / gradeLevel / status dropdowns are applied
 * server-side via `useStudents({ filters })`. The chip filter runs
 * client-side on top of whatever the server returned, so chip + dropdown +
 * search compose automatically through the data flow — pass the already-
 * filtered server result to `filterStudentsByMode` and the result is the
 * intersection.
 */

import type { StudentResponseDto } from '@aibrains/shared-types'
import type { StudentFilterMode } from '../stores/students.store'

/**
 * Filter a student list by the active preset chip mode.
 *
 * - `all` — passthrough.
 * - `active` — `status === 'active'`.
 * - `at-risk` — student appears in `alertsMap`. The alerts map must come
 *   from the same source as the Academics Overview "At-Risk Students" KPI
 *   (`useCombinedAlerts.students`, threshold `attendanceRate < 90`) so the
 *   chip count and the Overview KPI count agree.
 * - `pending` — `status === 'pending'`. Matches the canonical literal value
 *   of the `StudentStatus` enum (packages/shared-types/.../student.schema.ts).
 */
export function filterStudentsByMode(
  students: StudentResponseDto[],
  mode: StudentFilterMode,
  alertsMap: Map<string, number>,
): StudentResponseDto[] {
  switch (mode) {
    case 'active':
      return students.filter((s) => s.status === 'active')
    case 'at-risk':
      return students.filter((s) => alertsMap.has(s.studentId))
    case 'pending':
      return students.filter((s) => s.status === 'pending')
    case 'all':
    default:
      return students
  }
}
