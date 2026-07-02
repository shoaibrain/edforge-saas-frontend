/**
 * Pure validation for the Record Payment drawer. Mirrors the backend
 * recordManualPaymentSchema constraints (gateway enum, positive amount,
 * 10M cap) plus the client-side overpayment block.
 */

export type ManualPaymentGateway = 'cash' | 'bank_transfer' | 'cheque'

/** Backend zod cap: z.number().positive().max(10_000_000). */
export const MANUAL_PAYMENT_MAX = 10_000_000

export interface RecordPaymentDraft {
  /** Whole-rupee amount parsed from the input (0 when empty/invalid). */
  amount: number
  /** The invoice's current amount due. */
  amountDue: number
  gateway: ManualPaymentGateway
  /** Transaction reference — required for non-cash gateways. */
  reference: string
}

export type RecordPaymentValidationError =
  | 'amount_required'
  | 'overpayment'
  | 'over_cap'
  | 'reference_required'

export function validateRecordPayment(
  draft: RecordPaymentDraft
): RecordPaymentValidationError | null {
  if (!Number.isFinite(draft.amount) || draft.amount <= 0) return 'amount_required'
  if (draft.amount > MANUAL_PAYMENT_MAX) return 'over_cap'
  if (draft.amount > draft.amountDue) return 'overpayment'
  if (draft.gateway !== 'cash' && draft.reference.trim().length === 0) {
    return 'reference_required'
  }
  return null
}
