// spec: specs/academics/students.md
// seed: e2e/tests/seed.spec.ts
// Remote route — requires served remotes (see overview.spec.ts header).

import { test, expect } from '../../fixtures/test'
import { collectConsoleErrors, expectNoConsoleErrors } from '../../fixtures/roles'
import { mockAcademicsApi } from '../../fixtures/academics'

test.describe('Academics students', () => {
  test.beforeEach(async ({ page }) => {
    await mockAcademicsApi(page)
  })

  test('students list renders the seeded roster @smoke', async ({ page }) => {
    const errors = await collectConsoleErrors(page)
    await page.goto('/academics/students')
    await expect(page.getByRole('navigation', { name: 'Sidebar navigation' })).toBeVisible()
    await expect(page.getByText(/could not be loaded|module error|try again/i)).toHaveCount(0)
    // Seeded student surfaces somewhere in the page (table row).
    await expect(page.getByText('Aarav Sharma').first()).toBeVisible()
    await expectNoConsoleErrors(errors.filter((e) => !e.includes('Failed to load resource')))
  })
})

test.describe('Academics students — empty state', () => {
  test.beforeEach(async ({ page }) => {
    await mockAcademicsApi(page, { empty: true })
  })

  test('renders cleanly with no students', async ({ page }) => {
    await page.goto('/academics/students')
    await expect(page.getByRole('navigation', { name: 'Sidebar navigation' })).toBeVisible()
    await expect(page.getByText(/could not be loaded|module error/i)).toHaveCount(0)
    // No roster names present.
    await expect(page.getByText('Aarav Sharma')).toHaveCount(0)
  })
})
