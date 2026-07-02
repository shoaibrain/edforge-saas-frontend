// spec: specs/shell/home-dashboard.md
// seed: e2e/tests/seed.spec.ts

import { test, expect } from '../../fixtures/test'
import { collectConsoleErrors, expectNoConsoleErrors } from '../../fixtures/roles'

test.describe('Dashboard data', () => {
  test('KPI cards render mocked enrollment data @smoke', async ({ page }) => {
    await page.goto('/home')
    await expect(page.getByText('Students enrolled')).toBeVisible()
    await expect(page.getByText('42', { exact: true }).first()).toBeVisible()
  })

  test('Dashboard renders without console errors', async ({ page }) => {
    const errors = await collectConsoleErrors(page)
    await page.goto('/home')
    await expect(page.getByRole('navigation', { name: 'Sidebar navigation' })).toBeVisible()
    await expect(page.getByText('Students enrolled')).toBeVisible()
    // External resources (fonts/CDNs) are unreachable in sandboxed E2E
    // environments — only application errors are the gate here.
    await expectNoConsoleErrors(errors.filter((e) => !e.includes('Failed to load resource')))
  })
})

test.describe('Role-flavored home — Student', () => {
  test.use({ role: 'Student' })

  test('Student lands on the student portal home', async ({ page }) => {
    await page.goto('/home')
    const nav = page.getByRole('navigation', { name: 'Sidebar navigation' })
    await expect(nav.getByRole('link', { name: 'My Grades' })).toBeVisible()
  })
})

test.describe('Role-flavored home — Parent', () => {
  test.use({ role: 'Parent' })

  test('Parent lands on the family portal home', async ({ page }) => {
    await page.goto('/home')
    const nav = page.getByRole('navigation', { name: 'Sidebar navigation' })
    await expect(nav.getByRole('link', { name: 'Fee Payments' })).toBeVisible()
  })
})
