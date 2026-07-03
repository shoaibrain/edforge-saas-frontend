/**
 * Home Page Data Hooks — V2
 *
 * React Query hooks for the home page command center.
 * Orchestrates parallel data fetching from academics and finance APIs.
 *
 * Debug mode: set `localStorage.setItem('edforge-debug', 'true')` to enable
 * console logging for query strategies, fallback states, and data consistency.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDashboardSummary } from '@edforge/finance-services'
import { useCurrency } from '@edforge/types/use-currency'
import type { DashboardSummary } from '@edforge/types'
import { useSettings } from '../lib/shell-context'
import {
  getAcademicsOverview,
  getEnrollmentSummary,
  getAttendanceSummaryForDate,
  getAttendanceAlerts,
  getAttendanceTrend,
  getAttendanceOverview,
  getCurrentAcademicYear,
  getTeacherSections,
  type AcademicsOverviewResponse,
  type EnrollmentSummaryResponse,
  type AttendanceAlertItem,
  type AttendanceOverviewResponse,
  type DailyAttendanceSummary,
  type TeacherSectionItem,
} from '../services/home.service'
import type { ActivityItem } from '../components/home/RecentActivityFeed'
import type { SectionAttendanceItem } from '../components/home/AttendanceBySectionCard'

// ============================================================================
// CONSTANTS
// ============================================================================

export const ATTENDANCE_THRESHOLD = 80

// ============================================================================
// DEBUG LOGGING (Ticket 1.2)
// ============================================================================

const DEBUG =
  typeof window !== 'undefined' &&
  localStorage.getItem('edforge-debug') === 'true'

function debugLog(tag: string, ...args: unknown[]) {
  if (DEBUG) console.log(`[Home:${tag}]`, ...args)
}

// ============================================================================
// RETRY DELAY — Exponential backoff (Ticket 1.2)
// ============================================================================

const retryDelay = (attempt: number) => Math.min(1000 * 2 ** attempt, 10000)

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

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - eventDay.getTime()) / (1000 * 60 * 60 * 24))

  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  if (diffDays === 0) return `Today · ${time}`
  if (diffDays === 1) return `Yesterday · ${time}`
  return `${diffDays} days ago · ${time}`
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
  enrollmentFallback: (schoolId: string, yearId: string) =>
    [...homeKeys.all, 'enrollment-fallback', schoolId, yearId] as const,
  attendanceFallback: (schoolId: string, date: string) =>
    [...homeKeys.all, 'attendance-fallback', schoolId, date] as const,
  sectionsFallback: (schoolId: string) =>
    [...homeKeys.all, 'sections-fallback', schoolId] as const,
  alerts: (schoolId: string, yearId: string) =>
    [...homeKeys.all, 'alerts', schoolId, yearId] as const,
  trend: (schoolId: string) =>
    [...homeKeys.all, 'trend', schoolId] as const,
  // Ticket 1.4: include academicYearId in teacher sections key
  teacherSections: (schoolId: string, academicYearId?: string) =>
    [...homeKeys.all, 'teacher-sections', schoolId, academicYearId ?? 'none'] as const,
  attendanceOverview: (schoolId: string, yearId: string, date: string) =>
    [...homeKeys.all, 'attendance-overview', schoolId, yearId, date] as const,
}

// ============================================================================
// HOOK: useHomeAcademicYear
// ============================================================================

export function useHomeAcademicYear(schoolId: string | null) {
  // The current AY changes once per year. Background polling here is pure noise —
  // the value React Query already has is correct for the entire session.
  return useQuery({
    queryKey: homeKeys.academicYear(schoolId!),
    queryFn: () => getCurrentAcademicYear(schoolId!),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retryDelay,
  })
}

// ============================================================================
// HOOK: useAcademicsSnapshot — Core KPI data for admin
// Ticket 1.3a: per-field availability flags
// Ticket 1.3b: conditional fallback queries for partial responses
// Ticket 1.2: debug logging + exponential backoff
// ============================================================================

export function useAcademicsSnapshot(
  schoolId: string | null,
  academicYearId: string | undefined,
) {
  const today = useMemo(() => getTodayISO(), [])
  const enabled = !!schoolId && !!academicYearId

  // Primary: unified dashboard overview endpoint.
  // Enrollment + attendance + sections change on user action (roll submission,
  // student enrollment), not on a clock. React Query revalidates on navigation
  // back to Home after staleTime; explicit mutations invalidate this key.
  const dashboard = useQuery<AcademicsOverviewResponse, Error>({
    queryKey: homeKeys.overview(schoolId!, academicYearId!, today),
    queryFn: () => getAcademicsOverview(schoolId!, academicYearId!, today),
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay,
  })

  // Ticket 1.3a: derive per-field availability flags
  const hasEnrollment = dashboard.isSuccess && dashboard.data?.enrollment != null
  const hasAttendance = dashboard.isSuccess && dashboard.data?.attendance != null
  const hasSections = dashboard.isSuccess && dashboard.data?.activeSectionsCount != null

  // Ticket 1.3b: individual fallback queries — enabled when unified fails
  // OR when unified succeeds but a specific field is null
  const unifiedFailed = dashboard.isError

  const enrollment = useQuery<EnrollmentSummaryResponse, Error>({
    queryKey: homeKeys.enrollmentFallback(schoolId!, academicYearId!),
    queryFn: () => getEnrollmentSummary(schoolId!, academicYearId!),
    enabled: enabled && (unifiedFailed || (dashboard.isSuccess && !hasEnrollment)),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay,
  })

  const attendance = useQuery<DailyAttendanceSummary, Error>({
    queryKey: homeKeys.attendanceFallback(schoolId!, today),
    queryFn: () => getAttendanceSummaryForDate(schoolId!, today),
    enabled: enabled && (unifiedFailed || (dashboard.isSuccess && !hasAttendance)),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay,
  })

  const sections = useQuery<{ items: TeacherSectionItem[] }, Error>({
    queryKey: homeKeys.sectionsFallback(schoolId!),
    queryFn: () => getTeacherSections(schoolId!, academicYearId),
    enabled: enabled && (unifiedFailed || (dashboard.isSuccess && !hasSections)),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay,
  })

  // Ticket 1.2: debug logging for query strategy changes
  const prevStrategyRef = useRef<string>('')
  useEffect(() => {
    const strategy = unifiedFailed
      ? 'fallback-all'
      : dashboard.isSuccess
        ? (!hasEnrollment || !hasAttendance || !hasSections)
          ? 'partial-fallback'
          : 'unified'
        : 'loading'

    if (strategy !== prevStrategyRef.current) {
      prevStrategyRef.current = strategy
      debugLog('snapshot', `Strategy: ${strategy}`, {
        hasEnrollment,
        hasAttendance,
        hasSections,
        unifiedFailed,
      })
    }

    if (unifiedFailed) {
      debugLog('snapshot', 'Fallback states:', {
        enrollment: enrollment.status,
        attendance: attendance.status,
        sections: sections.status,
      })
    }

    // Log data consistency warnings
    if (dashboard.isSuccess && dashboard.data) {
      if (!hasEnrollment) debugLog('snapshot', 'WARN: unified response has null enrollment')
      if (!hasAttendance) debugLog('snapshot', 'WARN: unified response has null attendance')
      if (!hasSections) debugLog('snapshot', 'WARN: unified response has null activeSectionsCount')
    }
  }, [
    unifiedFailed, dashboard.isSuccess, dashboard.data,
    hasEnrollment, hasAttendance, hasSections,
    enrollment.status, attendance.status, sections.status,
  ])

  // Ticket 1.3b: merge — prefer unified data per field, then fallback per field
  const totalEnrolled = hasEnrollment
    ? dashboard.data!.enrollment!.totalEnrolled
    : enrollment.data?.totalEnrolled ?? null

  const activeSections = hasSections
    ? dashboard.data!.activeSectionsCount!
    : sections.data ? sections.data.items.length : null

  const todayAttendanceRate = hasAttendance
    ? dashboard.data!.attendance!.attendanceRate
    : attendance.data?.attendanceRate ?? null

  const isLoading = unifiedFailed
    ? enrollment.isLoading || attendance.isLoading || sections.isLoading
    : dashboard.isLoading

  const isError = unifiedFailed
    && enrollment.isError && attendance.isError && sections.isError

  return {
    totalEnrolled,
    activeSections,
    todayAttendanceRate,
    isLoading,
    isError,
    refetch: dashboard.refetch,
  }
}

// ============================================================================
// HOOK: useHomeAlerts — V2 with detailed context
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
  financeSummary: {
    overdue?: number
    collectionRate?: number
    overdueCount?: number
  } | undefined,
  todayAttendanceRate: number | null,
  trendAvg: number | null,
  enabled: boolean,
) {
  const settings = useSettings()
  const { formatShort } = useCurrency(settings)
  const today = useMemo(() => getTodayISO(), [])
  const startDate = useMemo(() => getDaysAgoISO(90), [])

  // Attendance data is teacher-driven (only changes when a roll is submitted), so
  // background polling produces network noise without freshness gain. React Query
  // already revalidates whenever the user navigates back to Home after staleTime,
  // and explicit mutations can invalidate this key when needed.
  const attendanceQuery = useQuery<AttendanceAlertItem[], Error>({
    queryKey: homeKeys.alerts(schoolId!, academicYearId!),
    queryFn: () =>
      getAttendanceAlerts(schoolId!, academicYearId!, 90, startDate, today),
    enabled: enabled && !!schoolId && !!academicYearId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retryDelay,
  })

  const alerts = useMemo<HomeAlert[]>(() => {
    const items: HomeAlert[] = []

    // Finance overdue alert (show first — critical if overdue > 0)
    if (financeSummary?.overdue != null && financeSummary.overdue > 0) {
      const overdueAmount = formatShort(financeSummary.overdue)
      const rate = financeSummary.collectionRate ?? 0
      items.push({
        id: 'finance-overdue',
        severity: 'critical',
        title: `Overdue invoices — ${overdueAmount} uncollected`,
        description: `Collection rate is ${rate.toFixed(1)}%. Outstanding overdue amount requires follow-up.`,
        href: '/finance/billing',
        module: 'finance',
      })
    }

    // Attendance alert
    if (attendanceQuery.data) {
      const belowThreshold = attendanceQuery.data.filter(
        (a) => a.attendanceRate < ATTENDANCE_THRESHOLD,
      ).length

      if (belowThreshold > 0) {
        const rateStr = todayAttendanceRate != null ? ` — today ${todayAttendanceRate.toFixed(1)}%` : ''
        const avgStr = trendAvg != null ? `, 30-day avg ${trendAvg.toFixed(0)}%` : ''
        items.push({
          id: 'attendance-critical',
          severity: 'warning',
          title: `${belowThreshold} student${belowThreshold !== 1 ? 's' : ''} below ${ATTENDANCE_THRESHOLD}% attendance`,
          description: `Attendance requires intervention${rateStr}${avgStr}.`,
          count: belowThreshold,
          href: '/academics/classrooms?tab=attendance',
          module: 'academics',
        })
      }
    }

    return items
  }, [attendanceQuery.data, financeSummary, todayAttendanceRate, trendAvg, formatShort])

  return {
    alerts,
    alertCount: alerts.length,
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

  // 30-day rolling trend; sparse data that doesn't shift within a 5-minute window.
  const query = useQuery<DailyAttendanceSummary[], Error>({
    queryKey: homeKeys.trend(schoolId!),
    queryFn: () => getAttendanceTrend(schoolId!, startDate, today),
    enabled: enabled && !!schoolId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retryDelay,
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
// HOOK: useFinanceSummary — Extended for V2
// Ticket 1.9: Removed `as any` — uses proper DashboardSummary type
// ============================================================================

export interface FeeTypeBreakdown {
  totalAmount: number
  collectedAmount: number
  invoiceCount: number
}

export interface FinanceSummaryData {
  totalInvoiced: number
  totalCollected: number
  outstanding: number
  overdue: number
  collectionRate: number
  byFeeType?: Record<string, FeeTypeBreakdown>
  recentPayments?: Array<{
    id: string
    amount: number
    gateway: string
    status: string
    receiptNumber?: string
    paidAt?: string
    createdAt: string
  }>
}

export function useFinanceSummary(schoolId: string | null) {
  const query = useDashboardSummary(schoolId ?? '')

  const data = useMemo<FinanceSummaryData | null>(() => {
    if (!query.data) return null
    const d: DashboardSummary = query.data
    return {
      totalInvoiced: d.totalInvoiced ?? 0,
      totalCollected: d.totalCollected ?? 0,
      outstanding: d.outstanding ?? 0,
      overdue: d.overdue ?? 0,
      collectionRate: d.collectionRate ?? 0,
      byFeeType: Array.isArray(d.byFeeType)
        ? Object.fromEntries(
            d.byFeeType.map((f) => [
              f.feeType,
              {
                totalAmount: f.totalAmount ?? 0,
                collectedAmount: f.collectedAmount ?? 0,
                invoiceCount: f.invoiceCount ?? 0,
              },
            ])
          )
        : undefined,
      recentPayments: d.recentPayments,
    }
  }, [query.data])

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}

// ============================================================================
// HOOK: useHomeTeacherSections — Teacher's assigned sections
// Ticket 1.4: query key now includes academicYearId
// ============================================================================

export function useHomeTeacherSections(
  schoolId: string | null,
  academicYearId: string | undefined,
) {
  const query = useQuery({
    queryKey: homeKeys.teacherSections(schoolId!, academicYearId),
    queryFn: () => getTeacherSections(schoolId!, academicYearId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retryDelay,
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

// ============================================================================
// HOOK: useSectionAttendanceItems — Real section attendance from overview API
// ============================================================================

export function useSectionAttendanceItems(
  schoolId: string | null,
  academicYearId: string | undefined,
): { sections: SectionAttendanceItem[]; isLoading: boolean } {
  const today = useMemo(() => getTodayISO(), [])
  const enabled = !!schoolId && !!academicYearId

  const overview = useQuery<AttendanceOverviewResponse, Error>({
    queryKey: homeKeys.attendanceOverview(schoolId!, academicYearId!, today),
    queryFn: () => getAttendanceOverview(schoolId!, academicYearId!, today),
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay,
  })

  // Fallback to teacher sections list if overview endpoint not available
  const { sections: teacherSections, isLoading: sectionsLoading } =
    useHomeTeacherSections(schoolId, academicYearId)

  const items = useMemo<SectionAttendanceItem[]>(() => {
    // Prefer real attendance overview data
    if (overview.data?.sectionCompletion?.sections) {
      return overview.data.sectionCompletion.sections.map((s) => ({
        sectionId: s.sectionId,
        name: s.courseName
          ? `${s.sectionNumber} — ${s.courseName}`
          : s.sectionNumber,
        status: s.recordedCount > 0
          ? (s.recordedCount >= s.studentCount ? 'taken' as const : 'partial' as const)
          : 'pending' as const,
        studentCount: s.studentCount,
        recordedCount: s.recordedCount,
        attendanceRate: s.studentCount > 0 && s.recordedCount > 0
          ? undefined // Will be added from backend when available
          : undefined,
      }))
    }

    // Fallback: use teacher sections without real attendance status
    return teacherSections.slice(0, 8).map((s) => ({
      sectionId: s.sectionId,
      name: s.courseName
        ? `${s.sectionNumber} — ${s.courseName}`
        : s.sectionNumber,
      status: 'pending' as const,
      studentCount: s.currentEnrollment,
      recordedCount: 0,
    }))
  }, [overview.data, teacherSections])

  return {
    sections: items,
    isLoading: enabled ? overview.isLoading : sectionsLoading,
  }
}

// ============================================================================
// HOOK: useRecentActivityItems — Build activity feed from finance data
// ============================================================================

export function useRecentActivityItems(
  financeSummary: FinanceSummaryData | null,
  financeLoading: boolean,
): { items: ActivityItem[]; isLoading: boolean } {
  const settings = useSettings()
  const { formatShort } = useCurrency(settings)
  const items = useMemo<ActivityItem[]>(() => {
    if (!financeSummary) return []
    const feed: ActivityItem[] = []

    // Add recent payments
    if (financeSummary.recentPayments) {
      for (const p of financeSummary.recentPayments.slice(0, 5)) {
        feed.push({
          id: p.id,
          text: `Payment received — ${formatShort(p.amount)} ${p.gateway}`,
          timestamp: formatRelativeTime(p.paidAt || p.createdAt),
          type: 'payment',
        })
      }
    }

    // Add overdue alert if applicable
    if (financeSummary.overdue > 0) {
      feed.push({
        id: 'overdue-auto',
        text: `Outstanding overdue amount — ${formatShort(financeSummary.overdue)}`,
        timestamp: 'Auto-detected by system',
        type: 'overdue',
      })
    }

    // Sort by most recent first (payments have timestamps)
    return feed.slice(0, 5)
  }, [financeSummary, formatShort])

  return { items, isLoading: financeLoading }
}

// ============================================================================
// HOOK: useOnlineStatus — Ticket 4.2
// Tracks browser online/offline state for stale data banner
// ============================================================================

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// ============================================================================
// HOOK: useDayChangeDetection — Ticket 4.4
// Detects when the day rolls over and invalidates stale date-based queries
// ============================================================================

export function useDayChangeDetection() {
  const queryClient = useQueryClient()
  const cachedDateRef = useRef(getTodayISO())

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getTodayISO()
      if (current !== cachedDateRef.current) {
        debugLog('day-change', `Day changed: ${cachedDateRef.current} → ${current}`)
        cachedDateRef.current = current
        // Invalidate all home queries since many are date-dependent
        queryClient.invalidateQueries({ queryKey: homeKeys.all })
      }
    }, 60_000) // Check every 60 seconds

    return () => clearInterval(interval)
  }, [queryClient])
}
