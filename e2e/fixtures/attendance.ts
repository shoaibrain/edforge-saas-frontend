/**
 * Attendance E2E fixture — deterministic API mocking + PABSON auth seeding.
 *
 * The attendance flows can't be exercised against the shared dev tenant (it's a
 * live PABSON tenant with little/variable data), so these specs mock every API
 * the attendance + settings surfaces call via `page.route`, and seed an authed
 * PABSON TenantAdmin session via cookies (same mechanism as pabson-tenant.ts).
 *
 * Gated behind ATTENDANCE_E2E=1 + the dev server, matching the repo's opt-in
 * e2e convention (see design-system-visual-regression.spec.ts):
 *
 *   ATTENDANCE_E2E=1 PLAYWRIGHT_START_SERVER=1 \
 *     pnpm playwright test e2e/tests/attendance.spec.ts
 */

import type { Page } from '@playwright/test'

export const ATTENDANCE_E2E_ENABLED = process.env.ATTENDANCE_E2E === '1'

export const SCHOOL_ID = 'school-pabson-visual'
export const AY_ID = 'ay-2082-2083'
export const SECTION_ID = 'sec-grade9-math'

export type PolicyMode = 'daily_presence' | 'per_section_granular'

const USER = {
  id: 'e2e-pabson-admin',
  email: 'e2e-admin@pabson.edforge.local',
  displayName: 'PABSON E2E Admin',
  firstName: 'PABSON',
  lastName: 'Admin',
  tenantId: 'tenant-pabson-e2e',
  globalRole: 'TenantAdmin',
  assignments: { [SCHOOL_ID]: 'Principal' },
}

// Scope the seeded auth cookies to whatever origin the run targets (localhost
// dev server OR a Vercel Preview) — pinning to `domain: localhost` would silently
// no-op against a Preview host and every route would bounce to login.
const TARGET_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export async function seedAttendanceSession(page: Page): Promise<void> {
  const expires = Math.floor(Date.now() / 1000) + 60 * 60
  await page.context().addCookies([
    {
      name: 'edforge-auth',
      value: encodeURIComponent(
        JSON.stringify({
          state: { user: USER, isAuthenticated: true, tenantName: 'PABSON E2E School', tenantTier: 'pilot' },
          version: 0,
        }),
      ),
      url: TARGET_URL,
      sameSite: 'Lax',
      expires,
    },
    {
      name: 'edforge-app',
      value: encodeURIComponent(
        JSON.stringify({
          state: { activeSchoolId: SCHOOL_ID, activeSchoolStatus: 'active', sidebarCollapsed: false, theme: 'light' },
          version: 0,
        }),
      ),
      url: TARGET_URL,
      sameSite: 'Lax',
      expires,
    },
  ])
}

interface MockOptions {
  mode?: PolicyMode
  /** false → weekend/holiday (no school day) */
  instructional?: boolean
  holidayName?: string
  /** studentIds locked by an earlier section (daily_presence) */
  lockedStudentIds?: string[]
  threshold?: number
}

const ROSTER = [
  { studentId: 'stu-aarav', studentName: 'Aarav Sharma', studentNumber: '001' },
  { studentId: 'stu-bhavna', studentName: 'Bhavna Poudel', studentNumber: '002' },
  { studentId: 'stu-chandra', studentName: 'Chandra Thapa', studentNumber: '003' },
]

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) }
}

/**
 * Captured PATCH/POST payloads so specs can assert the exact write the UI sent.
 */
export interface CapturedWrites {
  configPatches: any[]
  bulkSaves: any[]
}

/**
 * Install deterministic mocks for every API the attendance + settings surfaces
 * touch. Returns a capture object the spec can assert against. Glob patterns
 * match by path, so they're independent of the dev API base URL.
 */
export async function mockAttendanceApi(page: Page, opts: MockOptions = {}): Promise<CapturedWrites> {
  const mode: PolicyMode = opts.mode ?? 'daily_presence'
  const instructional = opts.instructional ?? true
  const threshold = opts.threshold ?? 50
  const captured: CapturedWrites = { configPatches: [], bulkSaves: [] }

  // Current academic year (gate for the whole AttendanceModule)
  await page.route('**/academic-years/current**', (route) =>
    route.fulfill(json({ yearId: AY_ID, name: '2082-2083', isCurrent: true, status: 'active', startDate: '2025-04-14', endDate: '2026-04-13' })),
  )

  // Attendance policy (resolved)
  await page.route('**/academics/attendance/policy**', (route) =>
    route.fulfill(json({
      schoolId: SCHOOL_ID,
      effectiveMode: mode,
      modeSource: 'archetype',
      countingPolicy: { granularPresenceThresholdPct: threshold, attendingCategories: ['present', 'late', 'tardy', 'remote'], partialDayWeights: { half_day: 0.5 }, excusedTreatment: 'absent_for_rate', chronicCountsExcused: true, chronicThresholdPct: 10, atRiskThresholdPct: 90 },
      countingSource: 'archetype',
      archetype: 'PABSON',
    })),
  )

  // Presence locks
  await page.route('**/academics/attendance/presence-locks**', (route) =>
    route.fulfill(json({
      schoolId: SCHOOL_ID,
      date: new Date().toISOString().split('T')[0],
      locks: (opts.lockedStudentIds ?? []).map((studentId) => ({
        studentId, lockedBySectionId: 'sec-other', lockedBySectionName: 'Middle School Social Studies', status: 'present',
      })),
    })),
  )

  // Calendar date (instructional vs holiday/weekend)
  await page.route('**/calendar-dates/**', (route) =>
    route.fulfill(json({
      calendarDateId: 'cal-1', schoolId: SCHOOL_ID, date: new Date().toISOString().split('T')[0],
      isInstructionalDay: instructional, isHoliday: !instructional, isWeekend: false, dayOfWeek: 'Sunday',
      calendarEvents: instructional ? [] : [{ description: opts.holidayName ?? 'Dashain Holiday', eventType: 'holiday', isAllDay: true }],
    })),
  )

  // Sections list
  await page.route('**/academics/sections?**', (route) =>
    route.fulfill(json({ sections: [{ sectionId: SECTION_ID, schoolId: SCHOOL_ID, sectionName: 'Grade 9 Math', subjectArea: 'mathematics', courseId: 'course-math', primaryTeacherId: 'teacher-1', isActive: true }], total: 1 })),
  )

  // Section roster
  await page.route(`**/academics/sections/${SECTION_ID}/students**`, (route) =>
    route.fulfill(json({ sectionId: SECTION_ID, students: ROSTER, total: ROSTER.length })),
  )

  // Section attendance — GET records (empty) + POST bulk (capture)
  await page.route('**/academics/section-attendance/bulk**', async (route) => {
    const body = route.request().postDataJSON?.()
    captured.bulkSaves.push(body)
    await route.fulfill(json({ totalProcessed: body?.records?.length ?? 0, errors: [] }))
  })
  await page.route('**/academics/section-attendance**', (route) => route.fulfill(json({ records: [], total: 0 })))

  // Dashboard overview + summary
  await page.route('**/academics/attendance/overview**', (route) =>
    route.fulfill(json({
      todaySummary: { date: new Date().toISOString().split('T')[0], schoolId: SCHOOL_ID, totalStudents: ROSTER.length, totalRecorded: 0, present: 0, absent: 0, late: 0, excused: 0, halfDay: 0, attendanceRate: 0, coveragePct: 0 },
      periodAverages: { last7Days: 0, last30Days: 0 },
      atRiskStudents: [], totalAtRiskCount: 0, trend: [], absenceBreakdown: {}, dayOfWeekPattern: {}, sectionCompletion: {},
    })),
  )
  await page.route('**/academics/attendance/summary**', (route) =>
    route.fulfill(json({ date: new Date().toISOString().split('T')[0], schoolId: SCHOOL_ID, totalStudents: ROSTER.length, totalRecorded: 0, present: 0, absent: 0, late: 0, excused: 0, halfDay: 0, attendanceRate: 0 })),
  )

  // IEMiS export
  await page.route('**/academics/attendance/iemis-export**', (route) =>
    route.fulfill(json({
      schoolId: SCHOOL_ID, yearMonth: '2025-05', generatedAt: new Date().toISOString(), rowCount: ROSTER.length,
      rows: ROSTER.map((s) => ({ studentId: s.studentId, studentName: s.studentName, gradeLevel: '9', presentDays: 18, absentDays: 1, excusedDays: 1, totalSchoolDays: 20 })),
    })),
  )

  // School config (Story 4 read + write)
  await page.route('**/schools/*/configuration**', async (route) => {
    if (route.request().method() === 'PATCH') {
      captured.configPatches.push(route.request().postDataJSON?.())
      return route.fulfill(json({ schoolId: SCHOOL_ID, attendancePolicy: mode }))
    }
    return route.fulfill(json({ schoolId: SCHOOL_ID, attendancePolicy: mode }))
  })

  // School + activation requirements (settings page chrome)
  await page.route('**/schools/*/activation-requirements**', (route) =>
    route.fulfill(json({ requirements: [], canActivate: true, archetype: 'PABSON' })),
  )

  return captured
}
