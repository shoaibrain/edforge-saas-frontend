import { describe, it, expect } from 'vitest'
import type { StudentResponseDto } from '@aibrains/shared-types'
import { filterStudentsByMode } from './student-filters'

// ----------------------------------------------------------------------------
// Fixture
// ----------------------------------------------------------------------------
//
// 10 students with mixed status + risk. Only the fields the filter function
// reads (`studentId`, `status`) are populated; the rest is cast through
// `unknown` because the DTO is wide and the chip filter doesn't touch it.
//
// Expected per-status counts:
//   active     → 5  (s1, s2, s3, s4, s5)
//   pending    → 2  (s6, s7)
//   inactive   → 1  (s8)
//   withdrawn  → 1  (s9)
//   graduated  → 1  (s10)
//
// At-risk alerts (subset of the 10):
//   s2, s3, s8  — three students appear in the alerts map.

type Status = StudentResponseDto['status']

function student(id: string, status: Status): StudentResponseDto {
  return { studentId: id, status } as unknown as StudentResponseDto
}

const STUDENTS: StudentResponseDto[] = [
  student('s1', 'active'),
  student('s2', 'active'),
  student('s3', 'active'),
  student('s4', 'active'),
  student('s5', 'active'),
  student('s6', 'pending'),
  student('s7', 'pending'),
  student('s8', 'inactive'),
  student('s9', 'withdrawn'),
  student('s10', 'graduated'),
]

const ALERTS = new Map<string, number>([
  ['s2', 72], // critical
  ['s3', 85], // warning
  ['s8', 60], // critical (also inactive)
])

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe('filterStudentsByMode', () => {
  it('all → returns the full list unchanged', () => {
    const result = filterStudentsByMode(STUDENTS, 'all', ALERTS)
    expect(result).toHaveLength(10)
    expect(result.map((s) => s.studentId)).toEqual([
      's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10',
    ])
  })

  it('active → only students whose status is "active"', () => {
    const result = filterStudentsByMode(STUDENTS, 'active', ALERTS)
    expect(result).toHaveLength(5)
    expect(result.map((s) => s.studentId)).toEqual(['s1', 's2', 's3', 's4', 's5'])
  })

  it('at-risk → only students appearing in the alerts map', () => {
    const result = filterStudentsByMode(STUDENTS, 'at-risk', ALERTS)
    expect(result).toHaveLength(3)
    expect(result.map((s) => s.studentId).sort()).toEqual(['s2', 's3', 's8'])
  })

  it('pending → only students whose status is "pending" (canonical enum value)', () => {
    const result = filterStudentsByMode(STUDENTS, 'pending', ALERTS)
    expect(result).toHaveLength(2)
    expect(result.map((s) => s.studentId)).toEqual(['s6', 's7'])
  })

  it('pending → does NOT match inactive students or students missing email (regression for the Sprint 2 bug)', () => {
    const result = filterStudentsByMode(STUDENTS, 'pending', ALERTS)
    // s8 is inactive — must NOT be in the result.
    expect(result.find((s) => s.studentId === 's8')).toBeUndefined()
    // s9 is withdrawn — must NOT be in the result.
    expect(result.find((s) => s.studentId === 's9')).toBeUndefined()
  })

  it('empty input → returns empty array for every mode', () => {
    const empty: StudentResponseDto[] = []
    expect(filterStudentsByMode(empty, 'all', ALERTS)).toEqual([])
    expect(filterStudentsByMode(empty, 'active', ALERTS)).toEqual([])
    expect(filterStudentsByMode(empty, 'at-risk', ALERTS)).toEqual([])
    expect(filterStudentsByMode(empty, 'pending', ALERTS)).toEqual([])
  })

  it('empty alerts map → at-risk returns empty', () => {
    const result = filterStudentsByMode(STUDENTS, 'at-risk', new Map())
    expect(result).toEqual([])
  })

  // --------------------------------------------------------------------------
  // Composition with server-side filters
  //
  // The dropdown / search filters are applied server-side BEFORE this function
  // runs. To verify chip + dropdown + search compose correctly, we simulate
  // a server result that has already been narrowed and confirm that the chip
  // filter intersects naturally without resetting the upstream narrowing.
  // --------------------------------------------------------------------------

  it('composes with a "grade dropdown" pre-filter — chip narrows the dropdown subset', () => {
    // Simulate the server returning only the first three "active" students
    // (e.g. because the user picked Grade 8 in the dropdown).
    const serverFiltered = STUDENTS.slice(0, 3) // s1, s2, s3 — all active

    // Active chip on the pre-filtered subset → still 3.
    expect(
      filterStudentsByMode(serverFiltered, 'active', ALERTS).map((s) => s.studentId),
    ).toEqual(['s1', 's2', 's3'])

    // At-risk chip on the same subset → only s2, s3 (s1 isn't in alerts).
    expect(
      filterStudentsByMode(serverFiltered, 'at-risk', ALERTS).map((s) => s.studentId),
    ).toEqual(['s2', 's3'])

    // Pending chip on the same subset → empty (no pending students in subset).
    expect(filterStudentsByMode(serverFiltered, 'pending', ALERTS)).toEqual([])
  })

  it('composes with a "search" pre-filter — chip respects the upstream narrowing', () => {
    // Simulate the server returning only the two pending students (e.g.
    // because the user typed a name fragment that matches both).
    const serverFiltered = STUDENTS.filter((s) => s.status === 'pending')

    // Pending chip → both still visible.
    expect(
      filterStudentsByMode(serverFiltered, 'pending', ALERTS).map((s) => s.studentId),
    ).toEqual(['s6', 's7'])

    // Active chip on the same subset → empty (search has already excluded
    // active rows; the chip never re-introduces them).
    expect(filterStudentsByMode(serverFiltered, 'active', ALERTS)).toEqual([])
  })
})
