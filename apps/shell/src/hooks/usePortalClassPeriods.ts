/**
 * usePortalClassPeriods — Shell-local hook for class period definitions
 *
 * Class periods live on the identity service at /schools/:schoolId/class-periods.
 * Backend returns ClassPeriodListResponseDto = { items: ClassPeriodResponseDto[], hasMore, lastEvaluatedKey }.
 * We normalize to a flat array.
 *
 * Backend field names (ClassPeriodResponseDto):
 *   periodId, classPeriodName, schoolId, tenantId, startTime, endTime,
 *   durationMinutes, sortOrder, periodType, isAcademic, description, createdAt, updatedAt
 *
 * ABAC: authenticated-only (no permission guard on endpoint).
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

export const portalClassPeriodKeys = {
  all: ['portal-class-periods'] as const,
  lists: () => [...portalClassPeriodKeys.all, 'list'] as const,
  list: (schoolId: string) =>
    [...portalClassPeriodKeys.lists(), schoolId] as const,
}

/** Aligned with backend ClassPeriodResponseDto field names */
export interface ClassPeriod {
  periodId: string
  classPeriodName: string
  schoolId: string
  sortOrder: number
  startTime?: string
  endTime?: string
  periodType?: string
  isAcademic?: boolean
  durationMinutes?: number
}

export function usePortalClassPeriods(schoolId: string) {
  return useQuery({
    queryKey: portalClassPeriodKeys.list(schoolId),
    queryFn: async () => {
      // Class periods live on the identity service at /schools/:schoolId/class-periods
      const res = await apiGet<{ items: ClassPeriod[] } | ClassPeriod[]>(
        `/schools/${schoolId}/class-periods`
      )
      return Array.isArray(res) ? res : res?.items ?? []
    },
    enabled: !!schoolId,
    staleTime: 30 * 60 * 1000,
  })
}
