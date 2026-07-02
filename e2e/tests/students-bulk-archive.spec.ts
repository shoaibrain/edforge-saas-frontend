/**
 * Bulk archive students — E2E (#223 / #237).
 *
 * Academics is a federated remote — run against served remotes:
 *   PLAYWRIGHT_START_SERVER=1 pnpm test:e2e:full e2e/tests/students-bulk-archive.spec.ts
 * (or the consolidated build-deploy output in CI). See docs/testing/rollout-playbook.md.
 *
 * Drives the real BulkArchiveStudentsModal fan-out: confirming archive fires one
 * DELETE /academics/students/:id per selected student (no body), and the UI
 * shows an aggregate toast. captureBulkWrites records the fan-out + injects a
 * 409 for the partial-failure path.
 */

import { test, expect } from '../fixtures/test'
import { mockAcademicsApi, captureBulkWrites, student } from '../fixtures/academics'

// Seeded roster (StudentTable sorts by fullName asc → Aarav, Bhavna, Chandra).
const ROSTER = [
  student({ studentId: 'stu-aarav', fullName: 'Aarav Sharma', studentNumber: '001' }),
  student({ studentId: 'stu-bhavna', fullName: 'Bhavna Poudel', studentNumber: '002' }),
  student({ studentId: 'stu-chandra', fullName: 'Chandra Thapa', studentNumber: '003' }),
]

test.describe('Bulk archive students', () => {
  test.beforeEach(async ({ page }) => {
    await mockAcademicsApi(page, { students: ROSTER })
  })

  test('happy path — select 2, archive, aggregate success toast + 2 DELETEs @smoke', async ({ page }) => {
    const captured = await captureBulkWrites(page)
    await page.goto('/academics/students')

    // Table rendered with the seeded roster.
    await expect(page.getByText('Aarav Sharma')).toBeVisible()

    // Select the first two rows (Aarav, Bhavna).
    const rowChecks = page.getByRole('checkbox', { name: 'Select row' })
    await rowChecks.nth(0).check()
    await rowChecks.nth(1).check()

    // Floating bulk bar shows the count + Archive action.
    await expect(page.getByText('2 selected')).toBeVisible()
    await page.getByRole('button', { name: 'Archive' }).click()

    // Modal opens with the exact (hardcoded) copy. Scope the roster assertion to
    // the dialog — "Bhavna Poudel" also renders in the table row behind it, and an
    // unscoped getByText would resolve to both (strict-mode violation).
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Withdraw 2 students?' })).toBeVisible()
    await expect(dialog.getByText('Bhavna Poudel')).toBeVisible()

    await page.getByRole('button', { name: 'Withdraw 2' }).click()

    // Aggregate success toast, and exactly the 2 selected students were DELETEd.
    await expect(
      page.getByText('Withdrew 2 students (reversible by a school administrator)'),
    ).toBeVisible()
    expect(captured.studentDeletes.sort()).toEqual(['stu-aarav', 'stu-bhavna'])

    // Selection cleared → bulk bar dismissed.
    await expect(page.getByText('2 selected')).toHaveCount(0)
  })

  test('partial failure — one 409 → error toast "Withdrew 1; 1 failed"', async ({ page }) => {
    const captured = await captureBulkWrites(page, { failStudentIds: ['stu-bhavna'] })
    await page.goto('/academics/students')
    await expect(page.getByText('Aarav Sharma')).toBeVisible()

    const rowChecks = page.getByRole('checkbox', { name: 'Select row' })
    await rowChecks.nth(0).check()
    await rowChecks.nth(1).check()
    await page.getByRole('button', { name: 'Archive' }).click()
    await expect(page.getByRole('heading', { name: 'Withdraw 2 students?' })).toBeVisible()
    await page.getByRole('button', { name: 'Withdraw 2' }).click()

    // Both requests were attempted; aggregate reflects the one failure.
    await expect(page.getByText('Withdrew 1; 1 failed')).toBeVisible()
    expect(captured.studentDeletes.sort()).toEqual(['stu-aarav', 'stu-bhavna'])
  })
})
