/**
 * Indian-numbering-system amount-in-words for receipts:
 * crore / lakh / thousand, "… Rupees Only".
 *
 * Words are intentionally English in both locales — Nepali financial
 * documents conventionally spell amounts in English words; only the
 * surrounding label is localized (see `receiptDetail.amountInWords`).
 * Amounts are rounded to whole rupees (receipts carry integer totals).
 */

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
]

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigits(n: number): string {
  if (n < 20) return ONES[n]
  return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : '')
}

function threeDigits(n: number): string {
  const hundreds = n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ' ' : ''}` : ''
  return hundreds + (n % 100 ? twoDigits(n % 100) : '')
}

export function amountInWords(amount: number): string {
  if (!Number.isFinite(amount)) return ''
  let n = Math.round(Math.abs(amount))
  if (n === 0) return 'Zero Rupees Only'

  const parts: string[] = []
  const crore = Math.floor(n / 10_000_000)
  n %= 10_000_000
  const lakh = Math.floor(n / 100_000)
  n %= 100_000
  const thousand = Math.floor(n / 1_000)
  n %= 1_000

  if (crore) parts.push(`${threeDigits(crore)} Crore`)
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`)
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`)
  if (n) parts.push(threeDigits(n))

  return `${parts.join(' ')} Rupees Only`
}
