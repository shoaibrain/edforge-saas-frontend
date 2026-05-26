/**
 * Receipt-action gating helper (Sprint M1.5-FU.7.2 — closes Issue #19).
 *
 * Lives in its own file (not in `routes/billing/payments/index.tsx`)
 * because mixing non-component exports with the page-component
 * default-export breaks React-Refresh / Rsbuild HMR fast-refresh
 * (`react-refresh/only-export-components` ESLint rule).
 */

import type { Payment } from '@edforge/types'

/**
 * Returns true when the Payments-list row's View Receipt + per-row
 * Download PDF buttons should be rendered for this payment.
 *
 * Why both clauses:
 *   - `status === 'completed'`: backend `GET /finance/payments/:id/receipt`
 *     and `/receipt/pdf` both reject with `BAD_REQUEST 400 "Receipt is
 *     only available for completed payments"` for any other status. A
 *     payment that completed and was later refunded / voided /
 *     partially-refunded can still carry a stale `receiptNumber` from
 *     when it was completed, so the `receiptNumber` check alone is not
 *     sufficient.
 *   - `receiptNumber` truthy: a payment may be `completed` for a brief
 *     window before the receipt-issue side effect runs and the field
 *     gets populated — render nothing rather than render a button that
 *     would 404 (no receipt yet).
 *
 * The Payments page uses the same predicate at BOTH gate sites: the
 * eye-icon View button and the `ReceiptDownloadIconButton`.
 */
export function canShowReceiptActions(
  payment: Pick<Payment, 'status' | 'receiptNumber'>,
): boolean {
  return payment.status === 'completed' && !!payment.receiptNumber
}
