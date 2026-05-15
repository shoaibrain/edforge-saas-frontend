/**
 * Bikram Sambat Constants
 *
 * Month/day names + epoch markers used by frontend formatters.
 *
 * The BS year/month/day lookup table USED to live here as `BS_MONTH_DAYS`;
 * C0.a.3 deleted that copy because `@aibrains/shared-types` already carries
 * the authoritative table (`BS_CALENDAR_DATA`, accessed via
 * `getBsMonthDays` / `getBsYearDays` / `gregorianToBs` / `bsToGregorian`).
 * Single source of truth.
 */

// Reference point: BS 2000/01/01 = AD 1943/04/14
export const BS_EPOCH_YEAR = 2000
export const AD_EPOCH_MS = new Date(1943, 3, 14).getTime() // April 14, 1943

/** BS month names in Devanagari script */
export const BS_MONTH_NAMES_NE = [
  'बैशाख', 'जेठ', 'असार', 'श्रावण',
  'भदौ', 'असोज', 'कार्तिक', 'मंसिर',
  'पुष', 'माघ', 'फागुन', 'चैत्र',
]

/** BS month names in English transliteration */
export const BS_MONTH_NAMES_EN = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan',
  'Bhadra', 'Ashwin', 'Kartik', 'Mangsir',
  'Poush', 'Magh', 'Falgun', 'Chaitra',
]

/** Day names in Nepali */
export const DAY_NAMES_NE = [
  'आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार',
  'बिहीबार', 'शुक्रबार', 'शनिबार',
]

/** Day names in English */
export const DAY_NAMES_EN = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
]
