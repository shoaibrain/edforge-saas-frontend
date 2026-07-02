/**
 * Bulk activate / deactivate sections — E2E (#224 / #237).
 *
 * Academics is a federated remote — run against served remotes:
 *   PLAYWRIGHT_START_SERVER=1 pnpm test:e2e:full e2e/tests/sections-bulk-status.spec.ts
 * (or the consolidated build-deploy output in CI).
 *
 * Drives the real BulkSectionStatusModal: it splits selected rows into eligible
 * (isActive !== target) vs already-in-target (skipped), fires one
 * PATCH /academics/sections/:id?schoolId= {isActive} per eligible section, and
 * toasts an aggregate. Note (verified against the component): the "… · N skipped"
 * case is an ERROR-tone toast; only a fully-clean run is success-tone.
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

  test('select all 4 → activate 3, skip 1, PATCH the 3 inactive', async ({ page }) => {
    const captured = await captureBulkWrites(page)
    await openListView(page)
    await expect(page.getByText('Grade 10 Science')).toBeVisible()

    await page.getByRole('checkbox', { name: 'Select all rows' }).check()
    await expect(page.getByText('4 selected')).toBeVisible()
    await page.getByRole('button', { name: 'Activate' }).click()

    // Modal counts eligible, not selected, and surfaces the skipped active one.
    await expect(page.getByRole('heading', { name: 'Activate 3 sections?' })).toBeVisible()
    await expect(page.getByText(/1 already active/)).toBeVisible()
    await page.getByRole('button', { name: 'Activate 3' }).click()

    await expect(page.getByText(/Activated 3 sections.*1 skipped/)).toBeVisible()
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
    await expect(page.getByText('2 selected')).toBeVisible()
    await page.getByRole('button', { name: 'Deactivate' }).click()

    await expect(page.getByRole('heading', { name: 'Deactivate 2 sections?' })).toBeVisible()
    await expect(page.getByText(/12 students currently enrolled across these sections/)).toBeVisible()
    await page.getByRole('button', { name: 'Deactivate 2' }).click()

    await expect(page.getByText('Deactivated 2 sections')).toBeVisible()
    expect(captured.sectionPatches.map((p) => p.id).sort()).toEqual(['sec-e', 'sec-f'])
    expect(captured.sectionPatches.every((p) => p.isActive === false)).toBe(true)
  })
})
