/**
 * Bulk activate / deactivate sections — E2E (#224 / #237).
 *
 * Academics is a federated remote — run against served remotes:
 *   PLAYWRIGHT_START_SERVER=1 pnpm test:e2e:full e2e/tests/sections-bulk-status.spec.ts
 * (or the consolidated build-deploy output in CI).
 *
 * Drives the real BulkSectionStatusModal. Since the #303 SelectionContextBar
 * migration, the TOOLBAR pre-filters to eligible rows (the action button
 * carries the subset count, e.g. "Activate 3" with 4 selected) — the modal
 * receives only eligible sections, fires one
 * PATCH /academics/sections/:id?schoolId= {isActive} per section, and toasts
 * a clean success ("Activated 3 sections"); the skipped row never reaches it.
 */

import { test, expect } from '../fixtures/test'
import { mockAcademicsApi, captureBulkWrites, section } from '../fixtures/academics'

async function openListView(page: import('@playwright/test').Page) {
  await page.goto('/academics/classrooms')
  // OverviewTab defaults to grid; only list view renders the selectable SectionTable.
  await page.getByRole('button', { name: 'List view' }).click()
}

test.describe('Bulk section activate', () => {
  // 3 inactive + 1 active → activating all four leaves 3 eligible, 1 skipped.
  const SECTIONS = [
    section({ sectionId: 'sec-a', sectionName: 'Grade 10 Science', isActive: false }),
    section({ sectionId: 'sec-b', sectionName: 'Grade 9 English', isActive: false }),
    section({ sectionId: 'sec-c', sectionName: 'Grade 8 Nepali', isActive: false }),
    section({ sectionId: 'sec-d', sectionName: 'Grade 9 Math', isActive: true }),
  ]

  test.beforeEach(async ({ page }) => {
    await mockAcademicsApi(page, { sections: SECTIONS })
  })

  test('select all 4 → activate 3, skip 1, PATCH the 3 inactive @smoke', async ({ page }) => {
    const captured = await captureBulkWrites(page)
    await openListView(page)
    await expect(page.getByText('Grade 10 Science')).toBeVisible()

    await page.getByRole('checkbox', { name: 'Select all rows' }).check()
    // SelectionContextBar renders the count twice (visible + sr-only
    // aria-live) — .first() picks the visible one.
    await expect(page.getByText('4 selected').first()).toBeVisible()
    // SelectionContextBar names the action button with its eligible-subset
    // count ("Activate 3", not "Activate") — scope to the toolbar so the
    // modal's identically-named confirm can't collide.
    await page
      .getByRole('toolbar', { name: 'Selection actions' })
      .getByRole('button', { name: 'Activate 3' })
      .click()

    // Modal counts eligible, not selected: it lists only the 3 inactive
    // sections (the already-active one is excluded; the "1 skipped" summary
    // now lives in the aggregate toast asserted below).
    await expect(page.getByRole('heading', { name: 'Activate 3 sections?' })).toBeVisible()
    await expect(page.getByRole('dialog').getByRole('listitem')).toHaveCount(3)
    await page.getByRole('dialog').getByRole('button', { name: 'Activate 3' }).click()

    // Toolbar pre-filtered to the 3 eligible rows, so the modal's run is
    // clean → success toast without a skipped clause. Sonner emits a visible
    // toast + an aria-live sr-only copy — .first() picks the visible one.
    await expect(page.getByText('Activated 3 sections').first()).toBeVisible()
    // Exactly the 3 inactive sections were PATCHed to isActive:true (not sec-d).
    expect(captured.sectionPatches.map((p) => p.id).sort()).toEqual(['sec-a', 'sec-b', 'sec-c'])
    expect(captured.sectionPatches.every((p) => p.isActive === true)).toBe(true)
  })
})

test.describe('Bulk section deactivate', () => {
  // 2 active sections, 12 enrolled across them → the enrollment warning shows.
  const SECTIONS = [
    section({ sectionId: 'sec-e', sectionName: 'Grade 9 Math', isActive: true, currentEnrollment: 12 }),
    section({ sectionId: 'sec-f', sectionName: 'Grade 10 Science', isActive: true, currentEnrollment: 0 }),
  ]

  test.beforeEach(async ({ page }) => {
    await mockAcademicsApi(page, { sections: SECTIONS })
  })

  test('deactivate shows the non-zero-enrollment warning + PATCHes both', async ({ page }) => {
    const captured = await captureBulkWrites(page)
    await openListView(page)
    await expect(page.getByText('Grade 9 Math')).toBeVisible()

    await page.getByRole('checkbox', { name: 'Select all rows' }).check()
    // Visible + sr-only copies of the count — see above.
    await expect(page.getByText('2 selected').first()).toBeVisible()
    await page
      .getByRole('toolbar', { name: 'Selection actions' })
      .getByRole('button', { name: 'Deactivate 2' })
      .click()

    await expect(page.getByRole('heading', { name: 'Deactivate 2 sections?' })).toBeVisible()
    await expect(page.getByText(/12 students currently enrolled across these sections/)).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Deactivate 2' }).click()

    // Toast renders twice (visible + aria-live) → scope with .first().
    await expect(page.getByText('Deactivated 2 sections').first()).toBeVisible()
    expect(captured.sectionPatches.map((p) => p.id).sort()).toEqual(['sec-e', 'sec-f'])
    expect(captured.sectionPatches.every((p) => p.isActive === false)).toBe(true)
  })
})
