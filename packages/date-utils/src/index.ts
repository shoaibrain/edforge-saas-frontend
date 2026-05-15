/**
 * @edforge/date-utils
 *
 * Shared date utilities for the EdForge EMIS platform.
 * Provides Bikram Sambat (BS) ↔ Gregorian (AD) conversion,
 * locale-aware formatting, and React hooks/components.
 *
 * Sprint C0.a.3 — the BS lookup table that used to live locally
 * (`BS_MONTH_DAYS` in `constants.ts`) has been deleted. The
 * `@aibrains/shared-types` package is now the single source of truth
 * for the BS calendar table. This module wraps shared-types' raw
 * converter (`gregorianToBs` / `bsToGregorian`) inside the local
 * `adToBS` / `bsToAD` API so existing consumers don't move.
 */

// Types
export type { BSDate, CalendarSystem, DateDisplayOptions } from './types'

// Converter functions (local wrappers around @aibrains/shared-types)
export {
  adToBS,
  bsToAD,
  formatBSDate,
  formatBSShort,
  formatBSLong,
  formatDate,
  toBSString,
  toBSShort,
  isValidBSDate,
  getDaysInBSMonth,
  BS_MONTH_NAMES_EN,
} from './converter'

// Constants
export {
  BS_EPOCH_YEAR,
  AD_EPOCH_MS,
  BS_MONTH_NAMES_NE,
  BS_MONTH_NAMES_EN as BS_MONTHS_EN,
  DAY_NAMES_NE,
  DAY_NAMES_EN,
} from './constants'

// Authoritative BS API re-exported from @aibrains/shared-types, so any
// consumer that wants the canonical names + ISO-string API can pick
// them up from `@edforge/date-utils` directly (rather than depending on
// `@aibrains/shared-types` twice).
export {
  gregorianToBs,
  bsToGregorian,
  getBsMonthDays,
  getBsYearDays,
  isBsYearSupported,
  getBsSupportedRange,
} from '@aibrains/shared-types'

// React hooks
export { useDateFormatter } from './hooks/useDateFormatter'

// React components
export { BSDateInput } from './components/BSDateInput'
export type { BSDateInputProps } from './components/BSDateInput'
