/**
 * Bulk suspend users — E2E.
 *
 * Opt-in:
 *   BULK_E2E=1 PLAYWRIGHT_START_SERVER=1 \
 *     pnpm playwright test e2e/tests/users-bulk-suspend.spec.ts
 *
 * Backs the unit-tested `BulkSuspendUsersModal` from PR closes #234.
 * Fan-out goes through the existing single-row `updateUser` service.
 *
 * Fixture seeding for the People (Users) list isn't in this PR — specs
 * are `test.fixme()` until the fixture lands (tracked alongside #237).
 */

import { test, expect } from '@playwright/test'

const BULK_E2E = process.env.BULK_E2E === '1'

test.describe('Bulk suspend users (#234)', () => {
  test.skip(!BULK_E2E, 'Set BULK_E2E=1 (+ dev server or preview URL) to run.')

  test.fixme(
    'happy path — 3 active users selected, suspend, see success toast',
    async ({ page }) => {
      // 1. Visit /settings/people; seed 3 active + 1 already-suspended user.
      // 2. Select all 4 → bulk bar shows "4 selected" with critical-tone
      //    Suspend button.
      // 3. Click Suspend → modal opens, header "Suspend 3 users?"
      //    (skipped row shown with reason "already suspended").
      // 4. Mock PATCH /tenant/users/:id × 3 to 200.
      // 5. Confirm → toast "Suspended 3 users · 1 skipped".
      // 6. Table refetches; selection cleared.
      await page.goto('/settings/people')
      await expect(page.getByRole('heading', { name: /user accounts/i })).toBeVisible()
    },
  )

  test.fixme(
    'self always skipped — cannot suspend yourself',
    async ({ page }) => {
      // Seed: 2 other active + the current user. Select all 3.
      // Confirm the current user appears as skipped ("cannot suspend yourself").
      await page.goto('/settings/people')
    },
  )
})
