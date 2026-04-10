/**
 * usePortalStudentGrades — Shell-local hook for student grades
 *
 * Reference implementation for the portal shell-local hook pattern.
 * All portal hooks follow this structure:
 *   - Query key factory (exported for cache invalidation)
 *   - apiGet() + useQuery() wrapper
 *   - Required params: studentId, schoolId
 *   - Optional params via options object
 *   - Full TypeScript types from @aibrains/shared-types
 *
 * Pattern reference: this hook. Copy it for new portal hooks.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import type { StudentGradesResponseDto } from '@aibrains/shared-types'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const portalGradeKeys = {
  all: ['portal-grades'] as const,
  lists: () => [...portalGradeKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...portalGradeKeys.lists(), filters] as const,
  details: () => [...portalGradeKeys.all, 'detail'] as const,
  detail: (studentId: string) =>
    [...portalGradeKeys.details(), studentId] as const,
}

// ============================================================================
// HOOK OPTIONS
// ============================================================================

export interface UsePortalStudentGradesOptions {
  /** Filter to a specific academic year */
  academicYearId?: string
  /** Filter to a specific term/grading period */
  termId?: string
}

// ============================================================================
// HOOK
// ============================================================================

export function usePortalStudentGrades(
  studentId: string,
  schoolId: string,
  options?: UsePortalStudentGradesOptions
) {
  return useQuery({
    queryKey: portalGradeKeys.detail(studentId),
    queryFn: () =>
      apiGet<StudentGradesResponseDto>(
        `/academics/students/${studentId}/grades`,
        {
          schoolId,
          ...(options?.academicYearId && { academicYearId: options.academicYearId }),
          ...(options?.termId && { termId: options.termId }),
        }
      ),
    enabled: !!studentId && !!schoolId,
    staleTime: 5 * 60 * 1000, // 5 minutes — grades don't change frequently
  })
}
