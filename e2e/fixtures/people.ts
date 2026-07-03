/**
 * People MFE mock layer — deterministic `page.route` mocks for the endpoints the
 * people remote pages call on load (overview, staff directory) plus the staff
 * creation wizard's submit fan-out. Layer this ON TOP of the shell mocks
 * (mockShellApi) — routes registered later win, so these override the shell
 * catch-all. Reuses the E2E tenant/school constants from role-data.mjs.
 *
 * School gating: the people remote hard-gates every page on an active school —
 * PeopleLayout reads `activeSchoolId` from the `edforge-app` cookie (seeded by
 * seedRoleSession) + the shared school-context-channel. With the cookie carrying
 * schoolId 'school-e2e', the gate passes and the pages render. No
 * academic-year/current or /users/me gate on these pages (unlike academics).
 *
 * Shapes follow StaffResponseDto / StaffListResponseDto from
 * @aibrains/shared-types. The staff table + overview read `firstName` +
 * `lastSurname` (NOT lastName) and key rows on `staffId` (NOT id) — the
 * factory below carries the exact field names the components destructure.
 * Assertions in the specs stay on stable chrome (headings/column headers/
 * aria-labels) + the seeded names, so the mocks only need to be valid enough
 * for each page to render.
 */

import type { Page } from '@playwright/test'
import { E2E_TENANT } from './role-data.mjs'

const { schoolId: SCHOOL_ID, tenantId: TENANT_ID, schoolName: SCHOOL_NAME } = E2E_TENANT

function json(body: unknown, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify(body) }
}

/**
 * A StaffResponseDto-shaped record. The overview/directory read
 * firstName+lastSurname for the name, staffId for the row id, and
 * role/employmentStatus/departmentName/userId for the badges + KPI tallies.
 */
export function staff(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    staffId: 'staff-x',
    staffUniqueId: 'EMP-000',
    tenantId: TENANT_ID,
    firstName: 'Staff',
    lastSurname: 'X',
    email: 'staff.x@e2e.edforge.test',
    role: 'teacher',
    employmentType: 'full_time',
    employmentStatus: 'active',
    status: 'active',
    hireDate: '2024-04-14',
    departmentName: 'Science',
    primarySchoolId: SCHOOL_ID,
    primarySchoolName: SCHOOL_NAME,
    userId: 'user-x',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

/**
 * Deterministic staff roster shared across overview/directory mocks: a teacher,
 * a principal, and a support-staff member (with no user account) so the KPI
 * tiles + role/system-access badges all have something to render.
 */
export const PEOPLE_STAFF = [
  staff({ staffId: 'staff-anita', staffUniqueId: 'EMP-001', firstName: 'Anita', lastSurname: 'Gurung', email: 'anita.gurung@e2e.edforge.test', role: 'teacher', departmentName: 'Science', userId: 'user-anita' }),
  staff({ staffId: 'staff-bikash', staffUniqueId: 'EMP-002', firstName: 'Bikash', lastSurname: 'Rai', email: 'bikash.rai@e2e.edforge.test', role: 'principal', departmentName: 'Administration', userId: 'user-bikash' }),
  staff({ staffId: 'staff-chandra', staffUniqueId: 'EMP-003', firstName: 'Chandra', lastSurname: 'Adhikari', email: 'chandra.adhikari@e2e.edforge.test', role: 'support_staff', employmentType: 'part_time', departmentName: 'Library', userId: undefined }),
]

export interface PeopleMockOptions {
  /** Empty roster (exercise the "No staff members found" empty state). */
  empty?: boolean
  /** Override the staff list (specs seed a specific roster). */
  staff?: Array<Record<string, unknown>>
}

/**
 * Install people load-endpoint mocks. Call AFTER the shell fixture has run (it
 * does, via the auto `captured` fixture when specs import e2e/fixtures/test.ts),
 * so these take precedence over the shell catch-all.
 */
export async function mockPeopleApi(page: Page, opts: PeopleMockOptions = {}): Promise<void> {
  const roster = opts.staff ?? (opts.empty ? [] : PEOPLE_STAFF)

  // Staff list — the single load call for both Overview and Staff Directory
  // (GET /api/staff?limit=20&schoolId=…[&search=…]). One page, no "load more".
  await page.route('**/api/staff?**', (r) => {
    if (r.request().method() !== 'GET') return r.fallback()
    return r.fulfill(json({ items: roster, hasMore: false, lastEvaluatedKey: undefined, total: roster.length }))
  })

  // Staff detail (drawer / detail page) — resolve any single id to the first
  // seeded record so a row click / deep link renders. GET only; POST
  // /staff/with-user + PATCH/DELETE fall through (captureStaffWrites handles them).
  await page.route('**/api/staff/*', (r) => {
    if (r.request().method() !== 'GET') return r.fallback()
    const id = new URL(r.request().url()).pathname.split('/').pop()!.split('?')[0]
    const found = roster.find((s) => s.staffId === id) ?? roster[0] ?? staff({ staffId: id })
    return r.fulfill(json(found))
  })

  // Staff sub-collections the detail page lazy-loads (assignments, credentials,
  // trainings, leave, employment-history) — empty is enough to render the tabs.
  await page.route('**/api/staff/*/assignments**', (r) => (r.request().method() === 'GET' ? r.fulfill(json({ items: [] })) : r.fallback()))
  await page.route('**/api/staff/*/credentials**', (r) => (r.request().method() === 'GET' ? r.fulfill(json({ items: [] })) : r.fallback()))
  await page.route('**/api/staff/*/trainings**', (r) => (r.request().method() === 'GET' ? r.fulfill(json({ items: [] })) : r.fallback()))
  await page.route('**/api/staff/*/leave**', (r) => (r.request().method() === 'GET' ? r.fulfill(json({ items: [] })) : r.fallback()))
  await page.route('**/api/staff/*/employment-history**', (r) => (r.request().method() === 'GET' ? r.fulfill(json({ items: [] })) : r.fallback()))

  // Users directory (people.service.ts /users) — the CreateUserModal / roles
  // surfaces read it; empty list keeps them from erroring.
  await page.route('**/api/users?**', (r) => (r.request().method() === 'GET' ? r.fulfill(json({ items: [], hasMore: false, total: 0 })) : r.fallback()))
}

// ---------------------------------------------------------------------------
// Staff-creation wizard write capture
// ---------------------------------------------------------------------------

/** Captured wizard writes so specs can assert the exact create the UI sent. */
export interface StaffWriteCapture {
  /** POST /api/staff bodies (createUserAccount === false path). */
  staffCreates: Array<Record<string, unknown>>
  /** POST /api/staff/with-user bodies (createUserAccount === true path). */
  staffWithUserCreates: Array<Record<string, unknown>>
  /** POST /api/staff/:id/assignments bodies (additional assignments). */
  assignmentCreates: Array<{ staffId: string; body: unknown }>
}

/**
 * Capture the staff-creation fan-out. Register AFTER mockPeopleApi (later routes
 * win). The wizard fires ONE of POST /staff | POST /staff/with-user on submit,
 * then POST /staff/:id/assignments per extra assignment. Returns the created id
 * in the shape each success path reads (`.staffId` vs `.staff.staffId`).
 */
export async function captureStaffWrites(page: Page): Promise<StaffWriteCapture> {
  const captured: StaffWriteCapture = { staffCreates: [], staffWithUserCreates: [], assignmentCreates: [] }
  const newId = 'staff-created'

  // POST /staff/with-user — must be registered before the bare /staff route so
  // the more specific path wins.
  await page.route('**/api/staff/with-user', (r) => {
    if (r.request().method() !== 'POST') return r.fallback()
    captured.staffWithUserCreates.push(r.request().postDataJSON?.() as Record<string, unknown>)
    return r.fulfill(json({ staff: staff({ staffId: newId }), user: { userId: 'user-created' } }, 201))
  })

  await page.route('**/api/staff/*/assignments', (r) => {
    if (r.request().method() !== 'POST') return r.fallback()
    const staffId = new URL(r.request().url()).pathname.split('/').slice(-2)[0]
    captured.assignmentCreates.push({ staffId, body: r.request().postDataJSON?.() })
    return r.fulfill(json({ assignmentId: 'asg-created', staffId }, 201))
  })

  await page.route('**/api/staff', (r) => {
    if (r.request().method() !== 'POST') return r.fallback()
    captured.staffCreates.push(r.request().postDataJSON?.() as Record<string, unknown>)
    return r.fulfill(json(staff({ staffId: newId }), 201))
  })

  return captured
}

// ---------------------------------------------------------------------------
// Staff bulk-delete write capture (⑨ selection bar → BulkDeleteStaffModal)
// ---------------------------------------------------------------------------

export interface StaffDeleteCapture {
  /** staffIds hit by DELETE /api/staff/:id (one per selected record). */
  staffDeletes: string[]
}

/**
 * Capture the bulk-delete fan-out. Register AFTER mockPeopleApi (later routes
 * win; its /staff/:id route only handles GET and falls back otherwise).
 * `failStaffIds` return 409 instead of 204 so specs can drive the partial-
 * failure aggregate toast.
 */
export async function captureStaffDeletes(
  page: Page,
  opts: { failStaffIds?: string[] } = {},
): Promise<StaffDeleteCapture> {
  const fail = new Set(opts.failStaffIds ?? [])
  const captured: StaffDeleteCapture = { staffDeletes: [] }

  await page.route('**/api/staff/*', (r) => {
    if (r.request().method() !== 'DELETE') return r.fallback()
    const id = new URL(r.request().url()).pathname.split('/').pop()!.split('?')[0]
    captured.staffDeletes.push(id)
    if (fail.has(id)) {
      return r.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'Conflict' }) })
    }
    return r.fulfill({ status: 204, body: '' })
  })

  return captured
}
