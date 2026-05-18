/**
 * Calendar Blocks E2E — Sprint C4-FE
 *
 * End-to-end test for the multi-day Calendar Block CRUD UI shipped in
 * PR B (Sprint C4-FE). Covers the operator's actual setup path:
 *
 *   1. Happy path — create a 9-day Dashain block, verify it appears in
 *      the list AND that the 9 underlying calendar grid cells show the
 *      block context (denormalized blockName via PR A).
 *   2. Happy path — edit the block's name, confirm the change persists
 *      to the API and re-renders.
 *   3. Happy path — delete the block, confirm cascade removes both the
 *      block from the list and the block-context tooltip from the grid.
 *   4. Curated dropdown — pick "Staff Professional Development" on a
 *      Wednesday; verify the API stores eventType=teacher_only.
 *   5. Curated dropdown — pick "Early Release — Students Only";
 *      verify eventType=early_release + audience=students.
 *   6. Validation — endDate < startDate; submit must be disabled +
 *      inline error rendered.
 *
 * # Prerequisites
 *
 * - Frontend shell running at http://localhost:3000 (or
 *   `BASE_URL` env var pointing at the deployed Vercel preview).
 * - Test tenant `dev-pabson-primary` (tenant ID
 *   `21aea5da-511f-4dfa-a6f2-6971f63a719f`) already provisioned in
 *   prod with calendar generated. School `4209e3d8-...` exists with
 *   active AY `0167de00-...` (the same fixture the backend Sprint C4
 *   smokes used).
 * - A valid prod JWT cached at the `EDFORGE_PROD_JWT` env var. Cognito
 *   tokens expire ~hourly; refresh via the AdminWeb auth flow.
 * - PR A merged + identity rolled to `4145acb` or later so the
 *   response carries `blockId`/`blockName`/`blockDescriptor`.
 *
 * # Running locally
 *
 * ```
 * EDFORGE_PROD_JWT=$(cat /private/tmp/c0-c-3-prod-jwt.txt) \
 *   pnpm playwright test e2e/tests/calendar-blocks.spec.ts
 * ```
 *
 * Tag-marker `@calendar-blocks` lets CI run only this spec in PR
 * mode: `pnpm playwright test --grep @calendar-blocks`.
 */

import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const API_BASE = 'https://w5ulch7iyf.execute-api.ap-south-1.amazonaws.com/prod'
const JWT = process.env.EDFORGE_PROD_JWT ?? ''

const TEST_TENANT_ID = '21aea5da-511f-4dfa-a6f2-6971f63a719f'
const TEST_SCHOOL_ID = '4209e3d8-d2e2-4e0e-9961-790341c264f4'
const TEST_AY_ID = '0167de00-cc49-476b-9654-ef98a8cf9014'

// Use a unique block name per test run so re-runs don't collide. The
// timestamp makes lookup deterministic for the assert + cleanup.
const RUN_TAG = `e2e-${Date.now()}`
const BLOCK_NAME_PREFIX = `E2E Calendar Block ${RUN_TAG}`

// Dashain-style range — 9 days inside the AY. Picks a window past
// what the seed pre-populates, so we don't collide with seeded blocks.
const TEST_START_DATE = '2026-11-10'
const TEST_END_DATE = '2026-11-18'

// ============================================================================
// API helpers — bootstrap + cleanup
// ============================================================================

async function apiGet(request: APIRequestContext, path: string) {
  if (!JWT) throw new Error('EDFORGE_PROD_JWT env var not set')
  return request.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${JWT}` },
  })
}

async function apiPost(request: APIRequestContext, path: string, body: unknown) {
  if (!JWT) throw new Error('EDFORGE_PROD_JWT env var not set')
  return request.post(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${JWT}` },
    data: body,
  })
}

async function apiDelete(request: APIRequestContext, path: string) {
  if (!JWT) throw new Error('EDFORGE_PROD_JWT env var not set')
  return request.delete(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${JWT}` },
  })
}

/**
 * After-each cleanup: delete any block we created during the test.
 * Matches by blockName starting with our run tag.
 */
async function cleanupTestBlocks(request: APIRequestContext) {
  const resp = await apiGet(
    request,
    `/calendar-blocks?schoolId=${TEST_SCHOOL_ID}&academicYearId=${TEST_AY_ID}&limit=200`,
  )
  if (!resp.ok()) return
  const body = await resp.json()
  for (const b of body.items ?? []) {
    if (b.blockName?.startsWith(`E2E Calendar Block `)) {
      await apiDelete(request, `/calendar-blocks/${b.blockId}?schoolId=${TEST_SCHOOL_ID}`)
    }
  }
}

// ============================================================================
// UI helpers
// ============================================================================

/**
 * Navigate to the calendar step of the academic-setup wizard for the
 * test school. Assumes the user is already authenticated (a session
 * cookie or LocalStorage token established outside this spec).
 */
async function navigateToCalendarStep(page: Page) {
  await page.goto(
    `${BASE_URL}/settings/schools/${TEST_SCHOOL_ID}?tab=academic-setup`,
  )
  // Wait for the calendar grid to render (proxy for "page loaded").
  await page.waitForSelector('text=Multi-Day Events', { timeout: 15000 })
}

// ============================================================================
// Test suite
// ============================================================================

test.describe('@calendar-blocks Calendar Block CRUD', () => {
  test.beforeEach(async ({ request }) => {
    test.skip(!JWT, 'EDFORGE_PROD_JWT not set — skipping E2E')
    await cleanupTestBlocks(request)
  })

  test.afterAll(async ({ request }) => {
    if (JWT) await cleanupTestBlocks(request)
  })

  test('1. Happy path — create 9-day block + verify grid context', async ({ page, request }) => {
    await navigateToCalendarStep(page)

    await test.step('Open create drawer', async () => {
      await page.getByRole('button', { name: /\+ New Block/ }).click()
      await expect(page.getByText('New Calendar Block')).toBeVisible()
    })

    await test.step('Fill the form', async () => {
      await page.locator('input[placeholder*="Dashain"]').fill(BLOCK_NAME_PREFIX)
      await page.locator('select').first().selectOption('religious_festival')
      // Dates — use the native date input fallback if BS picker is unavailable.
      // The <DateInput> component renders <input type="date"> when
      // calendarSystem=gregorian; for BS, it renders a custom picker.
      // Both expose the same value via the underlying input.
      const startDateInput = page.locator('input[type="date"]').first()
      const endDateInput = page.locator('input[type="date"]').nth(1)
      await startDateInput.fill(TEST_START_DATE)
      await endDateInput.fill(TEST_END_DATE)
    })

    await test.step('Submit', async () => {
      await page.getByRole('button', { name: /Create Block/ }).click()
      // Toast on success
      await expect(page.getByText(/Created.*9 days/)).toBeVisible({ timeout: 10000 })
    })

    await test.step('Verify block appears in the list', async () => {
      await expect(page.getByText(BLOCK_NAME_PREFIX)).toBeVisible()
      await expect(page.getByText(/9 days/)).toBeVisible()
    })

    await test.step('Verify API: 9 child CalendarDate rows carry blockId', async () => {
      const resp = await apiGet(
        request,
        `/schools/${TEST_SCHOOL_ID}/calendar-dates?academicYearId=${TEST_AY_ID}&limit=500`,
      )
      expect(resp.ok()).toBe(true)
      const body = await resp.json()
      const childDates = (body.items ?? []).filter(
        (d: { date: string; blockName?: string }) =>
          d.date >= TEST_START_DATE && d.date <= TEST_END_DATE && d.blockName === BLOCK_NAME_PREFIX,
      )
      expect(childDates).toHaveLength(9)
      for (const d of childDates) {
        expect(d.blockId).toBeTruthy()
        expect(d.blockDescriptor).toBe('religious_festival')
      }
    })
  })

  test('2. Happy path — edit block name', async ({ page, request }) => {
    // Pre-create a block via API so we can focus on the edit flow.
    const created = await apiPost(request, '/calendar-blocks', {
      schoolId: TEST_SCHOOL_ID,
      academicYearId: TEST_AY_ID,
      blockName: BLOCK_NAME_PREFIX,
      blockDescriptor: 'religious_festival',
      startDate: TEST_START_DATE,
      endDate: TEST_END_DATE,
    })
    expect(created.ok()).toBe(true)
    const { blockId } = await created.json()

    await navigateToCalendarStep(page)

    await test.step('Click edit on the block row', async () => {
      // Find the row containing our run-tagged block name and click its
      // edit (pencil) button.
      const row = page.locator('li', { hasText: BLOCK_NAME_PREFIX })
      await row.getByRole('button', { name: /Edit/ }).click()
      await expect(page.getByText('Edit Calendar Block')).toBeVisible()
    })

    await test.step('Rename and save', async () => {
      const nameInput = page.locator('input[value="' + BLOCK_NAME_PREFIX + '"]')
      await nameInput.fill(`${BLOCK_NAME_PREFIX} (renamed)`)
      await page.getByRole('button', { name: /Save Changes/ }).click()
      await expect(page.getByText(/Updated/)).toBeVisible({ timeout: 10000 })
    })

    await test.step('Verify rename persisted via API', async () => {
      const resp = await apiGet(
        request,
        `/calendar-blocks/${blockId}?schoolId=${TEST_SCHOOL_ID}`,
      )
      const body = await resp.json()
      expect(body.blockName).toBe(`${BLOCK_NAME_PREFIX} (renamed)`)
    })
  })

  test('3. Happy path — delete block + cascade verification', async ({ page, request }) => {
    const created = await apiPost(request, '/calendar-blocks', {
      schoolId: TEST_SCHOOL_ID,
      academicYearId: TEST_AY_ID,
      blockName: BLOCK_NAME_PREFIX,
      blockDescriptor: 'school_vacation',
      startDate: TEST_START_DATE,
      endDate: TEST_END_DATE,
    })
    expect(created.ok()).toBe(true)

    await navigateToCalendarStep(page)

    await test.step('Open delete confirm', async () => {
      const row = page.locator('li', { hasText: BLOCK_NAME_PREFIX })
      await row.getByRole('button', { name: /Delete/ }).click()
      await expect(page.getByText(/Delete ".*"/)).toBeVisible()
    })

    await test.step('Confirm delete', async () => {
      await page.getByRole('button', { name: /^Delete Block$/ }).click()
      await expect(page.getByText(/Deleted.*calendar/)).toBeVisible({ timeout: 10000 })
    })

    await test.step('Verify block list no longer contains the row', async () => {
      await expect(page.getByText(BLOCK_NAME_PREFIX)).not.toBeVisible()
    })

    await test.step('Verify API: child dates have block fields cleared', async () => {
      const resp = await apiGet(
        request,
        `/schools/${TEST_SCHOOL_ID}/calendar-dates?academicYearId=${TEST_AY_ID}&limit=500`,
      )
      const body = await resp.json()
      const childDates = (body.items ?? []).filter(
        (d: { date: string; blockName?: string }) =>
          d.date >= TEST_START_DATE && d.date <= TEST_END_DATE && d.blockName === BLOCK_NAME_PREFIX,
      )
      // Cascade-delete should have removed the rows entirely (not just
      // unset their blockId). After delete, those dates show no block
      // association.
      expect(childDates).toHaveLength(0)
    })
  })

  test('4. Curated dropdown — Staff PD writes eventType=teacher_only', async ({ page, request }) => {
    await navigateToCalendarStep(page)

    // Pick a date in November that's a Wednesday (instructional day in
    // PABSON Sun-Fri schedule). Use the API to confirm what's stored.
    const testDate = '2026-11-04' // Wednesday

    await test.step('Click the date cell', async () => {
      // Click via title attribute first (the BS picker shows BS days);
      // fall back to direct date selector if title is empty.
      const cellButton = page.locator(`button[title]`).first() // fallback
      // For reliable navigation, jump to the November grid via the
      // month-nav buttons. (Simpler: rely on the date being visible.)
      // Click the day-cell whose date string matches.
      await page.evaluate((d: string) => {
        const btn = document.querySelector(`button[data-date="${d}"]`) as HTMLButtonElement | null
        btn?.click()
      }, testDate)
      // Or directly use a more specific selector — try matching by visible text
      const dateCell = page.locator('button', { hasText: '4' }).first()
      await dateCell.click({ trial: false }).catch(() => {/* may not match exact day */})
    })

    await test.step('Pick Staff PD from the curated dropdown', async () => {
      // The DateEditPanel renders a select for Event Type — choose
      // 'staff_pd' (curated key). Title might be obscured if multiple
      // selects on the page; scope to the panel containing "Edit".
      const dropdown = page.locator('select').filter({ hasText: /Holiday|Staff Professional/ }).first()
      await dropdown.selectOption('staff_pd')
    })

    await test.step('Save and verify API', async () => {
      await page.getByRole('button', { name: /Save Changes/ }).click()
      await expect(page.getByText(/Updated/)).toBeVisible({ timeout: 10000 })

      // Verify via API
      const resp = await apiGet(
        request,
        `/schools/${TEST_SCHOOL_ID}/calendar-dates?academicYearId=${TEST_AY_ID}&limit=500`,
      )
      const body = await resp.json()
      const updated = (body.items ?? []).find(
        (d: { date: string }) => d.date === testDate,
      )
      expect(updated?.calendarEvents?.[0]?.eventType).toBe('teacher_only')
    })
  })

  test('5. Curated dropdown — Early Release Students writes audience=students', async ({ page, request }) => {
    await navigateToCalendarStep(page)
    const testDate = '2026-11-05' // Thursday

    await test.step('Open the date cell + pick Early Release — Students Only', async () => {
      const dateCell = page.locator('button', { hasText: '5' }).first()
      await dateCell.click({ trial: false }).catch(() => {})

      const dropdown = page.locator('select').filter({ hasText: /Holiday|Staff Professional/ }).first()
      await dropdown.selectOption('early_release_students')

      await page.getByRole('button', { name: /Save Changes/ }).click()
      await expect(page.getByText(/Updated/)).toBeVisible({ timeout: 10000 })
    })

    await test.step('Verify API: eventType=early_release + audience=students', async () => {
      const resp = await apiGet(
        request,
        `/schools/${TEST_SCHOOL_ID}/calendar-dates?academicYearId=${TEST_AY_ID}&limit=500`,
      )
      const body = await resp.json()
      const updated = (body.items ?? []).find((d: { date: string }) => d.date === testDate)
      expect(updated?.calendarEvents?.[0]?.eventType).toBe('early_release')
      expect(updated?.calendarEvents?.[0]?.audience).toBe('students')
    })
  })

  test('6. Validation — endDate before startDate disables submit', async ({ page }) => {
    await navigateToCalendarStep(page)

    await test.step('Open create drawer', async () => {
      await page.getByRole('button', { name: /\+ New Block/ }).click()
      await expect(page.getByText('New Calendar Block')).toBeVisible()
    })

    await test.step('Fill with reversed dates', async () => {
      await page.locator('input[placeholder*="Dashain"]').fill(`${BLOCK_NAME_PREFIX} (validation test)`)
      const startDateInput = page.locator('input[type="date"]').first()
      const endDateInput = page.locator('input[type="date"]').nth(1)
      await startDateInput.fill('2026-11-18')
      await endDateInput.fill('2026-11-10')
    })

    await test.step('Submit button is disabled + inline error visible', async () => {
      const submit = page.getByRole('button', { name: /Create Block/ })
      await expect(submit).toBeDisabled()
      await expect(page.getByText(/End date must be on or after start date/)).toBeVisible()
    })
  })
})
