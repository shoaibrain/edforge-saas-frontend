// spec: specs/academics/curriculum.md
// seed: e2e/tests/seed.spec.ts
// Remote route — requires served remotes (see overview.spec.ts header).

import { test, expect } from '../../fixtures/test'
import { collectConsoleErrors, expectNoConsoleErrors } from '../../fixtures/roles'
import { mockAcademicsApi } from '../../fixtures/academics'

test.describe('Academics curriculum', () => {
  test.beforeEach(async ({ page }) => {
    await mockAcademicsApi(page)
  })

  test('loads and shows the seeded course', async ({ page }) => {
    const errors = await collectConsoleErrors(page)
    await page.goto('/academics/curriculum')
    await expect(page.getByRole('navigation', { name: 'Sidebar navigation' })).toBeVisible()
    await expect(page.getByText(/could not be loaded|module error/i)).toHaveCount(0)
    // Seeded course renders in the courses tab (default).
    await expect(page.getByText('Mathematics').first()).toBeVisible()
    await expectNoConsoleErrors(errors.filter((e) => !e.includes('Failed to load resource')))
  })
})
