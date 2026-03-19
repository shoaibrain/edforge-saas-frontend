/**
 * Academic Year Hook
 *
 * Fetches the current academic year for a school. Used by the staff
 * overview dashboard to resolve academicYearId for enrollment summary
 * and grade queries.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

// ============================================================================
// TYPES
// ============================================================================

export interface AcademicYear {
  yearId: string
  schoolId: string
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
  status: 'planning' | 'active' | 'completed' | 'archived'
}

// ============================================================================
// HOOK
// ============================================================================

export function useCurrentAcademicYear(schoolId: string | undefined, enabled = true) {
  return useQuery<AcademicYear | null, Error>({
    queryKey: ['school', 'current-year', schoolId],
    queryFn: async () => {
      try {
        return await apiGet<AcademicYear>(
          `/schools/${schoolId}/academic-years/current`,
        )
      } catch {
        return null
      }
    },
    enabled: enabled && !!schoolId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
