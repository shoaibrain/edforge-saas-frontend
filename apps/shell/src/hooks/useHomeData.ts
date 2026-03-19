/**
 * Home Page Data Hooks
 *
 * React Query hooks for the home page command center.
 * Orchestrates parallel data fetching from academics and finance APIs.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDashboardSummary } from '@edforge/finance-services'
import {
  getAcademicsOverview,
  getAttendanceAlerts,
  getAttendanceTrend,
  getCurrentAcademicYear,
  getTeacherSections,
  type AcademicsOverviewResponse,
  type AttendanceAlertItem,
  type DailyAttendanceSummary,
  type TeacherSectionItem,
} from '../services/home.service'

// ============================================================================
// HELPERS
// ============================================================================

function getTodayISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDaysAgoISO(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const homeKeys = {
  all: ['home'] as const,
  academicYear: (schoolId: string) =>
    [...homeKeys.all, 'academic-year', schoolId] as const,
  overview: (schoolId: string, yearId: string, date: string) =>
    [...homeKeys.all, 'overview', schoolId, yearId, date] as const,
  alerts: (schoolId: string, yearId: string) =>
    [...homeKeys.all, 'alerts', schoolId, yearId] as const,
  trend: (schoolId: string) =>
    [...homeKeys.all, 'trend', schoolId] as const,
  teacherSections: (schoolId: string) =>
    [...homeKeys.all, 'teacher-sections', schoolId] as const,
}

// ============================================================================
// HOOK: useHomeAcademicYear
// ============================================================================

export function useHomeAcademicYear(schoolId: string | null) {
  return useQuery({
    queryKey: homeKeys.academicYear(schoolId!),
    queryFn: () => getCurrentAcademicYear(schoolId!),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ============================================================================
// HOOK: useAcademicsSnapshot — Core KPI data for admin
// ============================================================================

export function useAcademicsSnapshot(
  schoolId: string | null,
  academicYearId: string | undefined,
) {
  const today = useMemo(() => getTodayISO(), [])

  const query = useQuery<AcademicsOverviewResponse, Error>({
    queryKey: homeKeys.overview(schoolId!, academicYearId!, today),
    queryFn: () => getAcademicsOverview(schoolId!, academicYearId!, today),
    enabled: !!schoolId && !!academicYearId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  })

  return {
    totalEnrolled: query.data?.enrollment?.totalEnrolled ?? null,
    activeSections: query.data?.activeSectionsCount ?? null,
    todayAttendanceRate: query.data?.attendance?.attendanceRate ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}

// ============================================================================
// HOOK: useHomeAlerts — Attendance + finance alerts for admin
// ============================================================================

export interface HomeAlert {
  id: string
  severity: 'critical' | 'warning'
  title: string
  description: string
  count?: number
  href: string
  module: 'academics' | 'finance'
}

export function useHomeAlerts(
  schoolId: string | null,
  academicYearId: string | undefined,
  financeOverdue: number | undefined,
  enabled: boolean,
) {
  const today = useMemo(() => getTodayISO(), [])
  const startDate = useMemo(() => getDaysAgoISO(90), [])

  const attendanceQuery = useQuery<AttendanceAlertItem[], Error>({
    queryKey: homeKeys.alerts(schoolId!, academicYearId!),
    queryFn: () =>
      getAttendanceAlerts(schoolId!, academicYearId!, 90, startDate, today),
    enabled: enabled && !!schoolId && !!academicYearId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const alerts = useMemo<HomeAlert[]>(() => {
    const items: HomeAlert[] = []

    if (attendanceQuery.data) {
      const criticalCount = attendanceQuery.data.filter(
        (a) => a.attendanceRate < 80,
      ).length
      const warningCount = attendanceQuery.data.filter(
        (a) => a.attendanceRate >= 80 && a.attendanceRate < 90,
      ).length

      if (criticalCount > 0) {
        items.push({
          id: 'attendance-critical',
          severity: 'critical',
          title: `${criticalCount} student${criticalCount !== 1 ? 's' : ''} below 80% attendance`,
          description: 'Immediate intervention may be needed',
          count: criticalCount,
          href: '/academics/classrooms?tab=attendance',
          module: 'academics',
        })
      }

      if (warningCount > 0) {
        items.push({
          id: 'attendance-warning',
          severity: 'warning',
          title: `${warningCount} student${warningCount !== 1 ? 's' : ''} below 90% attendance`,
          description: 'Attendance rate below school threshold',
          count: warningCount,
          href: '/academics/classrooms?tab=attendance',
          module: 'academics',
        })
      }
    }

    if (financeOverdue != null && financeOverdue > 0) {
      items.push({
        id: 'finance-overdue',
        severity: 'warning',
        title: 'Overdue invoices need attention',
        description: `Outstanding overdue amount requires follow-up`,
        href: '/finance/billing',
        module: 'finance',
      })
    }

    return items
  }, [attendanceQuery.data, financeOverdue])

  return {
    alerts,
    isLoading: attendanceQuery.isLoading,
  }
}

// ============================================================================
// HOOK: useHomeAttendanceTrend — 30-day chart data
// ============================================================================

export interface TrendPoint {
  date: string
  displayDate: string
  rate: number
  present: number
  absent: number
  total: number
}

export function useHomeAttendanceTrend(
  schoolId: string | null,
  enabled: boolean = true,
) {
  const today = useMemo(() => getTodayISO(), [])
  const startDate = useMemo(() => getDaysAgoISO(30), [])

  const query = useQuery<DailyAttendanceSummary[], Error>({
    queryKey: homeKeys.trend(schoolId!),
    queryFn: () => getAttendanceTrend(schoolId!, startDate, today),
    enabled: enabled && !!schoolId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const chartData = useMemo<TrendPoint[]>(() => {
    if (!query.data) return []
    return query.data.map((d) => {
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
  }, [query.data])

  const summary = useMemo(() => {
    if (chartData.length === 0) return null
    const rates = chartData.map((d) => d.rate)
    return {
      min: Math.min(...rates),
      max: Math.max(...rates),
      avg: rates.reduce((a, b) => a + b, 0) / rates.length,
    }
  }, [chartData])

  return { chartData, summary, isLoading: query.isLoading, isError: query.isError }
}

// ============================================================================
// HOOK: useFinanceSummary — Reuses @edforge/finance-services
// ============================================================================

export function useFinanceSummary(schoolId: string | null) {
  return useDashboardSummary(schoolId ?? '')
}

// ============================================================================
// HOOK: useHomeTeacherSections — Teacher's assigned sections
// ============================================================================

export function useHomeTeacherSections(
  schoolId: string | null,
  academicYearId: string | undefined,
) {
  const query = useQuery({
    queryKey: homeKeys.teacherSections(schoolId!),
    queryFn: () => getTeacherSections(schoolId!, academicYearId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const sections = useMemo<TeacherSectionItem[]>(
    () => query.data?.items ?? [],
    [query.data],
  )

  return {
    sections,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
