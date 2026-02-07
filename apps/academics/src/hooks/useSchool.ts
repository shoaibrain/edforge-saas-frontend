/**
 * useSchool Hooks
 *
 * React Query hooks for school context data:
 * academic years and grading periods (terms).
 */

import { useQuery } from '@tanstack/react-query'
import {
  getAcademicYears,
  getCurrentAcademicYear,
  getGradingPeriods,
  type AcademicYearResponseDto,
  type GradingPeriodResponseDto,
} from '../services/school.service'

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
