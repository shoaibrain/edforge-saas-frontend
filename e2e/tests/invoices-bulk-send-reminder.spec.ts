/**
 * Bulk send invoice reminders (D2) — E2E.
 *
 * Opt-in:
 *   BULK_E2E=1 PLAYWRIGHT_START_SERVER=1 \
 *     pnpm playwright test e2e/tests/invoices-bulk-send-reminder.spec.ts
 *
 * Backs the unit-tested `BulkSendInvoiceReminderDrawer` from PR closes
 * #236. Drives the new D2 async-job endpoint (PR #339 backend):
 *   POST /finance/schools/:schoolId/invoices/bulk-send-reminder
 *   GET  /finance/schools/:schoolId/invoices/jobs/:jobId
 *
 * Fixture seeding for the Invoices list isn't in this PR — specs are
 * `test.fixme()` until the fixture lands (tracked alongside #237).
 */

import { test, expect } from '@playwright/test'

const BULK_E2E = process.env.BULK_E2E === '1'

test.describe('Bulk send invoice reminders (#236 — D2)', () => {
  test.skip(!BULK_E2E, 'Set BULK_E2E=1 (+ dev server or preview URL) to run.')

  test.fixme(
    'eligibility split — issued + partially_paid eligible; paid / draft skipped',
    async ({ page }) => {
      // Seed: 2 issued + 1 partially_paid + 1 paid + 1 draft.
      // Select all 5 → "Send reminder" → drawer opens.
      // Confirm "Will remind (3)" lists the 2 issued + 1 partially_paid;
      // "Will skip (2)" lists the paid + draft with "not outstanding" reasons.
      // Apply with channel=email + customNote="Term ends Friday";
      // ack → poll → succeeded { 3/0/0 }. Toast: "Sent 3 reminders".
      await page.goto('/finance/billing/invoices')
      await expect(page.getByRole('heading', { name: /invoices/i })).toBeVisible()
    },
  )

  test.fixme(
    'rate-limited rows surface as skipped in the terminal job result',
    async ({ page }) => {
      // Mock POST → 202 + jobId; GET poll terminates with
      // { succeeded: 1, skipped: 2, failed: 0, failures: [
      //   { recordId: 'inv-2', reason: 'rate-limited (24h)' },
      //   { recordId: 'inv-3', reason: 'guardian opted out' },
      // ] }.
      // Confirm toast reads "Sent 1 reminder · 2 skipped".
      await page.goto('/finance/billing/invoices')
    },
  )

  test.fixme(
    'custom note above the 240-char cap is truncated at input',
    async ({ page }) => {
      // Type 300 chars into the custom-note textarea; confirm only 240 land.
      await page.goto('/finance/billing/invoices')
    },
  )
})
