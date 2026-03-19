/**
 * useAcademicsOverviewV2 — Data hook for the V2 Academics Overview
 *
 * Orchestrates parallel fetching of all data needed by the V2 page:
 * - Academics overview (enrollment, sections, attendance)
 * - Staff roster
 * - Attendance alerts
 * - Attendance trend
 * - Academic year context
 *
 * Each section has independent loading/error states.
 */

import { useMemo, useState, useCallback } from 'react'
import { usePermission } from '@edforge/abac'
import { getEnrollmentExportUrl } from '../services/academics.service'
import {
  useAcademicsOverview,
  useActiveTeacherCount,
  useEnrollmentDistribution,
  useCombinedAlerts,
  useAttendanceTrendData,
  useAcademicCalendarContext,
  type AcademicsOverviewData,
  type AcademicAlert,
  type AttendanceAlert,
  type AttendanceTrendPoint,
  type GradeLevelDistribution,
  type AcademicCalendarContext,
  type TeacherCountData,
} from './useAcademicsOverview'
import { useCurrentAcademicYear } from './useSchool'
import { useSchoolStaff, flattenStaffData } from './useStaff'
import type { StaffResponseDto } from '../services/staff.service'

// ============================================================================
// TYPES
// ============================================================================

export interface AcademicsV2Data {
  // Academic year
  academicYear: {
    id: string | undefined
    name: string | undefined
    startDate: string | undefined
    endDate: string | undefined
    isLoading: boolean
    isError: boolean
  }
  // Core KPIs
  overview: AcademicsOverviewData
  // Teacher data
  teachers: TeacherCountData
  // Enrollment distribution
  enrollment: {
    data: GradeLevelDistribution[]
    total: number
  }
  // Attendance alerts
  alerts: {
    items: AcademicAlert[]
    students: AttendanceAlert[]
    totalCount: number
    criticalCount: number
    warningCount: number
    isLoading: boolean
  }
  // Attendance trend
  trend: {
    chartData: AttendanceTrendPoint[]
    summary: { min: number; max: number; avg: number } | null
    isLoading: boolean
    isError: boolean
  }
  // Staff roster
  staff: {
    items: StaffResponseDto[]
    activeCount: number
    isLoading: boolean
    isError: boolean
  }
  // Calendar context
  calendar: AcademicCalendarContext
  // Permissions
  canViewEnrollment: boolean
  // Filters
  filters: {
    from: string
    to: string
    academicYear: string
    gradeLevel: string
  }
  setFromDate: (v: string) => void
  setToDate: (v: string) => void
  setFilterAcademicYear: (v: string) => void
  setGradeLevelFilter: (v: string) => void
  clearFilters: () => void
  hasActiveFilters: boolean
  gradeLevels: string[]
  // Export
  handleExportCSV: () => void
  isExporting: boolean
}

// ============================================================================
// HOOK
// ============================================================================

export function useAcademicsOverviewV2(schoolId: string): AcademicsV2Data {
  // ABAC: check enrollment visibility
  const canViewEnrollment = usePermission('view', 'enrollment', schoolId)

  // Academic year
  const yearQuery = useCurrentAcademicYear(schoolId)
  const academicYearId = yearQuery.data?.yearId

  // ── Filter state ──
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [filterAcademicYear, setFilterAcademicYear] = useState('')
  const [gradeLevelFilter, setGradeLevelFilter] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const hasActiveFilters = !!(fromDate || toDate || filterAcademicYear || gradeLevelFilter)

  const clearFilters = useCallback(() => {
    setFromDate('')
    setToDate('')
    setFilterAcademicYear('')
    setGradeLevelFilter('')
  }, [])

  const handleExportCSV = useCallback(() => {
    if (!schoolId || !academicYearId) return
    setIsExporting(true)
    const url = getEnrollmentExportUrl(schoolId, academicYearId)
    window.open(`/api${url}`, '_blank')
    // Reset after a short delay (download triggers immediately)
    setTimeout(() => setIsExporting(false), 2000)
  }, [schoolId, academicYearId])

  // Core overview data (enrollment, sections, attendance)
  const overview = useAcademicsOverview(schoolId, academicYearId)

  // Teacher data
  const teachers = useActiveTeacherCount(schoolId)

  // Enrollment distribution
  const enrollment = useEnrollmentDistribution(overview.enrollmentByGradeLevel)

  // Alerts (deferred until core KPIs load)
  const coreLoaded = !overview.isLoading
  const alertsData = useCombinedAlerts(schoolId, academicYearId, coreLoaded)

  // Attendance trend (30-day)
  const trend = useAttendanceTrendData(schoolId, !!schoolId && coreLoaded)

  // Staff roster
  const staffQuery = useSchoolStaff(schoolId, !!schoolId)
  const staffItems = useMemo(() => flattenStaffData(staffQuery.data), [staffQuery.data])

  // Derive alert counts from individual students
  const alertCounts = useMemo(() => {
    const critical = alertsData.students.filter((s) => s.attendanceRate < 80).length
    const warning = alertsData.students.filter((s) => s.attendanceRate >= 80 && s.attendanceRate < 90).length
    return { critical, warning }
  }, [alertsData.students])

  // Calendar context
  const calendar = useAcademicCalendarContext(schoolId, academicYearId)

  // Grade levels (for filter dropdown)
  const gradeLevels = useMemo(() => {
    return enrollment.data.map((d) => d.gradeLevel)
  }, [enrollment.data])

  // Filtered at-risk students by grade level
  const filteredStudents = useMemo(() => {
    if (!gradeLevelFilter) return alertsData.students
    return alertsData.students.filter((s) => s.gradeLevel === gradeLevelFilter)
  }, [alertsData.students, gradeLevelFilter])

  return {
    academicYear: {
      id: academicYearId,
      name: yearQuery.data?.name,
      startDate: yearQuery.data?.startDate,
      endDate: yearQuery.data?.endDate,
      isLoading: yearQuery.isLoading,
      isError: yearQuery.isError,
    },
    overview,
    teachers,
    enrollment,
    alerts: {
      items: alertsData.alerts,
      students: filteredStudents,
      totalCount: gradeLevelFilter ? filteredStudents.length : alertsData.totalCount,
      criticalCount: alertCounts.critical,
      warningCount: alertCounts.warning,
      isLoading: alertsData.isLoading,
    },
    trend,
    staff: {
      items: staffItems,
      activeCount: staffItems.filter(
        (s: any) => s.employmentStatus === 'active' || s.status === 'active'
      ).length,
      isLoading: staffQuery.isLoading,
      isError: staffQuery.isError,
    },
    calendar,
    canViewEnrollment,
    filters: {
      from: fromDate,
      to: toDate,
      academicYear: filterAcademicYear,
      gradeLevel: gradeLevelFilter,
    },
    setFromDate,
    setToDate,
    setFilterAcademicYear,
    setGradeLevelFilter,
    clearFilters,
    hasActiveFilters,
    gradeLevels,
    handleExportCSV,
    isExporting,
  }
}
