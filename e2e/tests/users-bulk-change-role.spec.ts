/**
 * Bulk change global role — E2E.
 *
 * Opt-in:
 *   BULK_E2E=1 PLAYWRIGHT_START_SERVER=1 \
 *     pnpm playwright test e2e/tests/users-bulk-change-role.spec.ts
 *
 * Backs the unit-tested `BulkChangeUserRoleModal` from PR closes #233.
 * Fan-out goes through the existing single-row `changeGlobalRole` service.
 *
 * Fixture seeding for the People (Users) list isn't in this PR — specs
 * are `test.fixme()` until the fixture lands (tracked alongside #237).
 */

import { test, expect } from '@playwright/test'

const BULK_E2E = process.env.BULK_E2E === '1'

test.describe('Bulk change global user role (#233)', () => {
  test.skip(!BULK_E2E, 'Set BULK_E2E=1 (+ dev server or preview URL) to run.')

  test.fixme(
    'self-demote guard — current user always skipped',
    async ({ page }) => {
      // 1. Visit /settings/people; seed 4 users, one of which is the current user.
      // 2. Select all 4.
      // 3. Click "Change role" → modal opens; target picker defaults to StandardUser.
      // 4. Confirm the "Skipped" line names the current user with reason
      //    "cannot change your own role".
      // 5. Mock POST /tenant/users/:id/global-role × 3 to 200.
      // 6. Confirm → toast "Set 3 users to Standard User · 1 skipped".
      await page.goto('/settings/people')
      await expect(page.getByRole('heading', { name: /user accounts/i })).toBeVisible()
    },
  )

  test.fixme(
    'already-in-target skipped — rows whose role matches target are dropped',
    async ({ page }) => {
      // Seed 2 StandardUser + 1 TenantAdmin. Pick target = TenantAdmin.
      // Confirm modal shows "Set 2 users to Tenant Admin" and lists the
      // existing admin under "Skipped (already Tenant Admin)".
      await page.goto('/settings/people')
    },
  )
})
