/**
 * useAttendance Hooks
 *
 * React Query hooks for attendance recording, summaries, and history.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  recordAttendance,
  recordBulkAttendance,
  getAttendanceSummary,
  getStudentAttendance,
  getStudentAttendanceSummary,
  updateAttendance,
  parseApiError,
  type CreateAttendanceParams,
  type BulkAttendanceParams,
  type AttendanceRecord,
  type BulkAttendanceResponse,
  type DailyAttendanceSummary,
  type StudentAttendanceSummary,
  type AttendanceStatus,
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
}

// ============================================================================
// DAILY ATTENDANCE SUMMARY
// ============================================================================

interface UseAttendanceSummaryOptions {
  schoolId: string
  date: string
  enabled?: boolean
}

/**
 * Hook to fetch daily attendance summary for a school
 */
export function useAttendanceSummary({
  schoolId,
  date,
  enabled = true,
}: UseAttendanceSummaryOptions) {
  return useQuery<DailyAttendanceSummary, Error>({
    queryKey: attendanceKeys.summary(schoolId, date),
    queryFn: () => getAttendanceSummary(schoolId, date),
    enabled: enabled && !!schoolId && !!date,
    staleTime: 30 * 1000, // 30 seconds - attendance changes frequently
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
  enabled?: boolean
}

/**
 * Hook to fetch student attendance summary (rate + counts)
 */
export function useStudentAttendanceSummary({
  studentId,
  enabled = true,
}: UseStudentAttendanceSummaryOptions) {
  return useQuery<StudentAttendanceSummary, Error>({
    queryKey: attendanceKeys.studentSummary(studentId),
    queryFn: () => getStudentAttendanceSummary(studentId),
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
        queryKey: attendanceKeys.studentHistories(),
      })
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.studentSummaries(),
      })
      if (result.errors.length > 0) {
        toast.warning(`Attendance saved with ${result.errors.length} error(s)`)
      } else {
        toast.success(`Attendance recorded for ${result.recorded} students`)
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
    { date: string; studentId: string; status: AttendanceStatus; notes?: string; schoolId: string }
  >({
    mutationFn: ({ date, studentId, status, notes }) =>
      updateAttendance(date, studentId, { status, notes }),
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
      toast.success('Attendance updated')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}
