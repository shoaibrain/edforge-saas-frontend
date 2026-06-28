/**
 * Bulk activate / deactivate sections — E2E.
 *
 * Opt-in:
 *   BULK_E2E=1 PLAYWRIGHT_START_SERVER=1 \
 *     pnpm playwright test e2e/tests/sections-bulk-status.spec.ts
 *
 * Backs the unit-tested `BulkSectionStatusModal` from PR closes #224.
 * Fan-out goes through the existing single-row `updateSection` service.
 *
 * Fixture seeding for the Sections list isn't in this PR — specs are
 * `test.fixme()` until the Sections fixture lands (tracked alongside
 * #237).
 */

import { test, expect } from '@playwright/test'

const BULK_E2E = process.env.BULK_E2E === '1'

test.describe('Bulk section activate / deactivate (#224)', () => {
  test.skip(!BULK_E2E, 'Set BULK_E2E=1 (+ dev server or preview URL) to run.')

  test.fixme(
    'activate path — select 3 inactive sections, activate, see success toast',
    async ({ page }) => {
      // 1. Visit /academics/classrooms (Overview tab) in list view.
      // 2. Seed 3 inactive + 1 active section via page.route mock.
      // 3. Select all 4 → bulk bar shows "4 selected".
      // 4. Click Activate → modal opens, header says "Activate 3 sections?"
      //    and the already-active section appears as "Skipped".
      // 5. Mock PUT /sections/:id × 3 to 200.
      // 6. Confirm → toast "Activated 3 sections · 1 skipped".
      await page.goto('/academics/classrooms')
      await expect(page.getByRole('button', { name: /list/i })).toBeVisible()
    },
  )

  test.fixme(
    'deactivate path — non-zero enrollment shows the warning slot',
    async ({ page }) => {
      // 1. Seed 2 active sections with currentEnrollment = 12 and 0.
      // 2. Select both → Deactivate → modal warning reads
      //    "12 students currently enrolled across these sections —
      //    deactivating doesn't unenroll them."
      // 3. Confirm → toast "Deactivated 2 sections".
      await page.goto('/academics/classrooms')
    },
  )
})
