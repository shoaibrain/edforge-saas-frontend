/**
 * useAttendance Hooks
 *
 * React Query hooks for attendance recording, summaries, and history.
 * Task 1.13: Added useAttendanceOverview hook
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  recordAttendance,
  recordBulkAttendance,
  getAttendanceByDate,
  getAttendanceSummary,
  getStudentAttendance,
  getStudentAttendanceSummary,
  updateAttendance,
  getCalendarDate,
  getAttendanceTrend,
  getAttendanceAlerts,
  getAttendanceStudentTrends,
  getAttendanceOverview,
  parseApiError,
  type CreateAttendanceParams,
  type BulkAttendanceParams,
  type AttendanceRecord,
  type BulkAttendanceResponse,
  type DailyAttendanceSummary,
  type StudentAttendanceSummary,
  type AttendanceStatus,
  type CalendarDateInfo,
  type AttendanceAlert,
  type AttendanceOverviewResponse,
  type StudentAttendanceTrend,
} from '../services/academics.service'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const attendanceKeys = {
  all: ['attendance'] as const,
  summaries: () => [...attendanceKeys.all, 'summary'] as const,
  summary: (schoolId: string, date: string) =>
    [...attendanceKeys.summaries(), schoolId, date] as const,
  studentHistories: () => [...attendanceKeys.all, 'student-history'] as const,
  studentHistory: (studentId: string, params?: { startDate?: string; endDate?: string }) =>
    [...attendanceKeys.studentHistories(), studentId, params] as const,
  studentSummaries: () => [...attendanceKeys.all, 'student-summary'] as const,
  studentSummary: (studentId: string) =>
    [...attendanceKeys.studentSummaries(), studentId] as const,
  trend: (schoolId: string, startDate: string, endDate: string) =>
    [...attendanceKeys.all, 'trend', schoolId, startDate, endDate] as const,
  alerts: (schoolId: string) =>
    [...attendanceKeys.all, 'alerts', schoolId] as const,
  studentTrends: (schoolId: string, studentIds: string, startDate: string, endDate: string) =>
    [...attendanceKeys.all, 'student-trends', schoolId, studentIds, startDate, endDate] as const,
  records: (schoolId: string, date: string) =>
    [...attendanceKeys.all, 'records', schoolId, date] as const,
  calendarDate: (schoolId: string, date: string) =>
    [...attendanceKeys.all, 'calendar-date', schoolId, date] as const,
  overview: (schoolId: string, academicYearId: string, date: string) =>
    [...attendanceKeys.all, 'overview', schoolId, academicYearId, date] as const,
}

// ============================================================================
// DAILY ATTENDANCE SUMMARY
// ============================================================================

interface UseAttendanceSummaryOptions {
  schoolId: string
  date: string
  academicYearId?: string
  enabled?: boolean
}

/**
 * Hook to fetch daily attendance summary for a school
 */
export function useAttendanceSummary({
  schoolId,
  date,
  academicYearId,
  enabled = true,
}: UseAttendanceSummaryOptions) {
  return useQuery<DailyAttendanceSummary, Error>({
    queryKey: attendanceKeys.summary(schoolId, date),
    queryFn: () => getAttendanceSummary(schoolId, date, academicYearId),
    enabled: enabled && !!schoolId && !!date,
    staleTime: 30 * 1000, // 30 seconds - attendance changes frequently
    refetchOnWindowFocus: true,
  })
}

// ============================================================================
// ATTENDANCE RECORDS BY DATE
// ============================================================================

/**
 * Hook to fetch existing attendance records for a school on a specific date.
 * Used to populate the attendance grid with previously saved records.
 */
export function useAttendanceRecords({
  schoolId,
  date,
  enabled = true,
}: {
  schoolId: string
  date: string
  enabled?: boolean
}) {
  return useQuery<AttendanceRecord[], Error>({
    queryKey: attendanceKeys.records(schoolId, date),
    queryFn: async () => {
      const result = await getAttendanceByDate(schoolId, date)
      return result.items
    },
    enabled: enabled && !!schoolId && !!date,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}

// ============================================================================
// STUDENT ATTENDANCE HISTORY
// ============================================================================

interface UseStudentAttendanceOptions {
  studentId: string
  startDate?: string
  endDate?: string
  enabled?: boolean
}

/**
 * Hook to fetch student attendance history
 */
export function useStudentAttendance({
  studentId,
  startDate,
  endDate,
  enabled = true,
}: UseStudentAttendanceOptions) {
  return useQuery<AttendanceRecord[], Error>({
    queryKey: attendanceKeys.studentHistory(studentId, { startDate, endDate }),
    queryFn: () => getStudentAttendance(studentId, { startDate, endDate }),
    enabled: enabled && !!studentId,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================================================
// STUDENT ATTENDANCE SUMMARY
// ============================================================================

interface UseStudentAttendanceSummaryOptions {
  studentId: string
  schoolId?: string
  enabled?: boolean
}

/**
 * Hook to fetch student attendance summary (rate + counts)
 */
export function useStudentAttendanceSummary({
  studentId,
  schoolId,
  enabled = true,
}: UseStudentAttendanceSummaryOptions) {
  return useQuery<StudentAttendanceSummary, Error>({
    queryKey: attendanceKeys.studentSummary(studentId),
    queryFn: () => getStudentAttendanceSummary(studentId, schoolId),
    enabled: enabled && !!studentId,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================================================
// RECORD SINGLE ATTENDANCE
// ============================================================================

export function useRecordAttendance() {
  const queryClient = useQueryClient()

  return useMutation<AttendanceRecord, Error, CreateAttendanceParams>({
    mutationFn: (data) => recordAttendance(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.summary(variables.schoolId, variables.date),
      })
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.studentHistories(),
      })
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.studentSummaries(),
      })
      toast.success('Attendance recorded')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// RECORD BULK ATTENDANCE
// ============================================================================

export function useRecordBulkAttendance() {
  const queryClient = useQueryClient()

  return useMutation<BulkAttendanceResponse, Error, BulkAttendanceParams>({
    mutationFn: (data) => recordBulkAttendance(data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.summary(variables.schoolId, variables.date),
      })
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.records(variables.schoolId, variables.date),
      })
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.studentHistories(),
      })
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.studentSummaries(),
      })
      // Task 1.13: Invalidate overview cache on bulk save
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.all,
        predicate: (query) => query.queryKey.includes('overview'),
      })
      if (result.errors.length > 0) {
        toast.warning(`Attendance saved with ${result.errors.length} error(s)`)
      } else {
        toast.success(`Attendance recorded for ${result.totalProcessed} students`)
      }
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// UPDATE ATTENDANCE (CORRECTION)
// ============================================================================

export function useUpdateAttendance() {
  const queryClient = useQueryClient()

  return useMutation<
    AttendanceRecord,
    Error,
    { date: string; studentId: string; status: AttendanceStatus; notes?: string; excuseType?: string; schoolId: string; expectedVersion?: number }
  >({
    mutationFn: ({ date, studentId, status, notes, excuseType, expectedVersion, schoolId }) =>
      updateAttendance(date, studentId, { status, notes, excuseType, expectedVersion } as any, schoolId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.summary(variables.schoolId, variables.date),
      })
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.records(variables.schoolId, variables.date),
      })
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.studentHistories(),
      })
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.studentSummaries(),
      })
      toast.success('Attendance updated')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      if (parsed.statusCode === 409) {
        toast.error('Someone else updated this record. Refresh to see their changes.')
      } else {
        toast.error(parsed.message)
      }
    },
  })
}

// ============================================================================
// CALENDAR DATE CHECK
// ============================================================================

/**
 * Hook to check calendar date for attendance validation
 * Returns null if no calendar entry exists for the given date
 */
export function useCalendarDate({
  schoolId,
  date,
  enabled = true,
}: {
  schoolId: string
  date: string
  enabled?: boolean
}) {
  return useQuery<CalendarDateInfo | null, Error>({
    queryKey: attendanceKeys.calendarDate(schoolId, date),
    queryFn: () => getCalendarDate(schoolId, date),
    enabled: enabled && !!schoolId && !!date,
    staleTime: 5 * 60 * 1000, // 5 min - matches backend cache
  })
}

// ============================================================================
// ATTENDANCE TREND
// ============================================================================

/**
 * Hook to fetch attendance trend data (30-day line chart data)
 */
export function useAttendanceTrend({
  schoolId,
  startDate,
  endDate,
  enabled = true,
}: {
  schoolId: string
  startDate: string
  endDate: string
  enabled?: boolean
}) {
  return useQuery<DailyAttendanceSummary[], Error>({
    queryKey: attendanceKeys.trend(schoolId, startDate, endDate),
    queryFn: () => getAttendanceTrend(schoolId, startDate, endDate),
    enabled: enabled && !!schoolId && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch batch per-student attendance trends for the roster sparkline.
 * `studentIds` is sorted for a stable query key (caller passes the visible page,
 * ≤50). Returns a studentId → trend map.
 */
export function useAttendanceStudentTrends({
  schoolId,
  studentIds,
  startDate,
  endDate,
  enabled = true,
}: {
  schoolId: string
  studentIds: string[]
  startDate: string
  endDate: string
  enabled?: boolean
}) {
  const sortedIds = [...studentIds].sort()
  return useQuery<Record<string, StudentAttendanceTrend>, Error>({
    queryKey: attendanceKeys.studentTrends(schoolId, sortedIds.join(','), startDate, endDate),
    queryFn: () => getAttendanceStudentTrends(schoolId, sortedIds, startDate, endDate),
    enabled: enabled && !!schoolId && sortedIds.length > 0 && !!startDate && !!endDate,
    staleTime: 10 * 60 * 1000,
  })
}

// ============================================================================
// ATTENDANCE ALERTS
// ============================================================================

/**
 * Hook to fetch students with attendance below threshold
 */
export function useAttendanceAlerts({
  schoolId,
  academicYearId,
  threshold = 90,
  startDate,
  endDate,
  enabled = true,
}: {
  schoolId: string
  academicYearId: string
  threshold?: number
  startDate: string
  endDate: string
  enabled?: boolean
}) {
  return useQuery<AttendanceAlert[], Error>({
    queryKey: attendanceKeys.alerts(schoolId),
    queryFn: () => getAttendanceAlerts(schoolId, academicYearId, threshold, startDate, endDate),
    enabled: enabled && !!schoolId && !!academicYearId,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================================================
// ATTENDANCE OVERVIEW (Task 1.13)
// ============================================================================

/**
 * Hook to fetch comprehensive attendance overview (single aggregate endpoint)
 * Replaces separate summary + trend + alerts hooks for the dashboard
 */
export function useAttendanceOverview({
  schoolId,
  academicYearId,
  date,
  enabled = true,
}: {
  schoolId: string
  academicYearId: string
  date: string
  enabled?: boolean
}) {
  return useQuery<AttendanceOverviewResponse, Error>({
    queryKey: attendanceKeys.overview(schoolId, academicYearId, date),
    queryFn: () => getAttendanceOverview({ schoolId, academicYearId, date }),
    enabled: enabled && !!schoolId && !!academicYearId && !!date,
    staleTime: 60 * 1000, // 60 seconds - matches backend cache
    placeholderData: keepPreviousData, // Prevents loading flicker on date change
  })
}
