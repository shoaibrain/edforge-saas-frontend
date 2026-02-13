/**
 * Shared Schools Hook
 *
 * Fetches the schools list and provides a lookup map for resolving
 * school IDs to names. Extracted from the wizard AssignmentStep
 * for reuse across the app (detail page, assignment cards, etc.).
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

// ============================================================================
// TYPES
// ============================================================================

export interface School {
  schoolId: string
  name: string
  schoolCode: string
  localEducationAgencyName?: string
}

export interface UseSchoolsResult {
  schools: School[]
  /** Map<schoolId, schoolName> for O(1) lookups */
  schoolMap: Map<string, string>
  isLoading: boolean
}

// ============================================================================
// HOOK
// ============================================================================

export function useSchools(): UseSchoolsResult {
  const { data, isLoading } = useQuery<School[]>({
    queryKey: ['schools', 'list'],
    queryFn: async () => {
      const response = await apiGet<{
        items: Array<{
          schoolId: string
          name: string
          schoolCode: string
          localEducationAgencyName?: string
        }>
      }>('/schools')
      return (response.items || []).map((s) => ({
        schoolId: s.schoolId,
        name: s.name,
        schoolCode: s.schoolCode,
        localEducationAgencyName: s.localEducationAgencyName,
      }))
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const schools = data || []

  const schoolMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const school of schools) {
      map.set(school.schoolId, school.name)
    }
    return map
  }, [schools])

  return { schools, schoolMap, isLoading }
}
