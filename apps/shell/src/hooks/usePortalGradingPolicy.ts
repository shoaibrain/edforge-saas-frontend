/**
 * usePortalGradingPolicy — Shell-local hook for grading policies
 *
 * Returns grading policy with category weights for CourseCard display.
 * ABAC verified: both Student and Parent roles have grades:view permission.
 * Follows the portal hook pattern from usePortalStudentGrades.ts.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

export const portalGradingPolicyKeys = {
  all: ['portal-grading-policies'] as const,
  list: (schoolId: string) =>
    [...portalGradingPolicyKeys.all, schoolId] as const,
}

export interface GradingPolicyCategory {
  categoryId: string
  categoryName: string
  weight: number
  dropLowest?: number
}

/**
 * Sprint 1 / Ticket 1.8 — `gradingScale` renamed to `letterGrades` in
 * shared-types D.1.1. The portal grade pages do not currently consume the
 * letter-grade entries (they only use category weights), but keep the
 * field aligned with the backend response so future portal-side reads
 * don't repeat the academics-MFE crash.
 */
export interface GradingPolicy {
  id: string
  schoolId: string
  name: string
  description?: string
  letterGrades: Array<{
    letter: string
    minPercentage: number
    maxPercentage: number
    gpaPoints: number
    isPassing: boolean
  }>
  categoryWeights: GradingPolicyCategory[]
  isDefault: boolean
}

export function usePortalGradingPolicy(schoolId: string) {
  return useQuery({
    queryKey: portalGradingPolicyKeys.list(schoolId),
    queryFn: () =>
      apiGet<GradingPolicy[]>(
        `/academics/grading-policies`,
        { schoolId }
      ),
    enabled: !!schoolId,
    staleTime: 30 * 60 * 1000, // 30 minutes — policies rarely change
  })
}
