// spec: specs/people/staff-directory.md (selection bar → bulk delete)
// seed: e2e/tests/seed.spec.ts
// Remote route — requires served remotes (see overview.spec.ts header).
//
// Drives the ⑨ SelectionContextBar's Delete selected action into the real
// BulkDeleteStaffModal: no bulk endpoint exists, so the modal fans out one
// DELETE /api/staff/:id per selected record via Promise.allSettled and
// surfaces one aggregate toast.

import { test, expect } from '../../fixtures/test'
import { mockPeopleApi, captureStaffDeletes, PEOPLE_STAFF } from '../../fixtures/people'

test.describe('Staff bulk delete (selection bar)', () => {
  test.beforeEach(async ({ page }) => {
    await mockPeopleApi(page)
  })

  test('select all → delete → one DELETE per record + aggregate toast', async ({ page }) => {
    const captured = await captureStaffDeletes(page)
    await page.goto('/people/staff')
    await expect(page.getByText('Anita Gurung').first()).toBeVisible()

    await page.getByRole('checkbox', { name: 'Select all rows' }).check()
    const bar = page.getByRole('toolbar', { name: 'Selection actions' })
    await expect(bar.getByText('3 selected')).toBeVisible()
    await bar.getByRole('button', { name: 'Delete selected' }).click()

    // Modal confirms with the fan-out count and lists the targets.
    await expect(page.getByRole('heading', { name: 'Delete 3 staff members?' })).toBeVisible()
    await expect(page.getByText('Anita Gurung', { exact: false }).nth(1)).toBeVisible()
    await page.getByRole('button', { name: 'Delete 3', exact: true }).click()

    // Sonner emits a visible toast + an aria-live sr-only copy — .first()
    // picks the visible one (strict-mode).
    await expect(page.getByText('Deleted 3 staff members').first()).toBeVisible()
    expect(captured.staffDeletes.sort()).toEqual(
      PEOPLE_STAFF.map((s) => s.staffId as string).sort(),
    )
    // Selection cleared → toolbar restores.
    await expect(page.getByRole('toolbar', { name: 'Selection actions' })).toHaveCount(0)
  })

  test('partial failure → "Deleted 1; 1 failed" error toast, selection cleared', async ({ page }) => {
    const [a, b] = PEOPLE_STAFF
    await mockPeopleApi(page, { staff: [a, b] })
    const captured = await captureStaffDeletes(page, { failStaffIds: [b.staffId as string] })
    await page.goto('/people/staff')
    await expect(page.getByText('Anita Gurung').first()).toBeVisible()

    await page.getByRole('checkbox', { name: 'Select all rows' }).check()
    await page
      .getByRole('toolbar', { name: 'Selection actions' })
      .getByRole('button', { name: 'Delete selected' })
      .click()
    await page.getByRole('button', { name: 'Delete 2', exact: true }).click()

    await expect(page.getByText('Deleted 1; 1 failed').first()).toBeVisible()
    expect(captured.staffDeletes.sort()).toEqual([a.staffId, b.staffId].sort())
    await expect(page.getByRole('toolbar', { name: 'Selection actions' })).toHaveCount(0)
  })
})
