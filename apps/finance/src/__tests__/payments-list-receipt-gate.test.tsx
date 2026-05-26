/**
 * Sprint M1.5-FU.7.2 — Payments list View Receipt + Download gate.
 *
 * Locks in Issue #19's resolution: clicking the eye-icon View Receipt
 * or per-row Download button on the Payments list only makes sense
 * when the backend can serve the receipt. The backend rejects with
 * `BAD_REQUEST 400 "Receipt is only available for completed payments"`
 * for any non-completed status — even when a stale `receiptNumber`
 * remains on the row from when the payment was completed (it can
 * later move to `refunded`, `voided`, `partially_refunded`, etc.).
 *
 * Operator-reported pre-fix: "It's not consistently working for all
 * the payments." Now: the button doesn't show; the row's affordances
 * match the state.
 *
 * Tests the exported `canShowReceiptActions` predicate that gates BOTH
 * the View eye-icon and the `ReceiptDownloadIconButton` on the
 * Payments list. Both call sites are visible at
 * `apps/finance/src/routes/billing/payments/index.tsx` around the
 * actions-column cell renderer.
 *
 * We use a small render-fixture for the visual-rendering part of the
 * test because the actions-column cell is closure-built inside
 * `usePaymentColumns`. Asserting against the predicate directly is
 * the cheapest accurate test; rendering the full PaymentsPage would
 * require mocking 7+ unrelated hooks.
 */

import { describe, expect, it } from 'vitest'
import type { Payment } from '@edforge/types'

import { canShowReceiptActions } from '../utils/can-show-receipt-actions'

function makePayment(
  status: Payment['status'],
  opts: { receiptNumber?: string | null } = {},
): Pick<Payment, 'status' | 'receiptNumber'> {
  return {
    status,
    receiptNumber: opts.receiptNumber === undefined ? 'RC-001' : opts.receiptNumber,
  }
}

describe('Payments list — View Receipt / Download gate (M1.5-FU.7.2)', () => {
  it('renders both buttons only for completed payments with a receiptNumber', () => {
    expect(canShowReceiptActions(makePayment('completed'))).toBe(true)
  })

  it('hides both buttons for refunded payments even when receiptNumber lingers', () => {
    // The Payment may have completed earlier and minted a receipt — the
    // refund flow does not clear receiptNumber on the original row. The
    // gate must catch this case; the receiptNumber-only gate did not.
    expect(canShowReceiptActions(makePayment('refunded'))).toBe(false)
  })

  it('hides both buttons for partially-refunded payments with stale receipt', () => {
    expect(canShowReceiptActions(makePayment('partially_refunded'))).toBe(false)
  })

  it('hides both buttons for failed payments (no receipt should ever exist)', () => {
    // Defense in depth: failed shouldn't carry a receiptNumber at all,
    // but if a corrupted row does, we still bail.
    expect(canShowReceiptActions(makePayment('failed', { receiptNumber: 'RC-corrupt' }))).toBe(false)
  })

  it('hides both buttons for pending payments', () => {
    expect(canShowReceiptActions(makePayment('pending'))).toBe(false)
  })

  it('hides both buttons for cancelled payments', () => {
    expect(canShowReceiptActions(makePayment('cancelled'))).toBe(false)
  })

  it('hides both buttons for processing payments', () => {
    expect(canShowReceiptActions(makePayment('processing'))).toBe(false)
  })

  it('hides both buttons when status is completed but receiptNumber is missing', () => {
    // Brief window between status transition and receipt-issue side
    // effect — better to render nothing than render a button that
    // would 404 because there is no receipt yet. The Payment type
    // models `receiptNumber: string | null`; the empty-string case
    // is the realistic "set then cleared" path (some API shapes use
    // empty-string-as-null), null is the legit-missing path.
    expect(canShowReceiptActions({ status: 'completed', receiptNumber: null })).toBe(false)
    expect(canShowReceiptActions({ status: 'completed', receiptNumber: '' })).toBe(false)
  })
})
