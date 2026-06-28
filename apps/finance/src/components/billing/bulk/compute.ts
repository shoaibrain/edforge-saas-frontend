/**
 * Bulk Generate Invoices — invoice math projections.
 *
 * Pure functions over already-resolved students + selected fees +
 * customLines. Used by:
 *   - Step 2 live rail (grand total preview as operator picks fees +
 *     discounts).
 *   - Step 4 per-student preview (line-item breakdown rendered before
 *     commit).
 *   - skipZeroTotal client-side projection (matches the BE pre-filter so
 *     the operator-visible count and the actual generated count agree).
 *
 * Phase 1 simplifications (lift in Phase 2):
 *   - No per-grade fee bands. Today's FeeStructure has flat `amount`; the
 *     prototype's perGrade ranges don't exist server-side yet.
 *   - No scholarship / BPL auto-concession. Demographic fields not yet
 *     surfaced by academics. Operators apply discounts manually for now.
 *   - No fee-scope rules (transportOnly / boardersOnly / newAdmissionOnly).
 *     Coverage is determined by gradeLevels match alone.
 */

import type {
  ComputedInvoice,
  ComputedBatch,
  ComputedLine,
  CustomLine,
  FeeStructure,
  SelectedFeesMap,
  StudentSearchResult,
} from './types'

/**
 * Does this fee apply to this student? Phase 1: gradeLevels match only.
 * Empty gradeLevels[] on the fee structure means "applies to all grades".
 */
export function feeApplies(fee: FeeStructure, student: StudentSearchResult): boolean {
  if (!fee.gradeLevels || fee.gradeLevels.length === 0) return true
  return fee.gradeLevels.includes(student.currentGradeLevel)
}

/**
 * Count how many of the selected students each fee actually applies to.
 * Drives the Step 2 coverage chip ("Applies to all 86" / "62 of 86 · 24 skipped").
 */
export function coverageOf(
  fee: FeeStructure,
  students: ReadonlyArray<StudentSearchResult>,
): number {
  let n = 0
  for (const s of students) {
    if (feeApplies(fee, s)) n++
  }
  return n
}

/**
 * Project ONE student's invoice from the wizard's current state. Returns
 * the line breakdown + totals so the per-student preview (Step 4) can
 * render them and the skipZeroTotal projection can compare totals to 0.
 *
 * Custom lines are added regardless of fee applicability — they're
 * operator-supplied "applies to everyone" line items by definition.
 */
export function computeStudentInvoice(
  student: StudentSearchResult,
  fees: ReadonlyArray<FeeStructure>,
  selectedFees: SelectedFeesMap,
  customLines: ReadonlyArray<CustomLine>,
): ComputedInvoice {
  const lines: ComputedLine[] = []
  let subtotal = 0
  let discountTotal = 0

  for (const fee of fees) {
    const cfg = selectedFees[fee.id]
    if (!cfg) continue
    if (!feeApplies(fee, student)) continue
    const base = Number(fee.amount) || 0
    const discount = Math.round(base * (cfg.discountPct || 0)) / 100
    const total = base - discount
    lines.push({
      key: fee.id,
      name: fee.name,
      feeStructureId: fee.id,
      base,
      discount,
      total,
    })
    subtotal += base
    discountTotal += discount
  }

  for (const cli of customLines) {
    const amt = Number(cli.amount)
    if (!cli.name && !amt) continue
    if (Number.isNaN(amt)) continue
    if (amt < 0) continue
    lines.push({
      key: cli.id,
      name: cli.name || 'Custom line item',
      base: amt,
      discount: 0,
      total: amt,
      isCustom: true,
    })
    subtotal += amt
  }

  const total = subtotal - discountTotal
  return {
    studentId: student.studentId,
    studentName: student.fullName,
    gradeLevel: student.currentGradeLevel,
    lines,
    subtotal,
    discountTotal,
    total,
  }
}

/**
 * Project every selected student → roll up to a batch summary. Used by
 * Step 2's live rail and Step 4's grand-total card.
 *
 * When `skipZeroTotal` is true, students whose total = 0 are excluded
 * from `billableTotal` and `avgPerStudent`; `zeroCount` exposes how many
 * — so the wizard can show "12 invoices will be skipped (zero total)".
 */
export function computeBatch(
  students: ReadonlyArray<StudentSearchResult>,
  fees: ReadonlyArray<FeeStructure>,
  selectedFees: SelectedFeesMap,
  customLines: ReadonlyArray<CustomLine>,
  options: { skipZeroTotal?: boolean } = {},
): ComputedBatch {
  const perStudent = students.map(s =>
    computeStudentInvoice(s, fees, selectedFees, customLines),
  )
  let grossTotal = 0
  let billableTotal = 0
  let zeroCount = 0
  let billableCount = 0
  for (const inv of perStudent) {
    grossTotal += inv.total
    if (inv.total === 0) {
      zeroCount++
      if (options.skipZeroTotal) continue
    }
    billableTotal += inv.total
    billableCount++
  }
  return {
    perStudent,
    grossTotal,
    billableTotal,
    zeroCount,
    avgPerStudent: billableCount > 0 ? billableTotal / billableCount : 0,
  }
}

/**
 * Convert the operator-supplied per-fee discount % into the BE-expected
 * flat-amount discount array. Backend's `bulkGenerate.discounts[]` takes
 * { feeStructureId, amount } so we resolve per-fee here at submit time.
 *
 * Phase 1 uses a SINGLE batch-wide discount amount per fee (multiplied by
 * the fee's flat `amount`, NOT per-student — since fees are flat-amount
 * today). Phase 2 (per-grade bands + auto-concessions) will require a
 * per-student discount resolution; for now one entry per selected fee is
 * adequate.
 */
export function resolveDiscounts(
  fees: ReadonlyArray<FeeStructure>,
  selectedFees: SelectedFeesMap,
): Array<{ feeStructureId: string; amount: number; reason?: string }> {
  const out: Array<{ feeStructureId: string; amount: number; reason?: string }> = []
  for (const fee of fees) {
    const cfg = selectedFees[fee.id]
    if (!cfg || !cfg.discountPct || cfg.discountPct <= 0) continue
    const base = Number(fee.amount) || 0
    const amount = Math.round(base * cfg.discountPct) / 100
    if (amount <= 0) continue
    out.push({
      feeStructureId: fee.id,
      amount,
      reason: `${cfg.discountPct}% bulk-batch discount`,
    })
  }
  return out
}

/**
 * Normalise the operator's CustomLine[] (string amount, optional name) into
 * the BE-expected shape (number amount, required name, empty-rows dropped).
 * Backend caps at 10 entries; we mirror that here as defense-in-depth.
 */
export function resolveCustomLineItems(
  customLines: ReadonlyArray<CustomLine>,
): Array<{ name: string; amount: number }> {
  const out: Array<{ name: string; amount: number }> = []
  for (const cli of customLines) {
    const amt = Number(cli.amount)
    if (Number.isNaN(amt) || amt < 0) continue
    if (!cli.name && amt === 0) continue
    out.push({ name: cli.name || 'Custom line item', amount: amt })
    if (out.length >= 10) break
  }
  return out
}

/**
 * Build the invoice-number prefix preview shown in Step 3. Format:
 *   INV-{schoolCode}-{ayShort}-{termCode}-{0001..N}
 * No reservation — Phase 2 (P2.4) adds an actual reservation API. For
 * now this is operator confirmation copy.
 */
export function buildNumberPreview(opts: {
  schoolCode: string
  academicYear: string
  billingPeriod: string
  studentCount: number
}): { prefix: string; first: string; last: string } {
  const sc = (opts.schoolCode || 'XXX').toUpperCase()
  // AY: take last 4 digits if present (e.g. "2083 BS · 2026-27 AD" → "2026")
  const ayMatch = opts.academicYear.match(/\d{4}/g)
  const ay = ayMatch ? ayMatch[ayMatch.length - 1] : 'YYYY'
  const term = termCode(opts.billingPeriod)
  const prefix = `INV-${sc}-${ay}-${term}-`
  const n = Math.max(1, opts.studentCount)
  const first = prefix + '0001'
  const last = prefix + String(n).padStart(4, '0')
  return { prefix, first, last }
}

function termCode(billingPeriod: string): string {
  const bp = billingPeriod.toLowerCase()
  if (bp.includes('first') || bp.includes('1')) return 'T1'
  if (bp.includes('second') || bp.includes('2')) return 'T2'
  if (bp.includes('third') || bp.includes('3')) return 'T3'
  if (bp.includes('fourth') || bp.includes('4')) return 'T4'
  return 'BP'
}
