/**
 * useSectionAttendance Hooks
 *
 * React Query hooks for section-level attendance CRUD.
 * Query keys include sectionId to ensure proper cache isolation
 * between sections (fixes the cross-section attendance bug).
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  recordSectionAttendance,
  recordBulkSectionAttendance,
  getSectionAttendanceByDate,
  getStudentSectionAttendance,
  updateSectionAttendance,
  parseApiError,
  type CreateSectionAttendanceParams,
  type BulkSectionAttendanceParams,
  type SectionAttendanceRecord,
  type BulkSectionAttendanceResponse,
  type AttendanceStatus,
} from '../services/academics.service'
import { attendanceKeys } from './useAttendance'
import { summarizeByBucket } from '../components/attendance/attendanceStatus'

// ============================================================================
// QUERY KEYS — sectionId is ALWAYS in the key to prevent cross-section leaks
// ============================================================================

export const sectionAttendanceKeys = {
  all: ['section-attendance'] as const,
  records: (sectionId: string, schoolId: string, date: string) =>
    [...sectionAttendanceKeys.all, 'records', sectionId, schoolId, date] as const,
  studentHistory: (studentId: string, sectionId?: string) =>
    [...sectionAttendanceKeys.all, 'student', studentId, sectionId] as const,
}

// ============================================================================
// GET SECTION ATTENDANCE BY DATE
// ============================================================================

export function useSectionAttendanceRecords({
  sectionId,
  schoolId,
  date,
  enabled = true,
}: {
  sectionId: string
  schoolId: string
  date: string
  enabled?: boolean
}) {
  return useQuery<SectionAttendanceRecord[], Error>({
    queryKey: sectionAttendanceKeys.records(sectionId, schoolId, date),
    queryFn: async () => {
      const result = await getSectionAttendanceByDate(sectionId, schoolId, date)
      return result.items
    },
    enabled: enabled && !!sectionId && !!schoolId && !!date,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}

// ============================================================================
// RECORD SINGLE SECTION ATTENDANCE
// ============================================================================

export function useRecordSectionAttendance() {
  const queryClient = useQueryClient()

  return useMutation<SectionAttendanceRecord, Error, CreateSectionAttendanceParams>({
    mutationFn: (data) => recordSectionAttendance(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: sectionAttendanceKeys.records(variables.sectionId, variables.schoolId, variables.date),
      })
      // Also invalidate school-level attendance (derivation will update it)
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.all,
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
// RECORD BULK SECTION ATTENDANCE
// ============================================================================

export function useRecordBulkSectionAttendance() {
  const queryClient = useQueryClient()

  return useMutation<BulkSectionAttendanceResponse, Error, BulkSectionAttendanceParams>({
    mutationFn: (data) => recordBulkSectionAttendance(data),
    onSuccess: (result, variables) => {
      // Invalidate this section's records
      queryClient.invalidateQueries({
        queryKey: sectionAttendanceKeys.records(variables.sectionId, variables.schoolId, variables.date),
      })
      // Invalidate school-level attendance (derivation updates it)
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.all,
      })
      // F2.T2 — surface the present/absent/excused breakdown the teacher just saved
      // (Story 1: "✓ recorded for 70 students (68 present, 2 absent, 1 excused)").
      const b = summarizeByBucket(variables.records.map((r) => r.status))
      const breakdown = `${b.present} present, ${b.absent} absent, ${b.excused} excused`
      if (result.errors.length > 0) {
        toast.warning(`Attendance saved with ${result.errors.length} error(s) — ${breakdown}`)
      } else {
        toast.success(`Attendance recorded for ${result.totalProcessed} students (${breakdown})`)
      }
    },
    onError: (error, variables) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
      // Revert UI by refetching server state
      queryClient.invalidateQueries({
        queryKey: sectionAttendanceKeys.records(variables.sectionId, variables.schoolId, variables.date),
      })
    },
  })
}

// ============================================================================
// UPDATE SECTION ATTENDANCE
// ============================================================================

export function useUpdateSectionAttendance() {
  const queryClient = useQueryClient()

  return useMutation<
    SectionAttendanceRecord,
    Error,
    {
      date: string
      sectionId: string
      studentId: string
      status: AttendanceStatus
      notes?: string
      excuseReason?: string
      schoolId: string
      expectedVersion?: number
    }
  >({
    mutationFn: ({ date, sectionId, studentId, status, notes, excuseReason, expectedVersion, schoolId }) =>
      updateSectionAttendance(date, sectionId, studentId, { status, notes, excuseReason, expectedVersion }, schoolId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: sectionAttendanceKeys.records(variables.sectionId, variables.schoolId, variables.date),
      })
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.all,
      })
      toast.success('Attendance updated')
    },
    onError: (error, variables) => {
      const parsed = parseApiError(error)
      if (parsed.statusCode === 409) {
        toast.error('Someone else updated this record. Refresh to see their changes.')
      } else {
        toast.error(parsed.message)
      }
      // Revert UI by refetching server state
      queryClient.invalidateQueries({
        queryKey: sectionAttendanceKeys.records(variables.sectionId, variables.schoolId, variables.date),
      })
    },
  })
}

// ============================================================================
// STUDENT SECTION ATTENDANCE HISTORY
// ============================================================================

export function useStudentSectionAttendance({
  studentId,
  sectionId,
  schoolId,
  startDate,
  endDate,
  enabled = true,
}: {
  studentId: string
  sectionId?: string
  schoolId?: string
  startDate?: string
  endDate?: string
  enabled?: boolean
}) {
  return useQuery<SectionAttendanceRecord[], Error>({
    queryKey: sectionAttendanceKeys.studentHistory(studentId, sectionId),
    queryFn: () => getStudentSectionAttendance(studentId, { sectionId, schoolId, startDate, endDate }),
    enabled: enabled && !!studentId,
    staleTime: 2 * 60 * 1000,
  })
}
