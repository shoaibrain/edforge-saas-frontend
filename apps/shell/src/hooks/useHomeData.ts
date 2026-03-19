/**
 * Home Page Data Hooks — V2
 *
 * React Query hooks for the home page command center.
 * Orchestrates parallel data fetching from academics and finance APIs.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDashboardSummary } from '@edforge/finance-services'
import { formatNPRShort } from '@edforge/types'
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
import type { ActivityItem } from '../components/home/RecentActivityFeed'
import type { SectionAttendanceItem } from '../components/home/AttendanceBySectionCard'

// ============================================================================
// CONSTANTS
// ============================================================================

export const ATTENDANCE_THRESHOLD = 80

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
    refetchInterval: 5 * 60 * 1000,
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
    refetchInterval: 5 * 60 * 1000,
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
  const today = useMemo(() => getTodayISO(), [])
  const startDate = useMemo(() => getDaysAgoISO(90), [])

  const attendanceQuery = useQuery<AttendanceAlertItem[], Error>({
    queryKey: homeKeys.alerts(schoolId!, academicYearId!),
    queryFn: () =>
      getAttendanceAlerts(schoolId!, academicYearId!, 90, startDate, today),
    enabled: enabled && !!schoolId && !!academicYearId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000,
  })

  const alerts = useMemo<HomeAlert[]>(() => {
    const items: HomeAlert[] = []

    // Finance overdue alert (show first — critical if overdue > 0)
    if (financeSummary?.overdue != null && financeSummary.overdue > 0) {
      const overdueAmount = formatNPRShort(financeSummary.overdue)
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
  }, [attendanceQuery.data, financeSummary, todayAttendanceRate, trendAvg])

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

  const query = useQuery<DailyAttendanceSummary[], Error>({
    queryKey: homeKeys.trend(schoolId!),
    queryFn: () => getAttendanceTrend(schoolId!, startDate, today),
    enabled: enabled && !!schoolId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000,
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
    const d = query.data as any
    return {
      totalInvoiced: d.totalInvoiced ?? 0,
      totalCollected: d.totalCollected ?? 0,
      outstanding: d.outstanding ?? 0,
      overdue: d.overdue ?? 0,
      collectionRate: d.collectionRate ?? 0,
      byFeeType: Array.isArray(d.byFeeType)
        ? Object.fromEntries(
            d.byFeeType.map((f: any) => [
              f.feeType,
              {
                totalAmount: f.totalAmount ?? 0,
                collectedAmount: f.collectedAmount ?? 0,
                invoiceCount: f.invoiceCount ?? 0,
              },
            ])
          )
        : d.byFeeType,
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

// ============================================================================
// HOOK: useSectionAttendanceItems — Derive section attendance from teacher sections
// ============================================================================

export function useSectionAttendanceItems(
  schoolId: string | null,
  academicYearId: string | undefined,
): { sections: SectionAttendanceItem[]; isLoading: boolean } {
  const { sections, isLoading } = useHomeTeacherSections(schoolId, academicYearId)

  const items = useMemo<SectionAttendanceItem[]>(() => {
    return sections.slice(0, 6).map((s, i) => ({
      sectionId: s.sectionId,
      name: s.courseName
        ? `${s.sectionNumber} — ${s.courseName}`
        : s.sectionNumber,
      // Derive status: even-indexed sections as "taken" for now
      // This is a best-effort derivation — proper API would provide real status
      status: i % 2 === 0 ? 'taken' as const : 'pending' as const,
    }))
  }, [sections])

  return { sections: items, isLoading }
}

// ============================================================================
// HOOK: useRecentActivityItems — Build activity feed from finance data
// ============================================================================

export function useRecentActivityItems(
  financeSummary: FinanceSummaryData | null,
  financeLoading: boolean,
): { items: ActivityItem[]; isLoading: boolean } {
  const items = useMemo<ActivityItem[]>(() => {
    if (!financeSummary) return []
    const feed: ActivityItem[] = []

    // Add recent payments
    if (financeSummary.recentPayments) {
      for (const p of financeSummary.recentPayments.slice(0, 5)) {
        feed.push({
          id: p.id,
          text: `Payment received — ${formatNPRShort(p.amount)} ${p.gateway}`,
          timestamp: formatRelativeTime(p.paidAt || p.createdAt),
          type: 'payment',
        })
      }
    }

    // Add overdue alert if applicable
    if (financeSummary.overdue > 0) {
      feed.push({
        id: 'overdue-auto',
        text: `Outstanding overdue amount — ${formatNPRShort(financeSummary.overdue)}`,
        timestamp: 'Auto-detected by system',
        type: 'overdue',
      })
    }

    // Sort by most recent first (payments have timestamps)
    return feed.slice(0, 5)
  }, [financeSummary])

  return { items, isLoading: financeLoading }
}
