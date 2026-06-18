/**
 * useHomeroom Hooks
 *
 * React Query hooks for the PABSON daily-homeroom surface:
 *   - the school's resolved attendance policy/mode,
 *   - homeroom Sections (sectionType:'homeroom'),
 *   - homeroom designation, per-student homeroom assignment, and the
 *     daily roll-call bulk write.
 *
 * Mirrors useSections / useSectionAttendance (query keys + invalidation).
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getAttendancePolicy,
  getSections,
  designateHomeroom,
  assignToHomeroom,
  recordDailyAttendance,
  parseApiError,
  type AttendancePolicyResponse,
  type SectionResponseDto,
  type DesignateHomeroomDto,
  type RecordDailyAttendanceDto,
  type RecordDailyAttendanceResponseDto,
} from '../services/academics.service'
import { sectionKeys } from './useSections'
import { sectionAttendanceKeys } from './useSectionAttendance'
import { attendanceKeys } from './useAttendance'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const homeroomKeys = {
  all: ['homerooms'] as const,
  policy: (schoolId: string) => ['attendance-policy', schoolId] as const,
  list: (schoolId: string, academicYearId?: string) =>
    [...homeroomKeys.all, 'list', schoolId, academicYearId] as const,
}

// ============================================================================
// ATTENDANCE POLICY (resolved mode)
// ============================================================================

/**
 * Hook to fetch the school's resolved attendance policy. `effectiveMode`
 * decides whether the school-level Daily Entry surface renders homeroom
 * roll-call (`daily`/`both`) or the existing per-section path (`period`).
 */
export function useAttendancePolicy(schoolId: string, enabled = true) {
  return useQuery<AttendancePolicyResponse, Error>({
    queryKey: homeroomKeys.policy(schoolId),
    queryFn: () => getAttendancePolicy(schoolId),
    enabled: enabled && !!schoolId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ============================================================================
// HOMEROOMS (sections filtered to sectionType === 'homeroom')
// ============================================================================

/**
 * Hook to fetch homeroom Sections for a school + academic year.
 * Filtered server-side via `sectionType:'homeroom'`.
 */
export function useHomerooms(schoolId: string, academicYearId?: string, enabled = true) {
  return useQuery<SectionResponseDto[], Error>({
    queryKey: homeroomKeys.list(schoolId, academicYearId),
    queryFn: async () => {
      const result = await getSections({
        schoolId,
        academicYearId,
        sectionType: 'homeroom',
        isActive: true,
        limit: 200,
      })
      return result.items
    },
    enabled: enabled && !!schoolId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ============================================================================
// DESIGNATE HOMEROOM
// ============================================================================

export function useDesignateHomeroom() {
  const queryClient = useQueryClient()

  return useMutation<SectionResponseDto, Error, DesignateHomeroomDto>({
    mutationFn: (data) => designateHomeroom(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: homeroomKeys.list(variables.schoolId) })
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() })
      toast.success('Homeroom created')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// ASSIGN STUDENT TO HOMEROOM (per-student; no bulk endpoint)
// ============================================================================

export function useAssignToHomeroom() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { sectionId: string; schoolId: string; studentId: string }
  >({
    mutationFn: ({ sectionId, schoolId, studentId }) =>
      assignToHomeroom(sectionId, { schoolId, studentId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.roster(variables.sectionId) })
      queryClient.invalidateQueries({ queryKey: homeroomKeys.list(variables.schoolId) })
    },
    // No per-call toast — callers loop over students and report aggregate progress.
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// RECORD DAILY ATTENDANCE (homeroom roll-call, absentees-only fast path)
// ============================================================================

export function useRecordDailyAttendance() {
  const queryClient = useQueryClient()

  return useMutation<RecordDailyAttendanceResponseDto, Error, RecordDailyAttendanceDto>({
    mutationFn: (data) => recordDailyAttendance(data),
    onSuccess: (result, variables) => {
      // Refresh the homeroom's section-attendance records + school-level summary.
      queryClient.invalidateQueries({
        queryKey: sectionAttendanceKeys.records(
          variables.homeroomSectionId,
          variables.schoolId,
          variables.date,
        ),
      })
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
      toast.success(
        `Roll-call saved — ${result.marked} marked, ${result.defaultedPresent} defaulted present`,
      )
    },
    onError: (error, variables) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
      queryClient.invalidateQueries({
        queryKey: sectionAttendanceKeys.records(
          variables.homeroomSectionId,
          variables.schoolId,
          variables.date,
        ),
      })
    },
  })
}
