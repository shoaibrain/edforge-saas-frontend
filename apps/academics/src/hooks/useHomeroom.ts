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
  bulkAssignToHomeroom,
  updateSection,
  hardDeleteHomeroom,
  removeStudentFromSection,
  recordDailyAttendance,
  parseApiError,
  type AttendancePolicyResponse,
  type SectionResponseDto,
  type DesignateHomeroomDto,
  type UpdateSectionDto,
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
    // A just-created homeroom is written to a DDB GSI (eventually consistent),
    // so the immediate post-create refetch can race and miss it. Always refetch
    // when the tab mounts so navigating back self-heals the list.
    refetchOnMount: 'always',
  })
}

// ============================================================================
// DESIGNATE HOMEROOM
// ============================================================================

export function useDesignateHomeroom() {
  const queryClient = useQueryClient()

  return useMutation<SectionResponseDto, Error, DesignateHomeroomDto>({
    mutationFn: (data) => designateHomeroom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeroomKeys.all })
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
      queryClient.invalidateQueries({ queryKey: homeroomKeys.all })
    },
    // No per-call toast — callers loop over students and report aggregate progress.
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// BULK ASSIGN STUDENTS TO HOMEROOM (auto-roster on create)
// ============================================================================

export interface AssignStudentsProgress {
  /** Number of assign attempts completed (success + skip). */
  done: number
  /** Total number of students in the batch. */
  total: number
}

export interface AssignStudentsResult {
  /** Count of students assigned (incl. idempotent re-assigns). */
  assigned: number
  /** Students that could not be assigned (e.g. already in another homeroom). */
  skipped: Array<{ studentId: string; reason: string }>
}

export interface AssignStudentsToHomeroomVariables {
  sectionId: string
  schoolId: string
  studentIds: string[]
  /** Called after each student so the UI can render aggregate progress. */
  onProgress?: (progress: AssignStudentsProgress) => void
}

/**
 * Assign many students to a single homeroom.
 *
 * There is no bulk endpoint yet, so this loops the single-student
 * `assignToHomeroom` POST. A student already in another homeroom 409s — we
 * skip + report that student rather than aborting the batch (the one-homeroom
 * rule is server-enforced; an existing assignment is not a failure of the
 * roster operation). The whole batch is exposed as ONE function call so it can
 * later be swapped to a single bulk POST without touching the UI.
 *
 * Returns `{ assigned, skipped }`; the UI surfaces progress via `onProgress`
 * and an end summary.
 */
export function useAssignStudentsToHomeroom() {
  const queryClient = useQueryClient()

  return useMutation<
    AssignStudentsResult,
    Error,
    AssignStudentsToHomeroomVariables
  >({
    mutationFn: async ({ sectionId, schoolId, studentIds, onProgress }) => {
      // One bulk call; the server loops assignToHomeroom per student and returns
      // the aggregate (partial progress preserved, skip-and-report on conflicts).
      onProgress?.({ done: 0, total: studentIds.length })
      const result = await bulkAssignToHomeroom(sectionId, { schoolId, studentIds })
      onProgress?.({ done: studentIds.length, total: studentIds.length })
      return { assigned: result.assigned, skipped: result.skipped }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.roster(variables.sectionId) })
      queryClient.invalidateQueries({ queryKey: homeroomKeys.all })
    },
    // No toast here — the caller renders the aggregate summary.
  })
}

// ============================================================================
// EDIT HOMEROOM (class teacher / co-teacher / name / capacity)
// ============================================================================

export function useUpdateHomeroom() {
  const queryClient = useQueryClient()

  return useMutation<
    SectionResponseDto,
    Error,
    { sectionId: string; schoolId: string; data: UpdateSectionDto }
  >({
    mutationFn: ({ sectionId, schoolId, data }) => updateSection(sectionId, schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeroomKeys.all })
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() })
      toast.success('Homeroom updated')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// HARD-DELETE HOMEROOM (cascade: section + roster rows + Enrollment pointers)
// ============================================================================

export function useDeleteHomeroom() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { sectionId: string; schoolId: string }>({
    mutationFn: ({ sectionId, schoolId }) => hardDeleteHomeroom(sectionId, schoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeroomKeys.all })
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() })
      toast.success('Homeroom deleted')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// REMOVE STUDENT FROM HOMEROOM (drop — server clears the Enrollment pointer,
// which is what enables a "move" = remove here, then assign in the target)
// ============================================================================

export function useRemoveFromHomeroom() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { sectionId: string; schoolId: string; studentId: string }
  >({
    mutationFn: ({ sectionId, schoolId, studentId }) =>
      removeStudentFromSection(sectionId, schoolId, studentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.roster(variables.sectionId) })
      queryClient.invalidateQueries({ queryKey: homeroomKeys.all })
    },
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
