/**
 * Bulk void payments — E2E.
 *
 * Opt-in:
 *   BULK_E2E=1 PLAYWRIGHT_START_SERVER=1 \
 *     pnpm playwright test e2e/tests/payments-bulk-void.spec.ts
 *
 * Backs the unit-tested `BulkVoidPaymentsDrawer` from PR closes #229.
 * Fan-out goes through the existing single-row `voidPayment` service.
 *
 * Fixture seeding for the Payments list isn't in this PR — specs are
 * `test.fixme()` until the fixture lands (tracked alongside #237).
 */

import { test, expect } from '@playwright/test'

const BULK_E2E = process.env.BULK_E2E === '1'

test.describe('Bulk void payments (#229)', () => {
  test.skip(!BULK_E2E, 'Set BULK_E2E=1 (+ dev server or preview URL) to run.')

  test.fixme(
    'eligibility split — 2 completed + 1 refunded + 1 missing-receipt',
    async ({ page }) => {
      // 1. Visit /finance/billing/payments; seed 4 payments via page.route.
      // 2. Select all 4 → bulk bar shows "4 selected".
      // 3. Click "Void selected" → drawer opens.
      // 4. Confirm "Will void (2)" section lists the 2 completed+receipted
      //    payments and "Will skip (2)" shows the refunded one ("not
      //    completed (refunded)") and the no-receipt one ("no receipt
      //    number").
      // 5. Type a reason "duplicate" → Apply button enables.
      // 6. Mock POST /finance/.../payments/:id/void × 2 to 200.
      // 7. Confirm → toast "Voided 2 payments · 2 skipped".
      // 8. Drawer closes; selection cleared.
      await page.goto('/finance/billing/payments')
      await expect(page.getByRole('heading', { name: /payments/i })).toBeVisible()
    },
  )

  test.fixme(
    'reason required — Apply disabled until non-whitespace reason typed',
    async ({ page }) => {
      // Confirm the Apply button stays disabled while reason is empty / spaces only.
      await page.goto('/finance/billing/payments')
    },
  )

  test.fixme(
    'partial failure — 1 of 2 backend errors → "Voided 1 · 1 failed"',
    async ({ page }) => {
      await page.goto('/finance/billing/payments')
    },
  )
})
