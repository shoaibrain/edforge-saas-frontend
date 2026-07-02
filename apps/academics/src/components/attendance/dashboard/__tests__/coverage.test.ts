import { describe, it, expect } from 'vitest'
import {
  classifySection,
  toSectionCoverage,
  sortActionableFirst,
  computeCoverageSummary,
  riskBand,
  rankAtRisk,
  toGradeRates,
} from '../coverage'
import type { AttendanceOverviewResponse, AttendanceAlert } from '../../../../services/academics.service'

describe('coverage — classifySection', () => {
  it('marks a fully-recorded section', () => {
    expect(classifySection({ studentCount: 20, recordedCount: 20, isComplete: true })).toBe('recorded')
    expect(classifySection({ studentCount: 20, recordedCount: 20, isComplete: false })).toBe('recorded')
  })
  it('marks a partial section', () => {
    expect(classifySection({ studentCount: 20, recordedCount: 8, isComplete: false })).toBe('partial')
  })
  it('marks a not-started section', () => {
    expect(classifySection({ studentCount: 20, recordedCount: 0, isComplete: false })).toBe('not-started')
  })
})

describe('coverage — weighted coverage', () => {
  const sections = [
    { sectionId: 's1', sectionNumber: 'A', courseName: 'Math', studentCount: 20, recordedCount: 20, isComplete: true },
    { sectionId: 's2', sectionNumber: 'B', courseName: 'Sci', studentCount: 20, recordedCount: 10, isComplete: false },
    { sectionId: 's3', sectionNumber: 'C', courseName: 'Soc', studentCount: 20, recordedCount: 0, isComplete: false },
  ]

  it('weights partials by completion fraction (full=1, partial=done/enrolled, none=0)', () => {
    const covered = toSectionCoverage(sections)
    expect(covered.map((c) => c.status)).toEqual(['recorded', 'partial', 'not-started'])
    expect(covered[1].weight).toBeCloseTo(0.5)
    expect(covered[1].completionPct).toBe(50)
    // weighted coverage = (1 + 0.5 + 0) / 3 = 50%  (NOT the naive 1-of-3 = 33%)
    const overview = {
      todaySummary: { totalStudents: 60, totalRecorded: 30, attendanceRate: 88 },
    } as unknown as AttendanceOverviewResponse
    const summary = computeCoverageSummary(overview, covered)
    expect(summary.covWeightedPct).toBe(50)
    expect(summary.full).toBe(1)
    expect(summary.partial).toBe(1)
    expect(summary.notStarted).toBe(1)
    expect(summary.studentsRecorded).toBe(30)
    expect(summary.studentsTotal).toBe(60)
    expect(summary.recordedRate).toBe(88)
  })

  it('orders sections actionable-first (partial → not-started → recorded)', () => {
    const covered = toSectionCoverage(sections)
    expect(sortActionableFirst(covered).map((c) => c.sectionId)).toEqual(['s2', 's3', 's1'])
  })
})

describe('coverage — risk bands', () => {
  it('splits chronic (<70), at-risk (70–90), watch (>=90)', () => {
    expect(riskBand(63)).toBe('chronic')
    expect(riskBand(78)).toBe('atrisk')
    expect(riskBand(95)).toBe('watch')
  })

  const alerts: AttendanceAlert[] = [
    { studentId: 'a', studentName: 'A', attendanceRate: 63, absentDays: 6, totalDays: 20, trend: 'declining' },
    { studentId: 'b', studentName: 'B', attendanceRate: 78, absentDays: 4, totalDays: 20, trend: 'stable' },
    { studentId: 'c', studentName: 'C', attendanceRate: 95, absentDays: 1, totalDays: 20, trend: 'improving' },
    // duplicate of 'a' with a worse rate — dedupe keeps the worst
    { studentId: 'a', studentName: 'A', attendanceRate: 60, absentDays: 8, totalDays: 20, trend: 'declining' },
  ]

  it('dedupes by studentId (worst rate), drops watch, and sorts worst-first', () => {
    const ranked = rankAtRisk(alerts)
    expect(ranked.map((r) => r.studentId)).toEqual(['a', 'b']) // c (watch) dropped, a deduped
    expect(ranked[0].attendanceRate).toBe(60) // kept the worse duplicate
    expect(ranked[0].band).toBe('chronic')
    expect(ranked[1].band).toBe('atrisk')
  })
})

describe('coverage — grade rates', () => {
  it('maps byGradeLevel to worst-first rows, dropping empty grades', () => {
    const rows = toGradeRates({
      '5': { total: 30, present: 27, absent: 3, rate: 90 },
      '4': { total: 20, present: 14, absent: 6, rate: 70 },
      '3': { total: 0, present: 0, absent: 0, rate: 0 },
    })
    expect(rows.map((r) => r.gradeLevel)).toEqual(['4', '5'])
    expect(rows[0].rate).toBe(70)
  })
  it('returns [] when there is no grade breakdown', () => {
    expect(toGradeRates(undefined)).toEqual([])
  })
})
