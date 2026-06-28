/**
 * Bulk archive students — E2E.
 *
 * Opt-in (matches the repo's e2e convention — see attendance.spec.ts):
 *   BULK_E2E=1 PLAYWRIGHT_START_SERVER=1 \
 *     pnpm playwright test e2e/tests/students-bulk-archive.spec.ts
 *
 * Backs the unit-tested `BulkArchiveStudentsModal` from PR closes #223.
 * Fan-out goes through the existing single-row `deleteStudent` service.
 *
 * NOTE: fixture seeding for the Students roster (a mockable
 * `e2e/fixtures/students.ts`) is not in this PR — these specs are
 * documented as `test.fixme()` so the suite stays green and the gap is
 * visible. Unskip once the Students fixture lands (tracked alongside
 * the broader Playwright visual sweep — issue #237).
 */

import { test, expect } from '@playwright/test'

const BULK_E2E = process.env.BULK_E2E === '1'

test.describe('Bulk archive students (#223)', () => {
  test.skip(!BULK_E2E, 'Set BULK_E2E=1 (+ dev server or preview URL) to run.')

  test.fixme(
    'happy path — select 2 students, archive, see aggregate success toast',
    async ({ page }) => {
      // 1. Visit /academics/students; seed 5 students via page.route mock.
      // 2. Select rows 1 + 2 via the row checkboxes.
      // 3. Confirm floating bulk bar shows "2 selected" and the Archive button.
      // 4. Click Archive → BulkArchiveStudentsModal opens with title
      //    "Withdraw 2 students?" and the 2 names listed.
      // 5. Mock POST /students/:id DELETE × 2 to 204.
      // 6. Click "Withdraw 2" → expect aggregate toast
      //    "Withdrew 2 students (reversible by a school administrator)".
      // 7. Table refetches; selection cleared; bulk bar dismissed.
      await page.goto('/academics/students')
      await expect(page.getByRole('heading', { name: /students/i })).toBeVisible()
    },
  )

  test.fixme(
    'partial failure — 1 row 4xx → aggregate toast "Withdrew 1; 1 failed"',
    async ({ page }) => {
      // Mock the first row to 204 and the second to 409 EnrollmentLocked.
      // Confirm error-tone toast and that the table still refetches.
      await page.goto('/academics/students')
    },
  )
})
