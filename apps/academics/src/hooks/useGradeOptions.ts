/**
 * useFilteredGradeOptions Hook
 *
 * Shared utility that filters GRADE_LEVEL_OPTIONS to match a school's
 * configured grade range. Falls back to full PK–12 when gradeRange is
 * null/undefined. Uses getGradeLevelsInRange() from shared-types.
 */

import { useMemo } from 'react'
import { getGradeLevelsInRange, type GradeLevel } from '@aibrains/shared-types'
import { GRADE_LEVEL_OPTIONS } from '../schemas/course.form'

type GradeOption = (typeof GRADE_LEVEL_OPTIONS)[number]

/**
 * Returns GRADE_LEVEL_OPTIONS filtered to the school's grade range.
 * Falls back to full PK–12 when gradeRange is null/undefined.
 */
export function useFilteredGradeOptions(
  gradeRange: { start: string; end: string } | null | undefined
): readonly GradeOption[] {
  return useMemo(() => {
    if (!gradeRange) return GRADE_LEVEL_OPTIONS
    try {
      const validCodes = getGradeLevelsInRange(
        gradeRange.start as GradeLevel,
        gradeRange.end as GradeLevel
      )
      const validSet = new Set<string>(validCodes)
      const filtered = GRADE_LEVEL_OPTIONS.filter((o) => validSet.has(o.value))
      return filtered.length > 0 ? filtered : GRADE_LEVEL_OPTIONS
    } catch {
      return GRADE_LEVEL_OPTIONS
    }
  }, [gradeRange])
}
