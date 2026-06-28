/**
 * Bulk adjust student-account balance (D4) — E2E.
 *
 * Opt-in:
 *   BULK_E2E=1 PLAYWRIGHT_START_SERVER=1 \
 *     pnpm playwright test e2e/tests/accounts-bulk-adjust-balance.spec.ts
 *
 * Backs the unit-tested `BulkAdjustBalanceDrawer` from PR closes #232.
 * Drives the new D4 async-job endpoint (PR #339 backend):
 *   POST /finance/schools/:schoolId/student-accounts/bulk-adjust
 *   GET  /finance/schools/:schoolId/student-accounts/jobs/:jobId
 *
 * Ledger writes are fast; the job typically terminates in <2s. UX is
 * identical to D1–D3 for consistency.
 *
 * Fixture seeding for the Student Accounts list isn't in this PR —
 * specs are `test.fixme()` until the fixture lands (#237).
 */

import { test, expect } from '@playwright/test'

const BULK_E2E = process.env.BULK_E2E === '1'

test.describe('Bulk adjust student-account balance (#232 — D4)', () => {
  test.skip(!BULK_E2E, 'Set BULK_E2E=1 (+ dev server or preview URL) to run.')

  test.fixme(
    'Apply button stays disabled until amount + reason + effectiveDate are valid',
    async ({ page }) => {
      // Open drawer with 2 accounts selected.
      // Confirm Apply is disabled with empty inputs.
      // Fill amount=50, reason="x", effectiveDate=today → Apply enables.
      // Clear reason → Apply disables again.
      await page.goto('/finance/billing/accounts')
      await expect(page.getByRole('heading', { name: /accounts/i })).toBeVisible()
    },
  )

  test.fixme(
    'sign-threshold guard — without override, BE skips surplus rows; toast shows skipped count',
    async ({ page }) => {
      // Seed: 3 accounts, one with negative balance (surplus).
      // Pick type=credit, amount=10, override unchecked.
      // Mock POST → 202; GET poll → succeeded { succeeded: 2, skipped: 1,
      //   failures: [{ recordId: 'acct-3', reason: 'sign-threshold exceeded' }] }.
      // Toast: "Adjusted 2 accounts · 1 skipped".
      await page.goto('/finance/billing/accounts')
    },
  )

  test.fixme(
    'override toggle bypasses the guard — all 3 succeed',
    async ({ page }) => {
      // Same seed; check override; expect all 3 to succeed.
      // Toast: "Adjusted 3 accounts".
      await page.goto('/finance/billing/accounts')
    },
  )
})
