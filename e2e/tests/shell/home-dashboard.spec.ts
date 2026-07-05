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

  test('Arabic keeps the fixed shell chrome and profile menu within the viewport @smoke', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('edforge-language', 'ar')
    })

    await page.goto('/home')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByTestId('app-scroll-frame')).toHaveAttribute('dir', 'ltr')
    await expect(page.getByTestId('app-content')).toHaveAttribute('dir', 'rtl')

    await page.getByRole('button', { name: /My Profile|ملفي الشخصي/ }).click()
    const panel = page.getByTestId('user-menu-panel')
    await expect(panel).toBeVisible()

    const box = await panel.boundingBox()
    const viewport = page.viewportSize()
    expect(box, 'profile menu should have a measurable bounding box').not.toBeNull()
    expect(viewport, 'profile menu check requires a viewport').not.toBeNull()

    expect(box!.x, 'profile menu should not overflow the left viewport edge').toBeGreaterThanOrEqual(0)
    expect(
      box!.x + box!.width,
      'profile menu should not overflow the right viewport edge',
    ).toBeLessThanOrEqual(viewport!.width)
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
