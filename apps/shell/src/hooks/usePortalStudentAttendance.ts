/**
 * usePortalStudentAttendance — Shell-local hooks for student attendance
 *
 * Two hooks: records (date-range list) and summary (aggregate counts).
 * Follows the portal hook pattern from usePortalStudentGrades.ts.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const portalAttendanceKeys = {
  all: ['portal-attendance'] as const,
  summaries: () => [...portalAttendanceKeys.all, 'summary'] as const,
  summary: (studentId: string) =>
    [...portalAttendanceKeys.summaries(), studentId] as const,
  records: () => [...portalAttendanceKeys.all, 'records'] as const,
  record: (studentId: string, startDate: string, endDate: string) =>
    [...portalAttendanceKeys.records(), studentId, startDate, endDate] as const,
}

// ============================================================================
// TYPES (match backend response shapes)
// ============================================================================

export interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  excusedDays: number
  attendanceRate: number
}

export interface AttendanceRecord {
  id: string
  studentId: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  periodOrCourse?: string
  notes?: string
  excuseType?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// HOOKS
// ============================================================================

export function usePortalAttendanceSummary(
  studentId: string,
  schoolId: string,
  options?: { academicYearId?: string }
) {
  return useQuery({
    queryKey: portalAttendanceKeys.summary(studentId),
    queryFn: () =>
      apiGet<AttendanceSummary>(
        `/academics/students/${studentId}/attendance/summary`,
        {
          schoolId,
          ...(options?.academicYearId && { academicYearId: options.academicYearId }),
        }
      ),
    enabled: !!studentId && !!schoolId,
    staleTime: 2 * 60 * 1000, // 2 minutes — attendance can change during the day
  })
}

export function usePortalStudentAttendance(
  studentId: string,
  schoolId: string,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: portalAttendanceKeys.record(studentId, startDate, endDate),
    queryFn: async () => {
      // Backend returns AttendanceListResponseDto = { items: AttendanceRecord[], hasMore }
      // but some endpoints may return a raw array. Normalize to always return AttendanceRecord[].
      const res = await apiGet<{ items: AttendanceRecord[]; hasMore?: boolean } | AttendanceRecord[]>(
        `/academics/students/${studentId}/attendance`,
        { schoolId, startDate, endDate }
      )
      return Array.isArray(res) ? res : res?.items ?? []
    },
    enabled: !!studentId && !!schoolId && !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000,
  })
}
