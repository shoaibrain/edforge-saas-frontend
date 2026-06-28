/**
 * useSchoolGradeOptions — finance-app local mirror of academics-app
 * `useSchoolEnabledGradeOptions` (Sprint B.3 lift-to-shared-package is
 * deferred; an inline copy keeps the Sprint B chip work unblocked
 * without spinning a new workspace package this turn).
 *
 * Resolution order matches the academics hook:
 *   1. `school.enabledGradeLevels` (non-empty array)
 *   2. `school.gradeRange` → derive via shared-types getGradeLevelsInRange
 *   3. Full GRADE_LEVEL_OPTIONS catalog (safer than an empty dropdown)
 *
 * NOTE: depends on the identity `/schools/:schoolId` endpoint which
 * apps/finance already calls in fee-structures.tsx — same shape, same
 * cache key namespace.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@edforge/api-client'
import { getGradeLevelsInRange, type GradeLevel } from '@aibrains/shared-types'

interface SchoolApiResponse {
  schoolId?: string
  id?: string
  name?: string
  enabledGradeLevels?: string[]
  gradeRange?: { start: string; end: string }
}

interface GradeOption {
  value: string
  label: string
}

/**
 * Canonical 20-code grade catalog. Trimmed mirror of the academics-app
 * `GRADE_LEVEL_OPTIONS` so finance doesn't depend on academics MFE
 * package internals. Order matches the catalog.
 */
const GRADE_LEVEL_OPTIONS: readonly GradeOption[] = [
  { value: 'ECD', label: 'ECD' },
  { value: 'PPC', label: 'PPC' },
  { value: 'PG', label: 'Pre-K (PG)' },
  { value: 'NUR', label: 'Nursery (NUR)' },
  { value: 'LKG', label: 'LKG' },
  { value: 'UKG', label: 'UKG' },
  { value: 'KG', label: 'Kindergarten' },
  { value: '1', label: 'Grade 1' },
  { value: '2', label: 'Grade 2' },
  { value: '3', label: 'Grade 3' },
  { value: '4', label: 'Grade 4' },
  { value: '5', label: 'Grade 5' },
  { value: '6', label: 'Grade 6' },
  { value: '7', label: 'Grade 7' },
  { value: '8', label: 'Grade 8' },
  { value: '9', label: 'Grade 9' },
  { value: '10', label: 'Grade 10' },
  { value: '11', label: 'Grade 11' },
  { value: '12', label: 'Grade 12' },
]

export interface UseSchoolGradeOptionsResult {
  /** Filter chip options — always begins with "All Grades" sentinel. */
  options: { value: string; label: string }[]
  /** Underlying grade codes (no "All" sentinel). */
  gradeCodes: string[]
  isLoading: boolean
  source: 'enabledGradeLevels' | 'gradeRange' | 'fallback'
}

export function useSchoolGradeOptions(
  schoolId: string | null,
): UseSchoolGradeOptionsResult {
  const { data: school, isLoading } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => apiGet<SchoolApiResponse>(`/schools/${schoolId}`),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  })

  const { gradeCodes, source } = useMemo<{
    gradeCodes: string[]
    source: 'enabledGradeLevels' | 'gradeRange' | 'fallback'
  }>(() => {
    const enabled = school?.enabledGradeLevels
    if (Array.isArray(enabled) && enabled.length > 0) {
      const enabledSet = new Set(enabled.map(String))
      const filtered = GRADE_LEVEL_OPTIONS.map(o => o.value).filter(v => enabledSet.has(v))
      if (filtered.length > 0) {
        return { gradeCodes: filtered, source: 'enabledGradeLevels' }
      }
    }
    const range = school?.gradeRange
    if (range) {
      try {
        const valid = getGradeLevelsInRange(
          range.start as GradeLevel,
          range.end as GradeLevel,
        )
        const validSet = new Set<string>(valid)
        const filtered = GRADE_LEVEL_OPTIONS.map(o => o.value).filter(v => validSet.has(v))
        if (filtered.length > 0) {
          return { gradeCodes: filtered, source: 'gradeRange' }
        }
      } catch {
        // fall through to full catalog
      }
    }
    return { gradeCodes: GRADE_LEVEL_OPTIONS.map(o => o.value), source: 'fallback' }
  }, [school?.enabledGradeLevels, school?.gradeRange])

  const options = useMemo(() => {
    const opts = gradeCodes.map(code => {
      const known = GRADE_LEVEL_OPTIONS.find(o => o.value === code)
      return known ?? { value: code, label: code }
    })
    return [{ value: '', label: 'All Grades' }, ...opts]
  }, [gradeCodes])

  return { options, gradeCodes, isLoading, source }
}
