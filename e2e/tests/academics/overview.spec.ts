// spec: specs/academics/overview.md
// seed: e2e/tests/seed.spec.ts
//
// Academics is a federated remote (loaded by the shell at /academics/$*).
// Run against served remotes: PLAYWRIGHT_START_SERVER=1 (dev:mvp) locally, or
// the consolidated build-deploy output in CI — a shell-only preview cannot load
// the remote. See docs/testing/rollout-playbook.md.

import { test, expect } from '../../fixtures/test'
import { collectConsoleErrors, expectNoConsoleErrors } from '../../fixtures/roles'
import { mockAcademicsApi } from '../../fixtures/academics'

test.describe('Academics overview', () => {
  test.beforeEach(async ({ page }) => {
    await mockAcademicsApi(page)
  })

  test('loads the remote without console errors @smoke', async ({ page }) => {
    const errors = await collectConsoleErrors(page)
    await page.goto('/academics')
    // Remote mounted inside the authenticated shell (not the "Loading…"
    // Suspense fallback, not RemoteModuleError).
    const nav = page.getByRole('navigation', { name: 'Sidebar navigation' })
    await expect(nav).toBeVisible()
    await expect(page.getByText(/could not be loaded|module error|try again/i)).toHaveCount(0)
    // On /academics the shell sidebar switches to the academics module sub-nav
    // (Overview / Students / Classrooms / Curriculum / Exams) — its presence
    // confirms the remote mounted and the shell recognized the route context.
    await expect(nav.getByRole('link', { name: 'Students' })).toBeVisible()
    await expectNoConsoleErrors(errors.filter((e) => !e.includes('Failed to load resource')))
  })
})
