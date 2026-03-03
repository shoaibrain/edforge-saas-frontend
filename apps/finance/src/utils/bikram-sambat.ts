/**
 * Bikram Sambat (BS) academic year utility.
 *
 * The BS calendar is ~56.7 years ahead of Gregorian.
 * The Nepali new year falls around mid-April (Baisakh 1),
 * so before April we are still in the previous BS year.
 */

export function getCurrentBSYear(): string {
  const now = new Date()
  const gregYear = now.getFullYear()
  const month = now.getMonth() // 0-indexed (0 = Jan, 3 = Apr)
  // BS year starts ~mid-April. Before April = previous BS year.
  const bsYear = month < 3 ? gregYear + 56 : gregYear + 57
  return `${bsYear}/${String(bsYear + 1).slice(-2)}` // e.g. "2082/83"
}
