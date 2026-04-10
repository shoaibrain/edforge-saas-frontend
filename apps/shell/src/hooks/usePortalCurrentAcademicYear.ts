/**
 * usePortalCurrentAcademicYear & usePortalGradingPeriods
 *
 * Shell-local hooks for academic context.
 * Follows the portal hook pattern from usePortalStudentGrades.ts.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

// ============================================================================
// KEY FACTORIES
// ============================================================================

export const portalAcademicYearKeys = {
  all: ['portal-academic-year'] as const,
  current: (schoolId: string) =>
    [...portalAcademicYearKeys.all, 'current', schoolId] as const,
}

export const portalGradingPeriodKeys = {
  all: ['portal-grading-periods'] as const,
  list: (schoolId: string, yearId: string) =>
    [...portalGradingPeriodKeys.all, schoolId, yearId] as const,
}

// ============================================================================
// TYPES
// ============================================================================

export interface AcademicYear {
  id: string
  schoolId: string
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
  status: string
}

export interface GradingPeriod {
  id: string
  academicYearId: string
  name: string
  startDate: string
  endDate: string
  sortOrder: number
  type?: string
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Academic years and grading periods live on the identity service
 * at /schools/:schoolId/academic-years (NOT /academics/schools/...).
 * ABAC: JWT-auth only, no permission guard.
 */
export function usePortalCurrentAcademicYear(schoolId: string) {
  return useQuery({
    queryKey: portalAcademicYearKeys.current(schoolId),
    queryFn: () =>
      apiGet<AcademicYear>(
        `/schools/${schoolId}/academic-years/current`
      ),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
    retry: false, // Don't retry — if it fails, pages fall back to activeSchoolYear from shell context
  })
}

export function usePortalGradingPeriods(schoolId: string, yearId: string) {
  return useQuery({
    queryKey: portalGradingPeriodKeys.list(schoolId, yearId),
    queryFn: async () => {
      const res = await apiGet<{ items: GradingPeriod[] } | GradingPeriod[]>(
        `/schools/${schoolId}/academic-years/${yearId}/grading-periods`
      )
      return Array.isArray(res) ? res : res?.items ?? []
    },
    enabled: !!schoolId && !!yearId,
    staleTime: 10 * 60 * 1000,
  })
}
