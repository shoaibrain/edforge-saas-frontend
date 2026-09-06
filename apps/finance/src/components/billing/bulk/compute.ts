/**
 * Bulk Generate Invoices — invoice math projections.
 *
 * Pure functions over already-resolved students + selected fees +
 * customLines. Used by:
 *   - Step 2 live rail (grand total preview as operator picks fees).
 *   - Step 4 per-student preview (line-item breakdown rendered before
 *     commit).
 *   - skipZeroTotal client-side projection (matches the BE pre-filter so
 *     the operator-visible count and the actual generated count agree).
 *
 * NO discounts: the backend's bulkGenerateInvoiceSchema carries no discounts
 * field, so bulk invoices always bill full price. Discounts are only
 * supported on the single-invoice generate path — the projection here must
 * match what the BE actually bills.
 *
 * Phase 1 simplifications (lift in Phase 2):
 *   - No per-grade fee bands. Today's FeeStructure has flat `amount`; the
 *     prototype's perGrade ranges don't exist server-side yet.
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
  StudentAgreementPricing,
  StudentSearchResult,
} from './types'

/**
 * Does this fee apply to this student? Phase 1: gradeLevels match only.
 * Empty gradeLevels[] on the fee structure means "applies to all grades".
 */
/**
 * Name placeholder for the agreement replacement line. Renderers translate
 * it; keeping a key here avoids pulling i18n into a pure math module.
 */
export const AGREEMENT_LINE_KEY = 'bulkGenerate.agreementLine'

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
  agreement?: StudentAgreementPricing,
): ComputedInvoice {
  const lines: ComputedLine[] = []
  let subtotal = 0

  // #465 — an active agreement replaces the catalog fees it covers. Without
  // this the wizard previewed agreement-covered students at catalog rates:
  // a family on a NPR 20,000 agreement showed NPR 33,000, and the operator
  // confirmed a number that would never be billed. `suppressedFeeStructureIds`
  // and `agreementAmount` come from bulk-preview, which derives them from the
  // same code the generate path bills with.
  const suppressed = new Set(agreement?.suppressedFeeStructureIds ?? [])

  for (const fee of fees) {
    if (!selectedFees[fee.id]) continue
    if (!feeApplies(fee, student)) continue
    const base = Number(fee.amount) || 0
    if (suppressed.has(fee.id)) {
      // Kept visible, contributing nothing — the operator should see what
      // the agreement displaced rather than wonder where the fee went.
      lines.push({
        key: fee.id,
        name: fee.name,
        feeStructureId: fee.id,
        base,
        total: 0,
        isSuppressed: true,
      })
      continue
    }
    lines.push({
      key: fee.id,
      name: fee.name,
      feeStructureId: fee.id,
      base,
      total: base,
    })
    subtotal += base
  }

  const agreementAmount = Number(agreement?.agreementAmount) || 0
  if (suppressed.size > 0 && agreementAmount > 0) {
    lines.push({
      key: `agreement-${student.studentId}`,
      name: AGREEMENT_LINE_KEY,
      base: agreementAmount,
      total: agreementAmount,
      isAgreement: true,
    })
    subtotal += agreementAmount
  }

  for (const cli of customLines) {
    const amt = Number(cli.amount)
    if (!cli.name && !amt) continue
    if (Number.isNaN(amt)) continue
    if (amt < 0) continue
    // Unnamed lines keep name '' here — renderers apply the t()'d fallback.
    lines.push({
      key: cli.id,
      name: cli.name,
      base: amt,
      total: amt,
      isCustom: true,
    })
    subtotal += amt
  }

  return {
    studentId: student.studentId,
    studentName: student.fullName,
    gradeLevel: student.currentGradeLevel,
    lines,
    subtotal,
    total: subtotal,
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
  options: {
    skipZeroTotal?: boolean
    /** studentId → agreement projection from bulk-preview (#465). */
    agreements?: Readonly<Record<string, StudentAgreementPricing>>
  } = {},
): ComputedBatch {
  const perStudent = students.map(s =>
    computeStudentInvoice(s, fees, selectedFees, customLines, options.agreements?.[s.studentId]),
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
 * Normalise the operator's CustomLine[] (string amount, optional name) into
 * the BE-expected shape (number amount, required name, empty-rows dropped).
 * Backend caps at 10 entries; we mirror that here as defense-in-depth.
 * `fallbackName` is the t()'d label for lines the operator left unnamed
 * (customLineItemSchema requires name 1..120).
 */
export function resolveCustomLineItems(
  customLines: ReadonlyArray<CustomLine>,
  fallbackName: string,
): Array<{ name: string; amount: number }> {
  const out: Array<{ name: string; amount: number }> = []
  for (const cli of customLines) {
    const amt = Number(cli.amount)
    if (Number.isNaN(amt) || amt < 0) continue
    if (!cli.name && amt === 0) continue
    out.push({ name: cli.name || fallbackName, amount: amt })
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
