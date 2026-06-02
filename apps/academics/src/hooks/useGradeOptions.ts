/**
 * Hooks that turn the global grade-level catalog into the subset relevant
 * to a specific school. Used by every user-facing grade picker in the
 * academics MFE.
 *
 * Two layers exist for backward compat during P3 rollout:
 *   - `useFilteredGradeOptions(gradeRange)` — legacy, range-based filtering.
 *     Still exported for callers that haven't migrated. New callers should
 *     not use it directly.
 *   - `useSchoolEnabledGradeOptions(schoolId)` — P3 entry point. Reads
 *     `school.enabledGradeLevels` (the P1 field operators control via the
 *     Settings → Grade Levels tab). Falls back to gradeRange-based filtering
 *     for schools that haven't yet been opened in the new tab.
 *
 * P3 is opt-in per consumer: forms migrate one-by-one. After every consumer
 * is on the new hook, `useFilteredGradeOptions` becomes unused and can be
 * deleted.
 */

import { useMemo } from 'react'
import { getGradeLevelsInRange, type GradeLevel } from '@aibrains/shared-types'
import { GRADE_LEVEL_OPTIONS } from '../schemas/course.form'
import { useSchoolProfile } from './useSchool'

type GradeOption = (typeof GRADE_LEVEL_OPTIONS)[number]

/**
 * Returns GRADE_LEVEL_OPTIONS filtered to the school's grade range.
 * Falls back to full PK–12 when gradeRange is null/undefined.
 *
 * @deprecated New callers should use `useSchoolEnabledGradeOptions(schoolId)`.
 *   This hook will be removed once every consumer migrates (tracked in P3).
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

/**
 * Returns the subset of `GRADE_LEVEL_OPTIONS` this school actually operates,
 * in canonical catalog order. P3 entry point.
 *
 * Resolution rules (in order):
 *   1. If the school's `enabledGradeLevels` is a non-empty array → filter
 *      `GRADE_LEVEL_OPTIONS` to those codes.
 *   2. Else, if the school has a legacy `gradeRange` → fall back to the
 *      same logic as `useFilteredGradeOptions` so a school that's never
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
