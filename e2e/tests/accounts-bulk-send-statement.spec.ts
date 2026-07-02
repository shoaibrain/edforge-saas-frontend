/**
 * Bulk send student-account statements (D3) — E2E.
 *
 * Opt-in:
 *   BULK_E2E=1 PLAYWRIGHT_START_SERVER=1 \
 *     pnpm playwright test e2e/tests/accounts-bulk-send-statement.spec.ts
 *
 * Backs the unit-tested `BulkSendStatementsDrawer` from PR closes #231.
 * Drives the new D3 async-job endpoint (PR #339 backend):
 *   POST /finance/schools/:schoolId/student-accounts/bulk-send-statement
 *   GET  /finance/schools/:schoolId/student-accounts/jobs/:jobId
 *
 * Fixture seeding for the Student Accounts list isn't in this PR —
 * specs are `test.fixme()` until the fixture lands (#237).
 */

import { test, expect } from '@playwright/test'

const BULK_E2E = process.env.BULK_E2E === '1'

test.describe('Bulk send student-account statements (#231 — D3)', () => {
  test.skip(!BULK_E2E, 'Set BULK_E2E=1 (+ dev server or preview URL) to run.')

  test.fixme(
    'happy path — 3 accounts selected → ack → poll → success toast',
    async ({ page }) => {
      // Drives the ⑨ SelectionContextBar toolbar morph (mirror
      // sections-bulk-status.spec.ts — the floating pill is gone):
      // 1. Visit /finance/billing/accounts; seed 3 student accounts.
      // 2. page.getByRole('checkbox', { name: 'Select all rows' }).check()
      //    → the selection toolbar (role="toolbar", name "Selection
      //    actions") shows "3 selected".
      // 3. page.getByRole('button', { name: 'Send statement', exact: true })
      //    .click() → drawer opens. "Recipients (3)" listed.
      // 4. Mock POST → { jobId, status: queued, totalRecords: 3 }.
      // 5. Mock GET poll → queued → running (1/3) → running (2/3) → succeeded.
      // 6. Toast: "Sent 3 statements". Drawer closes; selection cleared.
      await page.goto('/finance/billing/accounts')
      await expect(page.getByRole('heading', { name: /accounts/i })).toBeVisible()
    },
  )

  test.fixme(
    'partial failure — 1 of 3 returns bounce; toast reads "Sent 2 · 1 failed"',
    async ({ page }) => {
      // Poll terminates with { succeeded: 2, failed: 1, skipped: 0 }.
      await page.goto('/finance/billing/accounts')
    },
  )
})
