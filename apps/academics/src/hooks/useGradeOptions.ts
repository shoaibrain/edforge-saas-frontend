/**
 * Hook that turns the global grade-level catalog into the subset relevant
 * to a specific school. Used by every user-facing grade picker in the
 * academics MFE (course form, student modals, enrollment table, rostering,
 * curriculum tab) and mirrored by `deriveSchoolGradeCodes` in the finance
 * MFE (cross-MFE imports aren't allowed; the resolution logic is small
 * enough to duplicate).
 *
 * The legacy `useFilteredGradeOptions(gradeRange)` hook this replaced was
 * removed in the P3 follow-up — every call site is now on this hook.
 */

import { useMemo } from 'react'
import { getGradeLevelsInRange, type GradeLevel } from '@aibrains/shared-types'
import { GRADE_LEVEL_OPTIONS } from '../schemas/course.form'
import { useSchoolProfile } from './useSchool'

type GradeOption = (typeof GRADE_LEVEL_OPTIONS)[number]

/**
 * Returns the subset of `GRADE_LEVEL_OPTIONS` this school actually operates,
 * in canonical catalog order. P3 entry point.
 *
 * Resolution rules (in order):
 *   1. If the school's `enabledGradeLevels` is a non-empty array → filter
 *      `GRADE_LEVEL_OPTIONS` to those codes.
 *   2. Else, if the school has a legacy `gradeRange` → derive via
 *      shared-types' `getGradeLevelsInRange` so a school that's never
 *      visited the Grade Levels Tab still sees a sensible default.
 *   3. Else (no school context yet, or no profile data) → full 20-code
 *      catalog. Safer than an empty dropdown.
 *
 * Returns `{ options, isLoading, source }`:
 *   - `options` is what to render
 *   - `isLoading` lets callers suppress the dropdown until the school
 *     profile has resolved (avoids a flash of the full catalog while
 *     fetching)
 *   - `source` is `'enabledGradeLevels' | 'gradeRange' | 'fallback'` for
 *     debugging and for surfacing "this school hasn't been configured yet"
 *     hints in consumer UI
 */
export function useSchoolEnabledGradeOptions(schoolId: string | null): {
  options: readonly GradeOption[]
  isLoading: boolean
  source: 'enabledGradeLevels' | 'gradeRange' | 'fallback'
} {
  const { data: profile, isLoading } = useSchoolProfile(schoolId)

  const options = useMemo<readonly GradeOption[]>(() => {
    const enabled = profile?.enabledGradeLevels
    if (Array.isArray(enabled) && enabled.length > 0) {
      const enabledSet = new Set<string>(enabled.map(String))
      const filtered = GRADE_LEVEL_OPTIONS.filter((o) => enabledSet.has(o.value))
      return filtered.length > 0 ? filtered : GRADE_LEVEL_OPTIONS
    }
    const range = profile?.gradeRange
    if (range) {
      try {
        const validCodes = getGradeLevelsInRange(
          range.start as GradeLevel,
          range.end as GradeLevel
        )
        const validSet = new Set<string>(validCodes)
        const filtered = GRADE_LEVEL_OPTIONS.filter((o) => validSet.has(o.value))
        if (filtered.length > 0) return filtered
      } catch {
        // fall through to full catalog
      }
    }
    return GRADE_LEVEL_OPTIONS
  }, [profile?.enabledGradeLevels, profile?.gradeRange])

  const source: 'enabledGradeLevels' | 'gradeRange' | 'fallback' =
    Array.isArray(profile?.enabledGradeLevels) && profile.enabledGradeLevels.length > 0
      ? 'enabledGradeLevels'
      : profile?.gradeRange
        ? 'gradeRange'
        : 'fallback'

  return { options, isLoading, source }
}
