/**
 * useEnrollments Hooks
 *
 * React Query hooks for enrollment management, withdrawal, and transfer.
 */

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getEnrollments,
  getEnrollmentSummary,
  withdrawStudent,
  transferStudent,
  markNoShow,
  closeAcademicYearEnrollments,
  parseApiError,
  type EnrollmentListResponse,
  type EnrollmentSummaryResponse,
  type EnrollmentFilterParams,
  type WithdrawStudentParams,
  type TransferStudentParams,
  type EnrollmentResponseDto,
} from '../services/academics.service'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  lists: () => [...enrollmentKeys.all, 'list'] as const,
  list: (schoolId: string, yearId: string, filters?: EnrollmentFilterParams) =>
    [...enrollmentKeys.lists(), schoolId, yearId, filters] as const,
  summaries: () => [...enrollmentKeys.all, 'summary'] as const,
  summary: (schoolId: string, yearId: string) =>
    [...enrollmentKeys.summaries(), schoolId, yearId] as const,
}

// ============================================================================
// LIST ENROLLMENTS (INFINITE QUERY)
// ============================================================================

interface UseEnrollmentsOptions {
  schoolId: string
  yearId: string
  filters?: EnrollmentFilterParams
  limit?: number
  enabled?: boolean
}

export function useEnrollments({
  schoolId,
  yearId,
  filters = {},
  limit = 50,
  enabled = true,
}: UseEnrollmentsOptions) {
  return useInfiniteQuery<EnrollmentListResponse, Error>({
    queryKey: enrollmentKeys.list(schoolId, yearId, filters),
    queryFn: async ({ pageParam }) => {
      return getEnrollments(schoolId, yearId, {
        ...filters,
        limit,
        cursor: pageParam as string | undefined,
      })
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.lastEvaluatedKey : undefined
    },
    enabled: enabled && !!schoolId && !!yearId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Helper to flatten paginated enrollment data
 */
export function flattenEnrollmentPages(
  data: InfiniteData<EnrollmentListResponse> | undefined
): EnrollmentResponseDto[] {
  if (!data) return []
  return data.pages.flatMap((page) => page.items)
}

// ============================================================================
// ENROLLMENT SUMMARY
// ============================================================================

interface UseEnrollmentSummaryOptions {
  schoolId: string
  yearId: string
  enabled?: boolean
}

export function useEnrollmentSummary({
  schoolId,
  yearId,
  enabled = true,
}: UseEnrollmentSummaryOptions) {
  return useQuery<EnrollmentSummaryResponse, Error>({
    queryKey: enrollmentKeys.summary(schoolId, yearId),
    queryFn: () => getEnrollmentSummary(schoolId, yearId),
    enabled: enabled && !!schoolId && !!yearId,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================================================
// WITHDRAW STUDENT
// ============================================================================

export function useWithdrawStudent() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { schoolId: string; yearId: string; studentId: string; data: WithdrawStudentParams }
  >({
    mutationFn: ({ schoolId, yearId, studentId, data }) =>
      withdrawStudent(schoolId, yearId, studentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: enrollmentKeys.summary(variables.schoolId, variables.yearId),
      })
      toast.success('Student withdrawn successfully')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// TRANSFER STUDENT
// ============================================================================

export function useTransferStudent() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { schoolId: string; yearId: string; studentId: string; data: TransferStudentParams }
  >({
    mutationFn: ({ schoolId, yearId, studentId, data }) =>
      transferStudent(schoolId, yearId, studentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: enrollmentKeys.summary(variables.schoolId, variables.yearId),
      })
      toast.success('Student transferred successfully')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// MARK NO-SHOW
// ============================================================================

export function useMarkNoShow() {
  const queryClient = useQueryClient()

  return useMutation<
    EnrollmentResponseDto,
    Error,
    { schoolId: string; yearId: string; studentId: string }
  >({
    mutationFn: ({ schoolId, yearId, studentId }) =>
      markNoShow(schoolId, yearId, studentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: enrollmentKeys.summary(variables.schoolId, variables.yearId),
      })
      toast.success('Student marked as no-show')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// CLOSE ACADEMIC YEAR ENROLLMENTS
// ============================================================================

export function useCloseAcademicYear() {
  const queryClient = useQueryClient()

  return useMutation<
    { closed: number; alreadyClosed: number; errors: number },
    Error,
    { schoolId: string; yearId: string; lastDayOfSchool: string }
  >({
    mutationFn: ({ schoolId, yearId, lastDayOfSchool }) =>
      closeAcademicYearEnrollments(schoolId, yearId, lastDayOfSchool),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: enrollmentKeys.summary(variables.schoolId, variables.yearId),
      })
      toast.success(`Year-end closure complete: ${result.closed} enrollments closed`)
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}
