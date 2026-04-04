/**
 * Locale Defaults Utility
 *
 * Pure functions for deriving locale-aware school configuration defaults
 * from tenant regional settings. Used by useLocaleDefaults() hook and
 * directly by components that need locale derivation without React context.
 */

export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'

export interface RegionalSettings {
  defaultTimezone?: string
  defaultLocale?: string
  defaultDateFormat?: string
  defaultTimeFormat?: '12h' | '24h'
  defaultWeekStartsOn?: 'sunday' | 'monday'
  defaultCurrency?: string
  defaultCalendarSystem?: 'gregorian' | 'bikram_sambat'
  enableDualDateDisplay?: boolean
  defaultNumberFormat?: string
}

/**
 * Derive weekend days from tenant regional settings.
 *
 * NOTE: This OR logic is Nepal/US-specific. If Middle Eastern locales are added
 * (e.g., UAE with Friday+Saturday weekends and Sunday week start), this will need
 * a locale lookup table instead of simple weekStartsOn inference.
 */
export function deriveWeekendDays(regional: RegionalSettings | null | undefined): DayOfWeek[] {
  if (!regional) {
    // International default when settings unavailable
    return ['saturday', 'sunday']
  }

  const { defaultWeekStartsOn, defaultCalendarSystem } = regional

  // Nepal / BS calendar: Sunday is first working day, Saturday is weekend
  if (
    defaultCalendarSystem === 'bikram_sambat' ||
    defaultWeekStartsOn === 'sunday'
  ) {
    return ['saturday']
  }

  // International default: Saturday + Sunday weekend
  return ['saturday', 'sunday']
}

/**
 * Derive school days (working days) by excluding weekend days.
 */
export function deriveSchoolDays(weekendDays: DayOfWeek[]): DayOfWeek[] {
  const allDays: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return allDays.filter(d => !weekendDays.includes(d))
}

/**
 * Convert DayOfWeek string to numeric day index (0=Sunday, 6=Saturday).
 */
export function dayToIndex(day: DayOfWeek): number {
  const map: Record<DayOfWeek, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  }
  return map[day]
}

/**
 * Convert numeric day index to DayOfWeek string.
 */
export function indexToDay(index: number): DayOfWeek {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[index % 7]
}

/**
 * Check if the tenant is configured for Nepal locale.
 */
export function isNepalLocale(regional: RegionalSettings | null | undefined): boolean {
  if (!regional) return false
  return (
    regional.defaultCalendarSystem === 'bikram_sambat' ||
    regional.defaultCurrency === 'NPR' ||
    regional.defaultTimezone === 'Asia/Kathmandu'
  )
}

/**
 * Get a human-readable weekend description for display hints.
 */
export function getWeekendHint(weekendDays: DayOfWeek[], schoolDays: DayOfWeek[]): string {
  const formatDays = (days: DayOfWeek[]) => {
    const labels: Record<DayOfWeek, string> = {
      sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
      thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
    }
    return days.map(d => labels[d]).join('–')
  }

  const schoolRange = formatDays(schoolDays)
  const weekendRange = formatDays(weekendDays)

  return `${schoolRange} instructional · ${weekendRange} non-instructional weekend`
}
