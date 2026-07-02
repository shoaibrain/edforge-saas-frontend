// spec: specs/academics/exams.md
// seed: e2e/tests/seed.spec.ts
// Remote route — requires served remotes (see overview.spec.ts header).

import { test, expect } from '../../fixtures/test'
import { collectConsoleErrors, expectNoConsoleErrors } from '../../fixtures/roles'
import { mockAcademicsApi } from '../../fixtures/academics'

test.describe('Academics exams', () => {
  test.beforeEach(async ({ page }) => {
    await mockAcademicsApi(page)
  })

  test('loads the exams module without console errors', async ({ page }) => {
    const errors = await collectConsoleErrors(page)
    await page.goto('/academics/exams')
    await expect(page.getByRole('navigation', { name: 'Sidebar navigation' })).toBeVisible()
    await expect(page.getByText(/could not be loaded|module error/i)).toHaveCount(0)
    // AY + exam-pattern are mocked, so the no-active-year gate should NOT show.
    await expectNoConsoleErrors(errors.filter((e) => !e.includes('Failed to load resource')))
  })
})
