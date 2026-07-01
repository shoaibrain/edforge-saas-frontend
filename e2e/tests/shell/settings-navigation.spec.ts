// spec: specs/shell/settings.md
// seed: e2e/tests/seed.spec.ts

import { test, expect } from '../../fixtures/test'
import { collectConsoleErrors, expectNoConsoleErrors } from '../../fixtures/roles'

const SETTINGS_ROUTES = [
  '/settings',
  '/settings/account',
  '/settings/preferences',
  '/settings/security',
  '/settings/workspace',
  '/settings/organization',
  '/settings/security-policies',
  '/settings/branding',
]

test.describe('Settings navigation', () => {
  test('Settings overview renders with the settings sidebar @smoke', async ({ page }) => {
    await page.goto('/settings')
    const nav = page.getByRole('navigation', { name: 'Sidebar navigation' })
    for (const item of [
      'My Account',
      'Preferences',
      'Security',
      'Workspace Settings',
      'Organization',
      'RBAC Security',
    ]) {
      // exact: name matching is substring by default ('Security' would also
      // match 'RBAC Security' and trip strict mode)
      await expect(nav.getByRole('link', { name: item, exact: true })).toBeVisible()
    }
  })

  test('Each settings tab renders without console errors', async ({ page }) => {
    // 8 sequential navigations; each lazy route chunk compiles on first hit
    // when running against a cold dev server.
    test.setTimeout(120_000)
    const errors = await collectConsoleErrors(page)
    for (const route of SETTINGS_ROUTES) {
      // domcontentloaded: unreachable external resources (fonts/CDNs) in
      // sandboxed environments can stall the full load event indefinitely
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await expect(
        page.getByRole('navigation', { name: 'Sidebar navigation' }),
        `expected the authenticated shell on ${route}`,
      ).toBeVisible()
      expect(new URL(page.url()).pathname, `bounced off ${route}`).not.toBe('/login')
    }
    await expectNoConsoleErrors(errors.filter((e) => !e.includes('Failed to load resource')))
  })
})

test.describe('Settings gating — TenantAdmin', () => {
  test('Auth Debug is visible for TenantAdmin', async ({ page }) => {
    await page.goto('/settings')
    const nav = page.getByRole('navigation', { name: 'Sidebar navigation' })
    await expect(nav.getByRole('link', { name: 'Auth Debug' })).toBeVisible()
  })
})

test.describe('Settings gating — Teacher', () => {
  test.use({ role: 'Teacher' })

  test('Auth Debug is hidden for Teacher', async ({ page }) => {
    await page.goto('/settings')
    const nav = page.getByRole('navigation', { name: 'Sidebar navigation' })
    await expect(nav.getByRole('link', { name: 'My Account' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Auth Debug' })).toHaveCount(0)
  })
})
