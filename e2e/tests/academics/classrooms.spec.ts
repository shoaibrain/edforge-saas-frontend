// spec: specs/academics/classrooms.md
// seed: e2e/tests/seed.spec.ts
// Remote route — requires served remotes (see overview.spec.ts header).

import { test, expect } from '../../fixtures/test'
import { collectConsoleErrors, expectNoConsoleErrors } from '../../fixtures/roles'
import { mockAcademicsApi } from '../../fixtures/academics'

test.describe('Academics classrooms', () => {
  test.beforeEach(async ({ page }) => {
    await mockAcademicsApi(page)
  })

  test('loads with its four ARIA tabs @smoke', async ({ page }) => {
    const errors = await collectConsoleErrors(page)
    await page.goto('/academics/classrooms')
    await expect(page.getByRole('navigation', { name: 'Sidebar navigation' })).toBeVisible()
    await expect(page.getByText(/could not be loaded|module error/i)).toHaveCount(0)
    // ClassroomsModule renders a real ARIA tablist with 4 tabs (overview /
    // gradebook / policies / attendance). Assert the count, resilient to the
    // i18n label wording.
    const tabs = page.getByRole('tab')
    await expect(tabs).toHaveCount(4)
    await expectNoConsoleErrors(errors.filter((e) => !e.includes('Failed to load resource')))
  })

  test('switching to the gradebook tab updates the URL + panel', async ({ page }) => {
    await page.goto('/academics/classrooms')
    const tabs = page.getByRole('tab')
    await expect(tabs).toHaveCount(4)
    // Second tab is Gradebook (order: overview, gradebook, policies, attendance).
    await tabs.nth(1).click()
    await expect(page).toHaveURL(/tab=gradebook/)
    await expect(page.getByRole('tabpanel')).toBeVisible()
  })
})
