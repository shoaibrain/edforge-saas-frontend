/**
 * Pure validator for the family (multi-invoice) manual-payment mode.
 *
 * Kept React-free so it's unit-testable in isolation. Mirrors the backend
 * contract on POST /finance/schools/:schoolId/payments/manual (multi body):
 * every application must reference a known open invoice, each amount must be
 * within [0, that invoice's balance], and the total must be > 0 (at least one
 * non-zero allocation). Returns i18n keys (not rendered strings) so the caller
 * owns translation.
 *
 * `allocations` is keyed by invoiceId → raw string from the amount input; parse
 * defensively (parseFloat || 0) and treat NaN/negative as invalid.
 */

export interface FamilyOpenInvoiceRow {
  invoiceId: string
  amountDue: number
}

export interface FamilyPaymentValidationResult {
  valid: boolean
  errors: string[]
}

const KEY_PREFIX = 'recordPayment.family.validation'

export function validateFamilyPayment(
  allocations: Record<string, string>,
  openInvoices: readonly FamilyOpenInvoiceRow[],
): FamilyPaymentValidationResult {
  const errors: string[] = []
  const knownIds = new Set(openInvoices.map((inv) => inv.invoiceId))
  const dueById = new Map(openInvoices.map((inv) => [inv.invoiceId, inv.amountDue]))

  let hasPositive = false

  for (const [invoiceId, raw] of Object.entries(allocations)) {
    const parsed = parseFloat(raw)
    const amount = Number.isFinite(parsed) ? parsed : 0

    if (!knownIds.has(invoiceId)) {
      // An allocation for an invoice not in the family's open set.
      errors.push(`${KEY_PREFIX}.unknownInvoice`)
      continue
    }

    if (amount < 0) {
      errors.push(`${KEY_PREFIX}.negativeAmount`)
      continue
    }

    if (amount === 0) {
      continue
    }

    const due = dueById.get(invoiceId) ?? 0
    if (amount > due) {
      errors.push(`${KEY_PREFIX}.overAllocated`)
      continue
    }

    hasPositive = true
  }

  if (!hasPositive) {
    errors.push(`${KEY_PREFIX}.noAllocation`)
  }

  return { valid: errors.length === 0, errors }
}
