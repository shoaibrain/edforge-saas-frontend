/**
 * useGrades Hooks
 *
 * React Query hooks for grading policies, grade recording, and gradebook.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getGradingPolicies,
  getGradingPolicy,
  createGradingPolicy,
  updateGradingPolicy,
  recordGrade,
  recordBulkGrades,
  getSectionGrades,
  getStudentGrades,
  finalizeGrade,
  bulkFinalizeGrades,
  parseApiError,
  type GradingPolicyResponse,
  type CreateGradingPolicyParams,
  type UpdateGradingPolicyParams,
  type RecordGradeParams,
  type RecordBulkGradesParams,
  type SectionGradebookResponse,
  type StudentGradesResponse,
  type BulkFinalizeParams,
  type BulkFinalizeResponse,
  getGradeOverview,
  type GradeOverviewResponse,
} from '../services/academics.service'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const gradeKeys = {
  all: ['grades'] as const,
  policies: () => [...gradeKeys.all, 'policies'] as const,
  policyList: (schoolId: string) => [...gradeKeys.policies(), schoolId] as const,
  policy: (policyId: string, schoolId: string) =>
    [...gradeKeys.policies(), policyId, schoolId] as const,
  overview: (schoolId: string, academicYearId: string) =>
    [...gradeKeys.all, 'overview', schoolId, academicYearId] as const,
  sectionGrades: () => [...gradeKeys.all, 'section-grades'] as const,
  sectionGrade: (sectionId: string, params?: { schoolId?: string; termId?: string }) =>
    [...gradeKeys.sectionGrades(), sectionId, params] as const,
  studentGrades: () => [...gradeKeys.all, 'student-grades'] as const,
  studentGrade: (studentId: string, params?: { academicYearId?: string; termId?: string }) =>
    [...gradeKeys.studentGrades(), studentId, params] as const,
}

// ============================================================================
// GRADING POLICIES
// ============================================================================

export function useGradingPolicies(schoolId: string, enabled = true) {
  return useQuery<GradingPolicyResponse[], Error>({
    queryKey: gradeKeys.policyList(schoolId),
    queryFn: () => getGradingPolicies(schoolId),
    enabled: enabled && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useGradingPolicy(policyId: string, schoolId: string, enabled = true) {
  return useQuery<GradingPolicyResponse, Error>({
    queryKey: gradeKeys.policy(policyId, schoolId),
    queryFn: () => getGradingPolicy(policyId, schoolId),
    enabled: enabled && !!policyId && !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================================================
// GRADE OVERVIEW
// ============================================================================

export function useGradeOverview(
  schoolId: string,
  academicYearId: string,
  enabled = true
) {
  return useQuery<GradeOverviewResponse, Error>({
    queryKey: gradeKeys.overview(schoolId, academicYearId),
    queryFn: () => getGradeOverview({ schoolId, academicYearId }),
    enabled: enabled && !!schoolId && !!academicYearId,
    staleTime: 60 * 1000,
  })
}

export function useCreateGradingPolicy() {
  const queryClient = useQueryClient()

  return useMutation<GradingPolicyResponse, Error, CreateGradingPolicyParams>({
    mutationFn: (data) => createGradingPolicy(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: gradeKeys.policyList(variables.schoolId),
      })
      toast.success('Grading policy created successfully')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

export function useUpdateGradingPolicy() {
  const queryClient = useQueryClient()

  return useMutation<
    GradingPolicyResponse,
    Error,
    { policyId: string; schoolId: string; data: UpdateGradingPolicyParams }
  >({
    mutationFn: ({ policyId, schoolId, data }) =>
      updateGradingPolicy(policyId, schoolId, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({
        queryKey: gradeKeys.policyList(variables.schoolId),
      })
      queryClient.setQueryData(
        gradeKeys.policy(variables.policyId, variables.schoolId),
        result
      )
      toast.success('Grading policy updated successfully')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// SECTION GRADEBOOK
// ============================================================================

export function useSectionGrades(
  sectionId: string,
  params: { schoolId: string; termId?: string },
  enabled = true
) {
  return useQuery<SectionGradebookResponse, Error>({
    queryKey: gradeKeys.sectionGrade(sectionId, params),
    queryFn: () => getSectionGrades(sectionId, params),
    enabled: enabled && !!sectionId && !!params.schoolId,
    staleTime: 60 * 1000,
  })
}

// ============================================================================
// STUDENT GRADES
// ============================================================================

export function useStudentGrades(
  studentId: string,
  params?: { schoolId?: string; academicYearId?: string; termId?: string },
  enabled = true
) {
  return useQuery<StudentGradesResponse, Error>({
    queryKey: gradeKeys.studentGrade(studentId, params),
    queryFn: () => getStudentGrades(studentId, params),
    enabled: enabled && !!studentId,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================================================
// RECORD GRADES
// ============================================================================

export function useRecordGrade() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, RecordGradeParams>({
    mutationFn: (data) => recordGrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gradeKeys.sectionGrades(),
      })
      queryClient.invalidateQueries({
        queryKey: gradeKeys.studentGrades(),
      })
      toast.success('Grade recorded')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

export function useRecordBulkGrades() {
  const queryClient = useQueryClient()

  return useMutation<
    { recorded: number; errors: Array<{ studentId: string; error: string }> },
    Error,
    RecordBulkGradesParams
  >({
    mutationFn: (data) => recordBulkGrades(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: gradeKeys.sectionGrades(),
      })
      queryClient.invalidateQueries({
        queryKey: gradeKeys.studentGrades(),
      })
      if (result.errors.length > 0) {
        toast.warning(`Grades saved with ${result.errors.length} error(s)`)
      } else {
        toast.success(`${result.recorded} grades recorded`)
      }
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// FINALIZE GRADE
// ============================================================================

export function useFinalizeGrade() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (gradeId) => finalizeGrade(gradeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.sectionGrades() })
      queryClient.invalidateQueries({ queryKey: gradeKeys.studentGrades() })
      toast.success('Grade finalized')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

export function useBulkFinalizeGrades() {
  const queryClient = useQueryClient()

  return useMutation<BulkFinalizeResponse, Error, BulkFinalizeParams>({
    mutationFn: (data) => bulkFinalizeGrades(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: gradeKeys.sectionGrades() })
      queryClient.invalidateQueries({ queryKey: gradeKeys.studentGrades() })
      if (result.errors.length > 0) {
        toast.warning(
          `${result.finalized} grades finalized with ${result.errors.length} error(s)`
        )
      } else {
        toast.success(`${result.finalized} grades finalized successfully`)
      }
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}
