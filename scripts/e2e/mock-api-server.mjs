/**
 * Deterministic mock API server for Playwright MCP exploration sessions.
 *
 * Agent-driven MCP browsing can't use Playwright's page.route interception, so
 * this serves the same shell-boot data (mirroring e2e/fixtures/network.ts) over
 * real HTTP. Wire it through the shell dev proxy with zero app changes:
 *
 *   1. apps/shell/.env.local →  VITE_API_URL=http://localhost:4010/api
 *      (the dev proxy strips the request's /api prefix; the target's /api
 *      suffix restores it, so every handler here uses '/api/...' paths —
 *      consistent with test-utils/mocks/handlers.ts)
 *   2. pnpm e2e:mock-api          # this server on :4010
 *   3. pnpm dev:mvp               # shell + MFEs on :3000
 *
 * The active role's data follows e2e/.auth/ — pass MOCK_API_ROLE=<Role> to
 * change whose /users/me profile is served (default TenantAdmin).
 *
 * Attempts to also mount the finance-domain MSW handlers from
 * test-utils/mocks/handlers.ts (invoices, payments, accounts, fee structures);
 * when Node can't import them, finance endpoints fall through to the catch-all.
 */

import { createServer } from '@mswjs/http-middleware'
import { http, HttpResponse } from 'msw'
import { E2E_TENANT, ROLE_USERS, E2E_ROLES } from '../../e2e/fixtures/role-data.mjs'

const PORT = Number(process.env.MOCK_API_PORT ?? 4010)
const role = process.env.MOCK_API_ROLE ?? 'TenantAdmin'
if (!E2E_ROLES.includes(role)) {
  console.error(`Unknown MOCK_API_ROLE "${role}". Valid: ${E2E_ROLES.join(', ')}`)
  process.exit(1)
}
const user = ROLE_USERS[role]
const today = () => new Date().toISOString().split('T')[0]

const shellHandlers = [
  http.get('/api/users/me', () =>
    HttpResponse.json({
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

  http.get(`/api/tenants/${E2E_TENANT.tenantId}`, () =>
    HttpResponse.json({
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

  http.get(`/api/tenants/${E2E_TENANT.tenantId}/settings`, () =>
    HttpResponse.json({
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

  http.get('/api/schools', () =>
    HttpResponse.json({
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

  http.get('/api/schools/:schoolId/academic-years/current', () =>
    HttpResponse.json({
      yearId: E2E_TENANT.academicYearId,
      name: E2E_TENANT.academicYearName,
      isCurrent: true,
      status: 'active',
      startDate: '2025-04-14',
      endDate: '2026-04-13',
      terms: [],
    }),
  ),

  http.get('/api/schools/:schoolId/configuration', () =>
    HttpResponse.json({ schoolId: E2E_TENANT.schoolId, attendancePolicy: 'daily_presence' }),
  ),

  http.get('/api/schools/:schoolId/activation-requirements', () =>
    HttpResponse.json({ requirements: [], canActivate: true, archetype: E2E_TENANT.archetype }),
  ),

  http.get('/api/academics/dashboard/overview', () =>
    HttpResponse.json({
      enrollment: { totalEnrolled: 42, byGradeLevel: { 9: 22, 10: 20 }, byStatus: { active: 42 } },
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

  http.get('/api/academics/schools/:schoolId/years/:yearId/enrollments/summary', () =>
    HttpResponse.json({ totalEnrolled: 42, byGradeLevel: { 9: 22, 10: 20 }, byStatus: { active: 42 } }),
  ),

  http.get('/api/academics/attendance/summary', () =>
    HttpResponse.json({
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

  http.get('/api/academics/attendance/alerts', () =>
    HttpResponse.json({ alerts: [], totalAtRiskCount: 0 }),
  ),

  http.get('/api/academics/attendance/trend', () => HttpResponse.json([])),

  http.get('/api/academics/attendance/overview', () =>
    HttpResponse.json({
      schoolId: E2E_TENANT.schoolId,
      date: today(),
      totalStudents: 42,
      totalRecorded: 40,
      attendanceRate: 95,
      sectionCompletion: { totalSections: 4, sectionsWithAttendance: 4, sections: [] },
    }),
  ),

  http.get('/api/academics/sections', () => HttpResponse.json({ items: [] })),

  // Catch-all: 200 {} so an unmocked endpoint never 401s the seeded session.
  // Logged so exploration sessions surface mock-coverage gaps.
  http.all('/api/*', ({ request }) => {
    console.warn(`[mock-api] unmocked: ${request.method} ${new URL(request.url).pathname}`)
    return HttpResponse.json({})
  }),
]

let financeHandlers = []
try {
  const mod = await import('../../test-utils/mocks/handlers.ts')
  financeHandlers = mod.handlers ?? []
  console.log(`[mock-api] loaded ${financeHandlers.length} finance-domain handlers from test-utils/mocks/handlers.ts`)
} catch (err) {
  // Known limitation: handlers.ts uses extensionless TS imports that Node's
  // type-stripping can't resolve. Shell-boot handlers below still serve; the
  // finance surfaces just return catch-all {} during MCP exploration.
  console.warn('[mock-api] finance handlers unavailable — finance endpoints fall through to the catch-all:', err.message)
}

// Specific handlers first — MSW matches in registration order, so the
// catch-all (last in shellHandlers) must stay behind the finance handlers.
const catchAll = shellHandlers.pop()
const server = createServer(...shellHandlers, ...financeHandlers, catchAll)

server.listen(PORT, () => {
  console.log(`[mock-api] serving deterministic EdForge data on http://localhost:${PORT}`)
  console.log(`[mock-api] role: ${role} (override with MOCK_API_ROLE=<Role>)`)
  console.log('[mock-api] shell wiring: apps/shell/.env.local → VITE_API_URL=http://localhost:4010/api')
})
