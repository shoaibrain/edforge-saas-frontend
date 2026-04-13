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

export interface GradingPolicy {
  id: string
  schoolId: string
  name: string
  description?: string
  gradingScale: Array<{
    letter: string
    minPercentage: number
    maxPercentage: number
    gpaPoints: number
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
