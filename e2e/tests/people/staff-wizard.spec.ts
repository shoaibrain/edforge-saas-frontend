// spec: specs/people/staff-wizard.md
// seed: e2e/tests/seed.spec.ts
// Remote route — requires served remotes (see overview.spec.ts header).
//
// Scope: the wizard MOUNTS and renders step 1. The full 5-step create drive
// (asserting the POST /staff | /staff/with-user body via captureStaffWrites) is
// a documented follow-up — each step gates "Continue" on step-specific required
// fields, so a reliable drive needs per-step field mapping.

import { test, expect } from '../../fixtures/test'
import { collectConsoleErrors, expectNoConsoleErrors } from '../../fixtures/roles'
import { mockPeopleApi } from '../../fixtures/people'

test.describe('People staff creation wizard', () => {
  test.beforeEach(async ({ page }) => {
    await mockPeopleApi(page)
  })

  test('wizard mounts on step 1 @smoke', async ({ page }) => {
    const errors = await collectConsoleErrors(page)
    await page.goto('/people/staff/new')

    await expect(page.getByRole('navigation', { name: 'Sidebar navigation' })).toBeVisible()
    await expect(page.getByText(/could not be loaded|module error/i)).toHaveCount(0)
    // Page header + first step render.
    await expect(page.getByRole('heading', { name: 'Add Staff Member' })).toBeVisible()
    await expect(page.getByText('Personal Info').first()).toBeVisible()
    // The @edforge/wizard progress stepper (a nav, not an ARIA tablist).
    await expect(page.getByRole('navigation', { name: 'Wizard progress' })).toBeVisible()
    // Step-1 required field + the primary advance action ("Continue", not "Next").
    await expect(page.getByText('First Name').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()

    await expectNoConsoleErrors(errors.filter((e) => !e.includes('Failed to load resource')))
  })
})
