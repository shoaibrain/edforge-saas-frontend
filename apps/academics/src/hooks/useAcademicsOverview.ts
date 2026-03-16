/**
 * Academics Overview Hooks
 *
 * React Query hooks for the Academics Overview dashboard.
 * Orchestrates parallel data fetching for KPIs, charts, and alerts.
 */

import { useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePermission } from '@edforge/abac'
import {
  getDashboardOverview,
  getEnrollmentSummary,
  getSections,
  getAttendanceSummary,
  getAttendanceAlerts,
  getAttendanceTrend,
  type DashboardOverviewResponse,
  type EnrollmentSummaryResponse,
  type DailyAttendanceSummary,
  type AttendanceAlert,
  type SectionListResponseDto,
} from '../services/academics.service'
import { useSchoolStaff, flattenStaffData } from './useStaff'
import { useCurrentAcademicYear, useGradingPeriods } from './useSchool'
import type { GradingPeriodResponseDto } from '../services/school.service'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ClipboardCheck,
  GraduationCap,
} from 'lucide-react'

// ============================================================================
// DEBUG INSTRUMENTATION
// ============================================================================

const DEBUG = typeof localStorage !== 'undefined' && localStorage.getItem('edforge-debug') === 'true';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const overviewKeys = {
  all: ['academics-overview'] as const,
  dashboardOverview: (schoolId: string, yearId: string, date: string) =>
    [...overviewKeys.all, 'dashboard', schoolId, yearId, date] as const,
  enrollment: (schoolId: string, yearId: string) =>
    [...overviewKeys.all, 'enrollment', schoolId, yearId] as const,
  sections: (schoolId: string) =>
    [...overviewKeys.all, 'sections', schoolId] as const,
  attendance: (schoolId: string, date: string) =>
    [...overviewKeys.all, 'attendance', schoolId, date] as const,
}

// ============================================================================
// HELPERS
// ============================================================================

/** Get today's date as YYYY-MM-DD in local timezone */
export function getTodayISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Get a date N days ago as YYYY-MM-DD */
export function getDaysAgoISO(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Compute days between two ISO date strings */
function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA)
  const b = new Date(dateB)
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

// ============================================================================
// HOOK: useAcademicsOverview — Core KPI data
// ============================================================================

export interface AcademicsOverviewData {
  totalEnrolled: number | null
  enrollmentByGradeLevel: Record<string, number> | null
  enrollmentByStatus: Record<string, number> | null
  activeSections: number | null
  sectionsList: SectionListResponseDto | null
  todayAttendanceRate: number | null
  todayAttendanceSummary: DailyAttendanceSummary | null
  isLoading: boolean
  isPartiallyLoaded: boolean
  errors: Array<{ source: string; error: Error }>
}

export function useAcademicsOverview(
  schoolId: string | null,
  academicYearId: string | undefined
): AcademicsOverviewData {
  const today = useMemo(() => getTodayISO(), [])
  const enabled = !!schoolId && !!academicYearId

  // ABAC: skip enrollment API if user lacks enrollment:view permission
  const canViewEnrollment = usePermission('view', 'enrollment', schoolId ?? undefined)

  // Primary: unified dashboard overview endpoint (1 call instead of 3)
  const dashboard = useQuery<DashboardOverviewResponse, Error>({
    queryKey: overviewKeys.dashboardOverview(schoolId!, academicYearId!, today),
    queryFn: () => getDashboardOverview(schoolId!, academicYearId!, today),
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })

  // Fallback: individual queries if unified endpoint fails (e.g., 404 before backend deploy)
  const unifiedFailed = dashboard.isError
  const fallbackEnabled = enabled && unifiedFailed

  const enrollment = useQuery<EnrollmentSummaryResponse, Error>({
    queryKey: overviewKeys.enrollment(schoolId!, academicYearId!),
    queryFn: () => getEnrollmentSummary(schoolId!, academicYearId!),
    enabled: fallbackEnabled && canViewEnrollment,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })

  const sections = useQuery<SectionListResponseDto, Error>({
    queryKey: overviewKeys.sections(schoolId!),
    queryFn: () =>
      getSections({
        schoolId: schoolId!,
        isActive: true,
        academicYearId,
        limit: 200,
      }),
    enabled: fallbackEnabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })

  const attendance = useQuery<DailyAttendanceSummary, Error>({
    queryKey: overviewKeys.attendance(schoolId!, today),
    queryFn: () => getAttendanceSummary(schoolId!, today),
    enabled: fallbackEnabled,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })

  // Debug: log which query strategy is active
  const prevStrategy = useRef<string | null>(null)
  useEffect(() => {
    if (!DEBUG) return
    const strategy = unifiedFailed ? 'fallback' : 'unified'
    if (prevStrategy.current !== strategy) {
      console.debug('[Academics Overview] Query strategy:', strategy, {
        dashboardStatus: dashboard.status,
        dashboardError: dashboard.error?.message,
      })
      prevStrategy.current = strategy
    }
  }, [unifiedFailed, dashboard.status, dashboard.error])

  // Debug: log individual query success/failure
  useEffect(() => {
    if (!DEBUG || !fallbackEnabled) return
    console.debug('[Academics Overview] Fallback query states:', {
      enrollment: enrollment.status + (enrollment.error ? ` (${enrollment.error.message})` : ''),
      sections: sections.status + (sections.error ? ` (${sections.error.message})` : ''),
      attendance: attendance.status + (attendance.error ? ` (${attendance.error.message})` : ''),
    })
  }, [fallbackEnabled, enrollment.status, sections.status, attendance.status, enrollment.error, sections.error, attendance.error])

  // Aggregate: prefer unified, fall back to individual
  if (dashboard.isSuccess && dashboard.data) {
    const d = dashboard.data

    // Debug: data consistency check on unified response
    if (DEBUG) {
      const hasEnrollment = d.enrollment != null
      const hasAttendance = d.attendance != null
      const hasSections = d.activeSectionsCount != null
      if (!hasEnrollment || !hasAttendance || !hasSections) {
        console.debug('[Academics Overview] Unified response missing data:', {
          hasEnrollment, hasAttendance, hasSections,
        })
      }
    }

    return {
      totalEnrolled: canViewEnrollment ? d.enrollment.totalEnrolled : null,
      enrollmentByGradeLevel: canViewEnrollment ? d.enrollment.byGradeLevel : null,
      enrollmentByStatus: canViewEnrollment ? d.enrollment.byStatus : null,
      activeSections: d.activeSectionsCount,
      sectionsList: null, // Unified endpoint doesn't return full sections list
      todayAttendanceRate: d.attendance?.attendanceRate ?? null,
      todayAttendanceSummary: d.attendance
        ? {
            date: d.attendance.date,
            totalStudents: d.attendance.totalStudents,
            totalRecorded: d.attendance.totalRecorded,
            present: d.attendance.present,
            absent: d.attendance.absent,
            late: d.attendance.late,
            excused: d.attendance.excused,
            attendanceRate: d.attendance.attendanceRate,
          } as DailyAttendanceSummary
        : null,
      isLoading: false,
      isPartiallyLoaded: true,
      errors: [],
    }
  }

  // Fallback aggregation
  const isLoading = unifiedFailed
    ? enrollment.isLoading || sections.isLoading || attendance.isLoading
    : dashboard.isLoading
  const isPartiallyLoaded =
    !isLoading && (enrollment.isSuccess || sections.isSuccess || attendance.isSuccess)
  const errors: Array<{ source: string; error: Error }> = []
  if (fallbackEnabled) {
    if (enrollment.error) errors.push({ source: 'enrollment', error: enrollment.error })
    if (sections.error) errors.push({ source: 'sections', error: sections.error })
    if (attendance.error) errors.push({ source: 'attendance', error: attendance.error })
  }

  // Debug: data consistency check on fallback
  if (DEBUG && isPartiallyLoaded) {
    console.debug('[Academics Overview] Fallback partial data:', {
      hasEnrollment: enrollment.isSuccess,
      hasSections: sections.isSuccess,
      hasAttendance: attendance.isSuccess,
      errorCount: errors.length,
    })
  }

  return {
    totalEnrolled: enrollment.data?.totalEnrolled ?? null,
    enrollmentByGradeLevel: enrollment.data?.byGradeLevel ?? null,
    enrollmentByStatus: enrollment.data?.byStatus ?? null,
    activeSections: sections.data ? sections.data.items.length : null,
    sectionsList: sections.data ?? null,
    todayAttendanceRate: attendance.data?.attendanceRate ?? null,
    todayAttendanceSummary: attendance.data ?? null,
    isLoading,
    isPartiallyLoaded,
    errors,
  }
}

// ============================================================================
// HOOK: useActiveTeacherCount — Teacher count from Identity service
// ============================================================================

export interface TeacherCountData {
  teacherCount: number | null
  onLeaveCount: number | null
  isLoading: boolean
  isError: boolean
}

export function useActiveTeacherCount(schoolId: string | null): TeacherCountData {
  const { data: staffData, isLoading, isError } = useSchoolStaff(schoolId ?? '', !!schoolId)

  return useMemo(() => {
    if (!staffData || isLoading) {
      return { teacherCount: null, onLeaveCount: null, isLoading, isError }
    }

    const allStaff = flattenStaffData(staffData)
    const teachers = allStaff.filter(
      (s: any) => s.role === 'teacher' || s.staffRole === 'teacher'
    )
    const activeTeachers = teachers.filter(
      (s: any) => s.employmentStatus === 'active' || s.status === 'active'
    )
    const onLeave = teachers.filter(
      (s: any) => s.employmentStatus === 'on_leave'
    )

    return {
      teacherCount: activeTeachers.length,
      onLeaveCount: onLeave.length,
      isLoading,
      isError,
    }
  }, [staffData, isLoading, isError])
}

// ============================================================================
// HOOK: useEnrollmentDistribution — Chart-ready enrollment data
// ============================================================================

export interface GradeLevelDistribution {
  gradeLevel: string
  displayLabel: string
  count: number
  percentage: number
}

const GRADE_ORDER: Record<string, number> = {
  'pre-k': -1, 'prek': -1, 'pk': -1,
  'k': 0, 'kindergarten': 0, 'kg': 0,
  '1': 1, '1st': 1, '2': 2, '2nd': 2, '3': 3, '3rd': 3,
  '4': 4, '4th': 4, '5': 5, '5th': 5, '6': 6, '6th': 6,
  '7': 7, '7th': 7, '8': 8, '8th': 8, '9': 9, '9th': 9,
  '10': 10, '10th': 10, '11': 11, '11th': 11, '12': 12, '12th': 12,
}

function gradeSort(a: string, b: string): number {
  const aOrder = GRADE_ORDER[a.toLowerCase()] ?? 99
  const bOrder = GRADE_ORDER[b.toLowerCase()] ?? 99
  if (aOrder !== bOrder) return aOrder - bOrder
  return a.localeCompare(b)
}

function formatGradeLabel(grade: string): string {
  const lower = grade.toLowerCase()
  if (lower === 'k' || lower === 'kindergarten' || lower === 'kg') return 'Kindergarten'
  if (lower === 'pre-k' || lower === 'prek' || lower === 'pk') return 'Pre-K'
  const num = parseInt(grade, 10)
  if (!isNaN(num)) {
    const suffix = num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th'
    return `${num}${suffix} Grade`
  }
  return grade
}

export function useEnrollmentDistribution(
  enrollmentByGradeLevel: Record<string, number> | null
): { data: GradeLevelDistribution[]; total: number } {
  return useMemo(() => {
    if (!enrollmentByGradeLevel) return { data: [], total: 0 }

    const entries = Object.entries(enrollmentByGradeLevel)
    const total = entries.reduce((sum, [, count]) => sum + count, 0)

    const data: GradeLevelDistribution[] = entries
      .map(([gradeLevel, count]) => ({
        gradeLevel,
        displayLabel: formatGradeLabel(gradeLevel),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => gradeSort(a.gradeLevel, b.gradeLevel))

    return { data, total }
  }, [enrollmentByGradeLevel])
}

// ============================================================================
// HOOK: useAttendanceTrendData — Chart-ready attendance trend
// ============================================================================

export interface AttendanceTrendPoint {
  date: string
  displayDate: string
  rate: number
  present: number
  absent: number
  total: number
}

export function useAttendanceTrendData(
  schoolId: string | null,
  enabled: boolean = true
) {
  const today = useMemo(() => getTodayISO(), [])
  const startDate = useMemo(() => getDaysAgoISO(30), [])

  const { data, isLoading, isError } = useQuery<DailyAttendanceSummary[], Error>({
    queryKey: [...overviewKeys.all, 'trend', schoolId, startDate, today],
    queryFn: () => getAttendanceTrend(schoolId!, startDate, today),
    enabled: enabled && !!schoolId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const chartData = useMemo<AttendanceTrendPoint[]>(() => {
    if (!data) return []
    return data.map((d) => {
      const dateObj = new Date(d.date)
      return {
        date: d.date,
        displayDate: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
        rate: d.attendanceRate,
        present: d.present,
        absent: d.absent,
        total: d.totalStudents,
      }
    })
  }, [data])

  const summary = useMemo(() => {
    if (chartData.length === 0) return null
    const rates = chartData.map((d) => d.rate)
    return {
      min: Math.min(...rates),
      max: Math.max(...rates),
      avg: rates.reduce((a, b) => a + b, 0) / rates.length,
    }
  }, [chartData])

  return { chartData, summary, isLoading, isError }
}

// ============================================================================
// HOOK: useAcademicAlerts — Unified alert system
// ============================================================================

export interface AcademicAlert {
  id: string
  type: 'attendance' | 'staffing' | 'grading' | 'enrollment'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  count?: number
  href: string
  severityIcon: LucideIcon
  typeIcon: LucideIcon
}

function useAttendanceAlertItems(
  schoolId: string | null,
  academicYearId: string | undefined,
  enabled: boolean
): { alerts: AcademicAlert[]; isLoading: boolean } {
  const today = useMemo(() => getTodayISO(), [])
  const startDate = useMemo(() => getDaysAgoISO(90), [])

  const { data, isLoading } = useQuery<AttendanceAlert[], Error>({
    queryKey: [...overviewKeys.all, 'alerts-attendance', schoolId],
    queryFn: () =>
      getAttendanceAlerts(schoolId!, academicYearId!, 90, startDate, today),
    enabled: enabled && !!schoolId && !!academicYearId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const alerts = useMemo<AcademicAlert[]>(() => {
    if (!data || data.length === 0) return []

    const criticalCount = data.filter((a) => a.attendanceRate < 80).length
    const warningCount = data.filter(
      (a) => a.attendanceRate >= 80 && a.attendanceRate < 90
    ).length

    const items: AcademicAlert[] = []

    if (criticalCount > 0) {
      items.push({
        id: 'attendance-critical',
        type: 'attendance',
        severity: 'critical',
        title: `${criticalCount} student${criticalCount !== 1 ? 's' : ''} below 80% attendance`,
        description: 'Immediate intervention may be needed',
        count: criticalCount,
        href: '/classrooms?tab=attendance',
        severityIcon: AlertTriangle,
        typeIcon: ClipboardCheck,
      })
    }

    if (warningCount > 0) {
      items.push({
        id: 'attendance-warning',
        type: 'attendance',
        severity: 'warning',
        title: `${warningCount} student${warningCount !== 1 ? 's' : ''} below 90% attendance`,
        description: 'Attendance rate below school threshold',
        count: warningCount,
        href: '/classrooms?tab=attendance',
        severityIcon: AlertCircle,
        typeIcon: ClipboardCheck,
      })
    }

    return items
  }, [data])

  return { alerts, isLoading }
}

function useGradingDeadlineAlerts(
  schoolId: string | null,
  academicYearId: string | undefined,
  enabled: boolean
): { alerts: AcademicAlert[]; isLoading: boolean } {
  const { data: periods, isLoading } = useGradingPeriods(
    schoolId ?? '',
    academicYearId ?? '',
    enabled && !!schoolId && !!academicYearId
  )

  const alerts = useMemo<AcademicAlert[]>(() => {
    if (!periods) return []
    const today = getTodayISO()
    const items: AcademicAlert[] = []

    for (const period of periods) {
      const dueDate = period.gradesDueDate
      if (!dueDate) continue

      const daysUntil = daysBetween(today, dueDate)

      if (daysUntil < 0) {
        items.push({
          id: `grading-overdue-${period.periodId}`,
          type: 'grading',
          severity: 'critical',
          title: `Grades overdue for ${period.name}`,
          description: `Due date was ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} ago`,
          href: '/classrooms?tab=gradebook',
          severityIcon: AlertTriangle,
          typeIcon: GraduationCap,
        })
      } else if (daysUntil <= 7) {
        items.push({
          id: `grading-due-${period.periodId}`,
          type: 'grading',
          severity: 'warning',
          title: `Grades due for ${period.name} in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
          description: `Due ${new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          href: '/classrooms?tab=gradebook',
          severityIcon: AlertCircle,
          typeIcon: GraduationCap,
        })
      } else if (daysUntil <= 30) {
        items.push({
          id: `grading-upcoming-${period.periodId}`,
          type: 'grading',
          severity: 'info',
          title: `Grades due for ${period.name} in ${daysUntil} days`,
          description: `Due ${new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          href: '/classrooms?tab=gradebook',
          severityIcon: Info,
          typeIcon: GraduationCap,
        })
      }
    }

    return items
  }, [periods])

  return { alerts, isLoading }
}

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 }

export function useCombinedAlerts(
  schoolId: string | null,
  academicYearId: string | undefined,
  deferEnabled: boolean = true,
): {
  alerts: AcademicAlert[]
  totalCount: number
  isLoading: boolean
} {
  const enabled = !!schoolId && !!academicYearId && deferEnabled

  const attendance = useAttendanceAlertItems(schoolId, academicYearId, enabled)
  const grading = useGradingDeadlineAlerts(schoolId, academicYearId, enabled)

  const isLoading = attendance.isLoading || grading.isLoading

  const alerts = useMemo(() => {
    const combined = [...attendance.alerts, ...grading.alerts]
    combined.sort((a, b) => {
      const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
      if (severityDiff !== 0) return severityDiff
      return a.type.localeCompare(b.type)
    })
    return combined.slice(0, 10)
  }, [attendance.alerts, grading.alerts])

  return {
    alerts,
    totalCount: attendance.alerts.length + grading.alerts.length,
    isLoading,
  }
}

// ============================================================================
// HOOK: useAcademicCalendarContext — Current term context
// ============================================================================

export interface AcademicCalendarContext {
  currentYear: { name: string; startDate: string; endDate: string } | null
  currentTerm: GradingPeriodResponseDto | null
  daysRemainingInTerm: number | null
  termProgressPercent: number | null
  daysRemainingInYear: number | null
  nextDeadline: { name: string; date: string; daysUntil: number } | null
  isLoading: boolean
  isBetweenTerms: boolean
}

export function useAcademicCalendarContext(
  schoolId: string | null,
  academicYearId: string | undefined
): AcademicCalendarContext {
  const {
    data: currentYear,
    isLoading: yearLoading,
  } = useCurrentAcademicYear(schoolId ?? '', !!schoolId)

  const {
    data: periods,
    isLoading: periodsLoading,
  } = useGradingPeriods(
    schoolId ?? '',
    academicYearId ?? '',
    !!schoolId && !!academicYearId
  )

  return useMemo(() => {
    const isLoading = yearLoading || periodsLoading
    const nullResult: AcademicCalendarContext = {
      currentYear: null,
      currentTerm: null,
      daysRemainingInTerm: null,
      termProgressPercent: null,
      daysRemainingInYear: null,
      nextDeadline: null,
      isLoading,
      isBetweenTerms: false,
    }

    if (!currentYear || isLoading) return nullResult

    const today = getTodayISO()

    // Find current term
    let currentTerm: GradingPeriodResponseDto | null = null
    if (periods) {
      currentTerm =
        periods.find(
          (p) => today >= p.startDate && today <= p.endDate
        ) ?? null
    }

    // Days remaining in term
    let daysRemainingInTerm: number | null = null
    let termProgressPercent: number | null = null
    if (currentTerm) {
      daysRemainingInTerm = daysBetween(today, currentTerm.endDate)
      const totalTermDays = daysBetween(currentTerm.startDate, currentTerm.endDate)
      const daysSinceStart = daysBetween(currentTerm.startDate, today)
      termProgressPercent =
        totalTermDays > 0
          ? Math.min(100, Math.max(0, Math.round((daysSinceStart / totalTermDays) * 100)))
          : 0
    }

    // Days remaining in year
    const daysRemainingInYear = daysBetween(today, currentYear.endDate)

    // Next grading deadline
    let nextDeadline: { name: string; date: string; daysUntil: number } | null = null
    if (periods) {
      for (const p of periods.sort((a, b) => (a.gradesDueDate ?? '').localeCompare(b.gradesDueDate ?? ''))) {
        if (p.gradesDueDate && p.gradesDueDate >= today) {
          nextDeadline = {
            name: p.name,
            date: p.gradesDueDate,
            daysUntil: daysBetween(today, p.gradesDueDate),
          }
          break
        }
      }
    }

    const isBetweenTerms = !currentTerm && !!periods && periods.length > 0

    return {
      currentYear: {
        name: currentYear.name,
        startDate: currentYear.startDate,
        endDate: currentYear.endDate,
      },
      currentTerm,
      daysRemainingInTerm,
      termProgressPercent,
      daysRemainingInYear,
      nextDeadline,
      isLoading,
      isBetweenTerms,
    }
  }, [currentYear, periods, yearLoading, periodsLoading])
}
