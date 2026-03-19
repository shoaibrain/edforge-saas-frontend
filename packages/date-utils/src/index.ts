/**
 * @edforge/date-utils
 *
 * Shared date utilities for the EdForge EMIS platform.
 * Provides Bikram Sambat (BS) ↔ Gregorian (AD) conversion,
 * locale-aware formatting, and React hooks/components.
 */

// Types
export type { BSDate, CalendarSystem, DateDisplayOptions } from './types'

// Converter functions
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
  BS_MONTH_DAYS,
  BS_EPOCH_YEAR,
  AD_EPOCH_MS,
  BS_MONTH_NAMES_NE,
  BS_MONTH_NAMES_EN as BS_MONTHS_EN,
  DAY_NAMES_NE,
  DAY_NAMES_EN,
} from './constants'

// React hooks
export { useDateFormatter } from './hooks/useDateFormatter'
