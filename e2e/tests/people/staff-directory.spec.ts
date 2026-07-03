// spec: specs/people/staff-directory.md
// seed: e2e/tests/seed.spec.ts
// Remote route — requires served remotes (see overview.spec.ts header).

import { test, expect } from '../../fixtures/test'
import { collectConsoleErrors, expectNoConsoleErrors } from '../../fixtures/roles'
import { mockPeopleApi } from '../../fixtures/people'

test.describe('People staff directory', () => {
  test.beforeEach(async ({ page }) => {
    await mockPeopleApi(page)
  })

  test('directory table renders the seeded roster + columns @smoke', async ({ page }) => {
    const errors = await collectConsoleErrors(page)
    await page.goto('/people/staff')

    await expect(page.getByRole('navigation', { name: 'Sidebar navigation' })).toBeVisible()
    await expect(page.getByText(/could not be loaded|module error|try again/i)).toHaveCount(0)
    // The directory page heading (h1.sr-only, still in the a11y tree).
    await expect(page.getByRole('heading', { name: 'Staff Directory' })).toBeVisible()
    // TanStack table column headers confirm the table (not a spinner) rendered.
    await expect(page.getByRole('columnheader', { name: 'Department' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'System Access' })).toBeVisible()
    // Seeded staff row.
    await expect(page.getByText('Anita Gurung').first()).toBeVisible()

    await expectNoConsoleErrors(errors.filter((e) => !e.includes('Failed to load resource')))
  })

  test('unified toolbar: search + role presets + Role facet + Export CSV', async ({ page }) => {
    await page.goto('/people/staff')
    // Unified ToolbarSearch — accessible name comes from its placeholder.
    await expect(page.getByPlaceholder('Search by name or email...')).toBeVisible()
    // Quick filters are docked toolbar preset tabs now.
    await expect(page.getByRole('tab', { name: 'Teachers' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Principal' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible()
  })

  test('selecting rows morphs the toolbar into the selection bar', async ({ page }) => {
    await page.goto('/people/staff')
    await expect(page.getByText('Anita Gurung').first()).toBeVisible()

    await page.getByRole('checkbox', { name: 'Select all rows' }).check()
    const bar = page.getByRole('toolbar', { name: 'Selection actions' })
    await expect(bar).toBeVisible()
    await expect(bar.getByText('3 selected')).toBeVisible()
    await expect(bar.getByRole('button', { name: 'Export selected' })).toBeVisible()
    await expect(bar.getByRole('button', { name: 'Delete selected' })).toBeVisible()
    // Search is replaced in place (same footprint, no stacking).
    await expect(page.getByPlaceholder('Search by name or email...')).toHaveCount(0)
  })
})

test.describe('People staff directory — empty state', () => {
  test.beforeEach(async ({ page }) => {
    await mockPeopleApi(page, { empty: true })
  })

  test('shows the empty state with no roster', async ({ page }) => {
    await page.goto('/people/staff')
    await expect(page.getByRole('navigation', { name: 'Sidebar navigation' })).toBeVisible()
    await expect(page.getByText(/could not be loaded|module error/i)).toHaveCount(0)
    await expect(page.getByText('No staff members found')).toBeVisible()
    await expect(page.getByText('Anita Gurung')).toHaveCount(0)
  })
})
