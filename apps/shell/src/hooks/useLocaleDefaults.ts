/**
 * useLocaleDefaults Hook
 *
 * Derives locale-aware defaults from the existing workspace settings context.
 * Does NOT make a new API call — reuses the ShellProvider's workspaceSettings query.
 *
 * Returns international defaults (Sat+Sun weekend, Mon-Fri school days) when
 * workspace settings are null (loading or error state). Never throws or blocks rendering.
 */

import { useMemo } from 'react'
import { useWorkspaceSettings } from '../lib/shell-context'
import {
  deriveWeekendDays,
  deriveSchoolDays,
  isNepalLocale,
  getWeekendHint,
  type DayOfWeek,
  type RegionalSettings,
} from '../utils/localeDefaults'

export interface LocaleDefaults {
  /** Weekend days derived from tenant regional settings */
  weekendDays: DayOfWeek[]
  /** School (working) days — complement of weekend days */
  schoolDays: DayOfWeek[]
  /** Numeric school day indices (0=Sun, 6=Sat) for API compatibility */
  schoolDayIndices: number[]
  /** Calendar system in use */
  calendarSystem: 'gregorian' | 'bikram_sambat'
  /** Whether the tenant is configured for Nepal locale */
  isNepal: boolean
  /** Whether dual date display (AD + BS) is enabled */
  dualDateDisplay: boolean
  /** Human-readable hint for school days / weekend */
  weekendHint: string
  /** Raw regional settings (may be null) */
  regional: RegionalSettings | null
}

export function useLocaleDefaults(): LocaleDefaults {
  const workspaceSettings = useWorkspaceSettings()

  return useMemo(() => {
    const regional = workspaceSettings as RegionalSettings | null
    const weekendDays = deriveWeekendDays(regional)
    const schoolDays = deriveSchoolDays(weekendDays)

    const dayToIndex = (d: DayOfWeek): number => {
      const map: Record<DayOfWeek, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6,
      }
      return map[d]
    }

    return {
      weekendDays,
      schoolDays,
      schoolDayIndices: schoolDays.map(dayToIndex),
      calendarSystem: regional?.defaultCalendarSystem || 'gregorian',
      isNepal: isNepalLocale(regional),
      dualDateDisplay: regional?.enableDualDateDisplay ?? false,
      weekendHint: getWeekendHint(weekendDays, schoolDays),
      regional,
    }
  }, [workspaceSettings])
}
