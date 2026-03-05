/**
 * useSchool Hooks
 *
 * React Query hooks for school context data:
 * academic years and grading periods (terms).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getAcademicYears,
  getCurrentAcademicYear,
  getGradingPeriods,
  setCurrentAcademicYear,
  updateAcademicYearStatus,
  type AcademicYearResponseDto,
  type GradingPeriodResponseDto,
} from '../services/school.service'
import { parseApiError } from '../services/academics.service'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const schoolKeys = {
  all: ['school'] as const,
  academicYears: (schoolId: string) =>
    [...schoolKeys.all, 'academic-years', schoolId] as const,
  currentYear: (schoolId: string) =>
    [...schoolKeys.all, 'current-year', schoolId] as const,
  gradingPeriods: (schoolId: string, yearId: string) =>
    [...schoolKeys.all, 'grading-periods', schoolId, yearId] as const,
}

// ============================================================================
// ACADEMIC YEARS
// ============================================================================

/**
 * Hook to fetch all academic years for a school
 */
export function useAcademicYears(schoolId: string, enabled = true) {
  return useQuery<AcademicYearResponseDto[], Error>({
    queryKey: schoolKeys.academicYears(schoolId),
    queryFn: () => getAcademicYears(schoolId),
    enabled: enabled && !!schoolId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook to fetch the current academic year for a school
 */
export function useCurrentAcademicYear(schoolId: string, enabled = true) {
  return useQuery<AcademicYearResponseDto, Error>({
    queryKey: schoolKeys.currentYear(schoolId),
    queryFn: () => getCurrentAcademicYear(schoolId),
    enabled: enabled && !!schoolId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    // Don't retry on 404 — new schools won't have a current academic year yet
    retry: (failureCount, error) => {
      if (error?.message?.includes('404') || error?.message?.includes('not found')) return false
      return failureCount < 2
    },
  })
}

// ============================================================================
// GRADING PERIODS (TERMS)
// ============================================================================

/**
 * Hook to fetch grading periods for a specific academic year
 */
export function useGradingPeriods(
  schoolId: string,
  yearId: string,
  enabled = true
) {
  return useQuery<GradingPeriodResponseDto[], Error>({
    queryKey: schoolKeys.gradingPeriods(schoolId, yearId),
    queryFn: () => getGradingPeriods(schoolId, yearId),
    enabled: enabled && !!schoolId && !!yearId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ============================================================================
// SET CURRENT ACADEMIC YEAR
// ============================================================================

export function useSetCurrentAcademicYear() {
  const queryClient = useQueryClient()

  return useMutation<
    AcademicYearResponseDto,
    Error,
    { schoolId: string; yearId: string }
  >({
    mutationFn: ({ schoolId, yearId }) =>
      setCurrentAcademicYear(schoolId, yearId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: schoolKeys.academicYears(variables.schoolId),
      })
      queryClient.invalidateQueries({
        queryKey: schoolKeys.currentYear(variables.schoolId),
      })
      toast.success('Academic year set as current')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}

// ============================================================================
// UPDATE ACADEMIC YEAR STATUS
// ============================================================================

export function useUpdateAcademicYearStatus() {
  const queryClient = useQueryClient()

  return useMutation<
    AcademicYearResponseDto,
    Error,
    { schoolId: string; yearId: string; status: AcademicYearResponseDto['status'] }
  >({
    mutationFn: ({ schoolId, yearId, status }) =>
      updateAcademicYearStatus(schoolId, yearId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: schoolKeys.academicYears(variables.schoolId),
      })
      queryClient.invalidateQueries({
        queryKey: schoolKeys.currentYear(variables.schoolId),
      })
      toast.success('Academic year status updated')
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    },
  })
}
