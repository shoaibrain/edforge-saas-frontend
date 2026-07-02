/**
 * Shared shell-level API mock layer for agent-generated E2E tests.
 *
 * Deterministic `page.route` mocks for every API the shell boot + home +
 * settings surfaces call (inventoried from apps/shell/src/lib/shell-context.tsx
 * and apps/shell/src/services/*). The trailing catch-all guarantees NO request
 * ever reaches a real backend or returns 401 — an unmocked 401 would trip the
 * session-invalidation interceptor in apps/shell/src/lib/api.ts and bounce the
 * seeded session to /login.
 *
 * Module-specific suites (academics, finance, people) layer their own routes
 * on top — routes registered AFTER these take precedence in Playwright.
 */

import type { Page } from '@playwright/test'
import { E2E_TENANT, ROLE_USERS } from './role-data.mjs'
import type { E2ERole } from './role-data.mjs'

function json(body: unknown, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

export interface CapturedTraffic {
  /** POST/PATCH/PUT/DELETE payloads, so specs can assert the exact write the UI sent. */
  writes: Array<{ method: string; url: string; body: unknown }>
  /** API URLs that only the catch-all handled — coverage gaps in the mock layer. */
  unmocked: string[]
}

const today = () => new Date().toISOString().split('T')[0]

export async function mockShellApi(page: Page, role: E2ERole): Promise<CapturedTraffic> {
  const user = ROLE_USERS[role]
  const captured: CapturedTraffic = { writes: [], unmocked: [] }

  // Catch-all — registered FIRST so every later (more specific) route wins.
  // Fulfills 200 {} so nothing hangs and nothing 401s.
  await page.route('**/api/**', async (route) => {
    const req = route.request()
    if (req.method() !== 'GET') {
      captured.writes.push({ method: req.method(), url: req.url(), body: req.postDataJSON?.() })
    }
    captured.unmocked.push(`${req.method()} ${new URL(req.url()).pathname}`)
    await route.fulfill(json({}))
  })

  // ── Identity / tenant boot (shell-context.tsx) ─────────────────────────────
  await page.route('**/api/users/me', (route) =>
    route.fulfill(
      json({
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        tenantId: E2E_TENANT.tenantId,
        tenantName: E2E_TENANT.tenantName,
        globalRole: user.globalRole,
        assignments: Object.entries(user.assignments).map(([schoolId, r]) => ({
          schoolId,
          schoolName: E2E_TENANT.schoolName,
          role: r,
        })),
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    ),
  )

  await page.route(`**/api/tenants/${E2E_TENANT.tenantId}`, (route) =>
    route.fulfill(
      json({
        id: E2E_TENANT.tenantId,
        name: E2E_TENANT.tenantName,
        subdomain: E2E_TENANT.subdomain,
        archetype: E2E_TENANT.archetype,
        country: E2E_TENANT.country,
        tier: 'BASIC',
        createdAt: '2026-01-01T00:00:00.000Z',
        schools: [E2E_TENANT.schoolId],
        activeSchoolYear: E2E_TENANT.academicYearId,
      }),
    ),
  )

  // Workspace settings — only fetched for TenantAdmin (shell-context.tsx).
  // onboardingCompletedAt must be set or useOnboardingRequired bounces
  // TenantAdmin to the /onboarding wizard.
  await page.route(`**/api/tenants/${E2E_TENANT.tenantId}/settings**`, (route) =>
    route.fulfill(
      json({
        onboardingCompletedAt: '2026-01-01T00:00:00.000Z',
        workspaceConfirmedAt: '2026-01-01T00:00:00.000Z',
        regional: {
          currency: 'NPR',
          timezone: 'Asia/Kathmandu',
          calendarSystem: 'BS',
          locale: 'ne-NP',
          numberFormat: 'south-asian',
          weekStart: 'sunday',
        },
        lockHolders: [],
      }),
    ),
  )

  await page.route('**/api/schools?**', (route) =>
    route.fulfill(
      json({
        items: [
          {
            schoolId: E2E_TENANT.schoolId,
            tenantId: E2E_TENANT.tenantId,
            name: E2E_TENANT.schoolName,
            schoolCode: 'E2E-01',
            schoolType: 'secondary',
            status: 'active',
            calendarSystem: 'BS',
            currentAcademicYearId: E2E_TENANT.academicYearId,
            enabledGradeLevels: ['PG', 'NUR', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          },
        ],
        hasMore: false,
      }),
    ),
  )

  await page.route('**/api/schools/*/academic-years/current**', (route) =>
    route.fulfill(
      json({
        yearId: E2E_TENANT.academicYearId,
        name: E2E_TENANT.academicYearName,
        isCurrent: true,
        status: 'active',
        startDate: '2025-04-14',
        endDate: '2026-04-13',
        terms: [],
      }),
    ),
  )

  await page.route('**/api/schools/*/configuration**', async (route) => {
    if (route.request().method() !== 'GET') {
      captured.writes.push({
        method: route.request().method(),
        url: route.request().url(),
        body: route.request().postDataJSON?.(),
      })
    }
    await route.fulfill(json({ schoolId: E2E_TENANT.schoolId, attendancePolicy: 'daily_presence' }))
  })

  await page.route('**/api/schools/*/activation-requirements**', (route) =>
    route.fulfill(json({ requirements: [], canActivate: true, archetype: E2E_TENANT.archetype })),
  )

  // ── Home dashboard (apps/shell/src/services/home.service.ts) ───────────────
  await page.route('**/api/academics/dashboard/overview**', (route) =>
    route.fulfill(
      json({
        enrollment: {
          totalEnrolled: 42,
          byGradeLevel: { '9': 22, '10': 20 },
          byStatus: { active: 42 },
        },
        activeSectionsCount: 4,
        attendance: {
          date: today(),
          totalStudents: 42,
          totalRecorded: 40,
          present: 38,
          absent: 2,
          late: 0,
          excused: 0,
          attendanceRate: 95,
        },
      }),
    ),
  )

  await page.route('**/api/academics/schools/*/years/*/enrollments/summary**', (route) =>
    route.fulfill(
      json({ totalEnrolled: 42, byGradeLevel: { '9': 22, '10': 20 }, byStatus: { active: 42 } }),
    ),
  )

  await page.route('**/api/academics/attendance/summary**', (route) =>
    route.fulfill(
      json({
        date: today(),
        totalStudents: 42,
        totalRecorded: 40,
        present: 38,
        absent: 2,
        late: 0,
        excused: 0,
        attendanceRate: 95,
      }),
    ),
  )

  await page.route('**/api/academics/attendance/alerts**', (route) =>
    route.fulfill(json({ alerts: [], totalAtRiskCount: 0 })),
  )

  await page.route('**/api/academics/attendance/trend**', (route) => route.fulfill(json([])))

  await page.route('**/api/academics/attendance/overview**', (route) =>
    route.fulfill(
      json({
        schoolId: E2E_TENANT.schoolId,
        date: today(),
        totalStudents: 42,
        totalRecorded: 40,
        attendanceRate: 95,
        sectionCompletion: { totalSections: 4, sectionsWithAttendance: 4, sections: [] },
      }),
    ),
  )

  await page.route('**/api/academics/sections**', (route) => route.fulfill(json({ items: [] })))

  return captured
}
