/**
 * coverage — pure helpers for the redesigned Attendance dashboard.
 *
 * The single `useAttendanceOverview` aggregate reports per-section recording
 * *completion* (recordedCount / studentCount / isComplete) but no per-section
 * present/absent split and no per-section rate. These helpers derive the two
 * honest signals the redesign leads with — recording COVERAGE (weighted) and the
 * recorded RATE — plus the risk-band split for the at-risk panel and insight
 * strip. Kept framework-free so the math is unit-testable without React.
 */

import type {
  AttendanceOverviewResponse,
  AttendanceAlert,
} from '../../../services/academics.service'

export type SectionRecordStatus = 'recorded' | 'partial' | 'not-started'

type SectionCompletionEntry =
  AttendanceOverviewResponse['sectionCompletion']['sections'][number]

export interface SectionCoverage {
  sectionId: string
  sectionNumber: string
  courseName: string
  studentCount: number
  recordedCount: number
  status: SectionRecordStatus
  /** Completion fraction 0..1 — recorded → 1, partial → recorded/enrolled, none → 0. */
  weight: number
  /** Completion percent 0..100 (for the tracker gauge + "% done" badge). */
  completionPct: number
}

/** Classify one section into the tri-state used everywhere (tracker, list, drawer). */
export function classifySection(s: {
  studentCount: number
  recordedCount: number
  isComplete: boolean
}): SectionRecordStatus {
  if (s.isComplete || (s.studentCount > 0 && s.recordedCount >= s.studentCount)) {
    return 'recorded'
  }
  if (s.recordedCount > 0) return 'partial'
  return 'not-started'
}

/** Map raw section-completion rows to the presentation shape (weight + status). */
export function toSectionCoverage(
  sections: SectionCompletionEntry[],
): SectionCoverage[] {
  return sections.map((s) => {
    const status = classifySection(s)
    const enrolled = s.studentCount || 0
    const weight =
      status === 'recorded'
        ? 1
        : status === 'partial' && enrolled > 0
          ? Math.min(1, s.recordedCount / enrolled)
          : 0
    return {
      sectionId: s.sectionId,
      sectionNumber: s.sectionNumber,
      courseName: s.courseName,
      studentCount: enrolled,
      recordedCount: s.recordedCount,
      status,
      weight,
      completionPct: Math.round(weight * 100),
    }
  })
}

/** Actionable-first ordering: partial → not-started → recorded. */
const STATUS_ORDER: Record<SectionRecordStatus, number> = {
  partial: 0,
  'not-started': 1,
  recorded: 2,
}

export function sortActionableFirst(list: SectionCoverage[]): SectionCoverage[] {
  return [...list].sort((a, b) => {
    const d = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (d !== 0) return d
    return (a.courseName || a.sectionNumber).localeCompare(b.courseName || b.sectionNumber)
  })
}

export interface CoverageSummary {
  sectionCount: number
  full: number
  partial: number
  notStarted: number
  /** Weighted coverage % — a partial section counts its completion fraction, not 1. */
  covWeightedPct: number
  studentsRecorded: number
  studentsTotal: number
  /** Attendance rate among sessions actually recorded (distinct from coverage). */
  recordedRate: number
}

export function computeCoverageSummary(
  overview: AttendanceOverviewResponse | undefined,
  covered: SectionCoverage[],
): CoverageSummary {
  const sectionCount = covered.length
  const full = covered.filter((c) => c.status === 'recorded').length
  const partial = covered.filter((c) => c.status === 'partial').length
  const notStarted = covered.filter((c) => c.status === 'not-started').length
  const weightedSum = covered.reduce((n, c) => n + c.weight, 0)
  const covWeightedPct = sectionCount > 0 ? Math.round((weightedSum / sectionCount) * 100) : 0

  const summary = overview?.todaySummary
  const studentsTotal = summary?.totalStudents ?? 0
  const studentsRecorded = summary?.totalRecorded ?? 0
  // Rate among recorded = attending ÷ RECORDED, computed here. The aggregate's
  // `attendanceRate` is the coverage-deflated blend (present ÷ enrolled), which
  // is exactly the artifact this dashboard reframes — never show it as the
  // recorded rate. Attending = present + late + remote (the counting policy's
  // attendingCategories); excused counts as absent for the rate (Nepal default).
  const attending = (summary?.present ?? 0) + (summary?.late ?? 0) + (summary?.remote ?? 0)
  const recordedRate = studentsRecorded > 0 ? (attending / studentsRecorded) * 100 : 0

  return {
    sectionCount,
    full,
    partial,
    notStarted,
    covWeightedPct,
    studentsRecorded,
    studentsTotal,
    recordedRate,
  }
}

export type RiskBand = 'chronic' | 'atrisk' | 'watch'

/**
 * Risk band by attendance rate. `atRiskThreshold` comes from the school's
 * counting policy (default 90); chronic is the fixed <70 "chronic absence"
 * convention (the aggregate only returns students below the at-risk threshold,
 * so `watch` never appears in that list — it's the >threshold cohort).
 */
export function riskBand(rate: number, atRiskThreshold = 90, chronicThreshold = 70): RiskBand {
  if (rate < chronicThreshold) return 'chronic'
  if (rate < atRiskThreshold) return 'atrisk'
  return 'watch'
}

export interface RankedAlert extends AttendanceAlert {
  band: RiskBand
}

/**
 * Dedupe the aggregate's at-risk rows by studentId (keeping the worst rate — same
 * discipline as the Gradebook at-risk list), tag each with a band, and sort
 * worst-first. `watch`-band rows (≥ threshold) are dropped from the list.
 */
export function rankAtRisk(
  alerts: AttendanceAlert[],
  atRiskThreshold = 90,
  chronicThreshold = 70,
): RankedAlert[] {
  const byId = new Map<string, AttendanceAlert>()
  for (const a of alerts) {
    const prev = byId.get(a.studentId)
    if (!prev || a.attendanceRate < prev.attendanceRate) byId.set(a.studentId, a)
  }
  return [...byId.values()]
    .map((a) => ({ ...a, band: riskBand(a.attendanceRate, atRiskThreshold, chronicThreshold) }))
    .filter((a) => a.band !== 'watch')
    .sort((a, b) => a.attendanceRate - b.attendanceRate)
}

export interface GradeRateRow {
  gradeLevel: string
  rate: number
  present: number
  total: number
}

/**
 * Grade-level rate comparison rows (worst-first) from the aggregate's
 * `todaySummary.byGradeLevel`. Substitutes the prototype's per-section cohort
 * comparison, for which no per-section rate exists server-side.
 */
export function toGradeRates(
  byGradeLevel: Record<string, { total: number; present: number; absent: number; rate: number }> | undefined,
): GradeRateRow[] {
  if (!byGradeLevel) return []
  return Object.entries(byGradeLevel)
    .map(([gradeLevel, v]) => ({
      gradeLevel,
      rate: v.rate,
      present: v.present,
      total: v.total,
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => a.rate - b.rate)
}
