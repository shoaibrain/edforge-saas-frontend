/**
 * Attendance realignment — E2E (Stories 1–5), deterministic via mocked API.
 *
 * Opt-in (matches the repo's e2e convention — see design-system-visual-regression):
 *   ATTENDANCE_E2E=1 PLAYWRIGHT_START_SERVER=1 \
 *     pnpm playwright test e2e/tests/attendance.spec.ts
 *
 * ⚠️ Run in CI or a resourced environment. PLAYWRIGHT_START_SERVER=1 boots the full
 * `pnpm dev:mvp` Module-Federation server (shell + 3 MFEs) — that is memory-heavy and
 * has OOM-crashed dev laptops. Against a Vercel Preview, point at it instead and skip
 * the local server: `PLAYWRIGHT_BASE_URL=<preview-url> ATTENDANCE_E2E=1 pnpm playwright test`.
 *
 * All backend calls are mocked with page.route (e2e/fixtures/attendance.ts), so
 * these run against the frontend dev server only — no live tenant/JWT needed.
 * Covers: Story 1 absentee-first recording + count toast, Story 2 cross-section
 * lock, Story 3 per-section (no locks), Story 4 admin mode config, Story 5 IEMiS
 * export, and the calendar guard (no default-present on a non-instructional day).
 */

import { test, expect } from '@playwright/test'
import {
  ATTENDANCE_E2E_ENABLED,
  SCHOOL_ID,
  seedAttendanceSession,
  mockAttendanceApi,
} from '../fixtures/attendance'

const ATTENDANCE_URL = '/classrooms?tab=attendance'
const SETTINGS_URL = `/settings/organization/schools/${SCHOOL_ID}?tab=attendance`

test.describe('Attendance realignment E2E', () => {
  test.skip(!ATTENDANCE_E2E_ENABLED, 'Set ATTENDANCE_E2E=1 (+ a dev server) to run.')

  test.beforeEach(async ({ page }) => {
    await seedAttendanceSession(page)
  })

  // ── Story 1 — teacher records daily attendance (absentee-first) ───────────
  test('Story 1: roster defaults to Present, marking an absentee saves a correct breakdown', async ({ page }) => {
    const captured = await mockAttendanceApi(page, { mode: 'daily_presence', instructional: true })
    await page.goto(ATTENDANCE_URL)
    await page.getByRole('button', { name: 'Daily Entry' }).click()

    // Absentee-first: the section auto-selects and every student starts Present.
    await expect(page.getByText('3 / 3 marked')).toBeVisible()
    // The missing-data affordance explains the default on a not-yet-recorded day.
    await expect(page.getByText(/Attendance has not been recorded for this day yet/i)).toBeVisible()

    // Mark the first student Absent, then save.
    await page.getByLabel('Mark Absent').first().click()
    await page.getByRole('button', { name: 'Save Attendance' }).click()

    // Toast carries the present/absent/excused breakdown (F2.T2).
    await expect(page.getByText(/recorded for 3 students \(2 present, 1 absent, 0 excused\)/i)).toBeVisible()
    expect(captured.bulkSaves.length).toBeGreaterThan(0)
    const records = captured.bulkSaves[0].records
    expect(records).toHaveLength(3)
    expect(records.filter((r: any) => r.status === 'absent')).toHaveLength(1)
    expect(records.filter((r: any) => r.status === 'present')).toHaveLength(2)
  })

  // ── Story 2 — second teacher sees a cross-section lock ────────────────────
  test('Story 2: a locked student shows the "recorded in" hint and only Tardy/Excused', async ({ page }) => {
    await mockAttendanceApi(page, { mode: 'daily_presence', instructional: true, lockedStudentIds: ['stu-bhavna'] })
    await page.goto(ATTENDANCE_URL)
    await page.getByRole('button', { name: 'Daily Entry' }).click()

    // Lock ownership copy (not "locked by"), plus the allowed overrides.
    await expect(page.getByText(/Already present in Middle School Social Studies/i)).toBeVisible()
    // The locked row's row scope offers Tardy + Excused but not a presence flip.
    const lockedRow = page.getByRole('row', { name: /Bhavna Poudel/i })
    await expect(lockedRow.getByRole('button', { name: 'Mark Tardy' })).toBeVisible()
    await expect(lockedRow.getByRole('button', { name: 'Mark Excused' })).toBeVisible()
    await expect(lockedRow.getByRole('button', { name: 'Mark Present' })).toHaveCount(0)
  })

  // ── Story 3 — per-section mode has no locks, identical grid ───────────────
  test('Story 3: per_section_granular shows the per-section banner and no locks', async ({ page }) => {
    await mockAttendanceApi(page, { mode: 'per_section_granular', instructional: true, lockedStudentIds: ['stu-bhavna'] })
    await page.goto(ATTENDANCE_URL)
    await page.getByRole('button', { name: 'Daily Entry' }).click()

    await expect(page.getByText(/each section is recorded independently/i)).toBeVisible()
    // Even though a lock exists server-side, per_section_granular never fetches/shows it.
    await expect(page.getByText(/Already present in/i)).toHaveCount(0)
    await expect(page.getByText('3 / 3 marked')).toBeVisible()
  })

  // ── Calendar guard — non-instructional day must not pre-fill Present ───────
  test('Non-instructional day: shows the holiday banner and does NOT default everyone Present', async ({ page }) => {
    await mockAttendanceApi(page, { mode: 'daily_presence', instructional: false, holidayName: 'Dashain Holiday' })
    await page.goto(ATTENDANCE_URL)
    await page.getByRole('button', { name: 'Daily Entry' }).click()

    await expect(page.getByText('Non-Instructional Day')).toBeVisible()
    await expect(page.getByText(/Dashain Holiday/i)).toBeVisible()
    // No absentee-first pre-fill on a holiday.
    await expect(page.getByText('0 / 3 marked')).toBeVisible()
    await expect(page.getByText('3 / 3 marked')).toHaveCount(0)
  })

  // ── Story 4 — admin configures the attendance mode ────────────────────────
  test('Story 4: admin switches the attendance mode and the PATCH carries the new value', async ({ page }) => {
    const captured = await mockAttendanceApi(page, { mode: 'daily_presence', instructional: true })
    await page.goto(SETTINGS_URL)

    await expect(page.getByText('Daily Presence')).toBeVisible()
    await expect(page.getByText('Per-Section Granular')).toBeVisible()

    await page.getByText('Per-Section Granular').click()
    await page.getByRole('button', { name: /Save/i }).click()

    await expect(page.getByText(/Attendance mode updated/i)).toBeVisible()
    expect(captured.configPatches.length).toBeGreaterThan(0)
    expect(captured.configPatches[0]).toMatchObject({ attendancePolicy: 'per_section_granular' })
  })

  test('Story 4: per_section_granular shows the read-only archetype threshold', async ({ page }) => {
    await mockAttendanceApi(page, { mode: 'per_section_granular', instructional: true, threshold: 50 })
    await page.goto(SETTINGS_URL)
    await expect(page.getByText(/Presence threshold/i)).toBeVisible()
    await expect(page.getByText(/50%/)).toBeVisible()
  })

  // ── Story 5 — IEMiS export ────────────────────────────────────────────────
  test('Story 5: IEMiS export generates a preview of monthly rows', async ({ page }) => {
    await mockAttendanceApi(page, { mode: 'daily_presence', instructional: true })
    await page.goto(ATTENDANCE_URL)
    await page.getByRole('button', { name: /IEMiS Export/i }).click()

    await expect(page.getByText('IEMiS Monthly Export')).toBeVisible()
    await page.getByRole('button', { name: /Generate Export/i }).click()
    // Preview table renders the mocked rows.
    await expect(page.getByText('Aarav Sharma')).toBeVisible()
    await expect(page.getByRole('button', { name: /Download CSV/i })).toBeVisible()
  })
})
