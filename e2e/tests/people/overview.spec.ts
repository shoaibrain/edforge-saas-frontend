// spec: specs/people/overview.md
// seed: e2e/tests/seed.spec.ts
//
// People is a federated remote (loaded by the shell at /people/$*). Run against
// served remotes: PLAYWRIGHT_START_SERVER=1 (dev:mvp) locally, or the
// consolidated build-deploy output in CI — a shell-only preview cannot load the
// remote. See docs/testing/rollout-playbook.md.

import { test, expect } from '../../fixtures/test'
import { collectConsoleErrors, expectNoConsoleErrors } from '../../fixtures/roles'
import { mockPeopleApi } from '../../fixtures/people'

test.describe('People overview', () => {
  test.beforeEach(async ({ page }) => {
    await mockPeopleApi(page)
  })

  test('loads the remote and renders the roster @smoke', async ({ page }) => {
    const errors = await collectConsoleErrors(page)
    await page.goto('/people')

    // Remote mounted inside the authenticated shell (not the "Loading…"
    // Suspense fallback, not RemoteModuleError).
    const nav = page.getByRole('navigation', { name: 'Sidebar navigation' })
    await expect(nav).toBeVisible()
    await expect(page.getByText(/could not be loaded|module error|try again/i)).toHaveCount(0)
    // On /people the shell sidebar switches to the People sub-nav — its
    // presence confirms the remote mounted and the shell recognized the route.
    await expect(nav.getByRole('link', { name: 'Staff Directory' })).toBeVisible()
    // Seeded staff surfaces in the roster (firstName + lastSurname).
    await expect(page.getByText('Anita Gurung').first()).toBeVisible()

    await expectNoConsoleErrors(errors.filter((e) => !e.includes('Failed to load resource')))
  })
})

test.describe('People overview — empty roster', () => {
  test.beforeEach(async ({ page }) => {
    await mockPeopleApi(page, { empty: true })
  })

  test('renders cleanly with no staff', async ({ page }) => {
    await page.goto('/people')
    await expect(page.getByRole('navigation', { name: 'Sidebar navigation' })).toBeVisible()
    await expect(page.getByText(/could not be loaded|module error/i)).toHaveCount(0)
    await expect(page.getByText('Anita Gurung')).toHaveCount(0)
  })
})
