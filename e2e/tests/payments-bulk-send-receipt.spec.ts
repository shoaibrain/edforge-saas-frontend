/**
 * Bulk send payment receipts (D1) — E2E.
 *
 * Opt-in:
 *   BULK_E2E=1 PLAYWRIGHT_START_SERVER=1 \
 *     pnpm playwright test e2e/tests/payments-bulk-send-receipt.spec.ts
 *
 * Backs the unit-tested `BulkSendReceiptsDrawer` from PR closes #230.
 * Drives the new D1 async-job endpoint (PR #339 backend):
 *   POST /finance/schools/:schoolId/payments/bulk-send-receipt → 202 + jobId
 *   GET  /finance/schools/:schoolId/payments/jobs/:jobId        → poll
 *
 * Fixture seeding for the Payments list isn't in this PR — specs are
 * `test.fixme()` until the fixture lands (tracked alongside #237).
 */

import { test, expect } from '@playwright/test'

const BULK_E2E = process.env.BULK_E2E === '1'

test.describe('Bulk send payment receipts (#230 — D1)', () => {
  test.skip(!BULK_E2E, 'Set BULK_E2E=1 (+ dev server or preview URL) to run.')

  test.fixme(
    'happy path — 2 completed payments selected, send by email, see success toast',
    async ({ page }) => {
      // Drives the ⑨ SelectionContextBar toolbar morph (mirror
      // sections-bulk-status.spec.ts — the floating pill is gone):
      // 1. Visit /finance/billing/payments; seed 2 completed payments
      //    (with receiptNumber) + 1 refunded (no receiptNumber).
      // 2. page.getByRole('checkbox', { name: 'Select all rows' }).check()
      //    → the selection toolbar (role="toolbar") shows "3 selected";
      //    "Send receipt" carries a ·2 subset count chip.
      // 3. page.getByRole('button', { name: 'Send receipt', exact: true })
      //    .click() → drawer opens with exactly the 2 applicable ids
      //    (the refunded row never reaches the drawer). Pick channel "Email".
      // 4. Confirm "Will send (2)".
      // 5. Mock POST /finance/schools/:id/payments/bulk-send-receipt →
      //    { jobId: "job_1", status: "queued", totalRecords: 2 }.
      // 6. Mock GET /finance/schools/:id/payments/jobs/job_1 →
      //    sequence: queued → running (1/2) → succeeded (2/0/0).
      // 7. Apply → drawer renders the progress block; on terminal show
      //    toast "Sent 2 receipts".
      // 8. Drawer closes; selection cleared.
      await page.goto('/finance/billing/payments')
      await expect(page.getByRole('heading', { name: /payments/i })).toBeVisible()
    },
  )

  test.fixme(
    'job failure surfaces top-level error toast',
    async ({ page }) => {
      // Mock the job poll to return { status: 'failed', error: 'SMTP outage' }.
      // Confirm the drawer shows the failed-job state and the toast carries
      // the BE error string verbatim.
      await page.goto('/finance/billing/payments')
    },
  )
})
