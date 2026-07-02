/**
 * Academics MFE mock layer — deterministic `page.route` mocks for the endpoints
 * the academics remote pages call on load (overview, students, classrooms,
 * curriculum, exams, teachers). Layer this ON TOP of the shell mocks
 * (mockShellApi) — routes registered later win, so these override the shell
 * catch-all. Reuses the E2E tenant/school/AY constants from role-data.mjs and
 * mirrors the endpoint map documented in docs/testing/rollout-playbook.md.
 *
 * The academics remote reads the active school from the `edforge-app` cookie
 * (seeded by seedRoleSession) + the shared school-context-channel, and gates
 * most pages on GET /schools/:id/academic-years/current — so that endpoint is
 * mocked first and is the one every page needs.
 *
 * Shapes follow apps/academics/src/services/academics.service.ts + school.service.ts.
 * Assertions in the specs stay on stable chrome (headings/tabs/aria-labels), so
 * the mocks only need to be valid enough for each page to render its shell.
 */

import type { Page } from '@playwright/test'
import { E2E_TENANT } from './role-data.mjs'

const { schoolId: SCHOOL_ID, academicYearId: AY_ID, academicYearName: AY_NAME } = E2E_TENANT

const today = () => new Date().toISOString().split('T')[0]
function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) }
}

/**
 * Deterministic roster shared across students/sections mocks. `fullName` is the
 * field StudentTable actually renders (accessorKey 'fullName') — include it
 * alongside first/last so both consumers resolve.
 */
export const ACADEMICS_ROSTER = [
  { id: 'stu-aarav', studentId: 'stu-aarav', firstName: 'Aarav', lastName: 'Sharma', fullName: 'Aarav Sharma', gradeLevel: '9', status: 'active', studentNumber: '001' },
  { id: 'stu-bhavna', studentId: 'stu-bhavna', firstName: 'Bhavna', lastName: 'Poudel', fullName: 'Bhavna Poudel', gradeLevel: '9', status: 'active', studentNumber: '002' },
  { id: 'stu-chandra', studentId: 'stu-chandra', firstName: 'Chandra', lastName: 'Thapa', fullName: 'Chandra Thapa', gradeLevel: '10', status: 'active', studentNumber: '003' },
]

const SECTION = {
  sectionId: 'sec-grade9-math',
  id: 'sec-grade9-math',
  schoolId: SCHOOL_ID,
  sectionName: 'Grade 9 Math',
  sectionNumber: 'A',
  subjectArea: 'mathematics',
  courseId: 'course-math',
  courseName: 'Mathematics',
  primaryTeacherId: 'teacher-1',
  currentEnrollment: 3,
  maxEnrollment: 30,
  isActive: true,
}

const COURSE = {
  courseId: 'course-math',
  id: 'course-math',
  schoolId: SCHOOL_ID,
  name: 'Mathematics',
  // CourseTable renders `courseName` (accessorKey 'courseName').
  courseName: 'Mathematics',
  courseCode: 'MATH-9',
  subjectArea: 'mathematics',
  courseType: 'core',
  creditType: 'standard',
  isActive: true,
}

export interface AcademicsMockOptions {
  /** Empty datasets (exercise empty states) instead of the seeded roster. */
  empty?: boolean
  /** Override the student list (bulk specs seed a specific roster). */
  students?: Array<Record<string, unknown>>
  /** Override the section list (bulk specs seed active/inactive mixes). */
  sections?: Array<Record<string, unknown>>
}

/**
 * Install academics load-endpoint mocks. Call AFTER the shell fixture has run
 * (it does, when specs import from e2e/fixtures/test.ts and add this in a
 * beforeEach), so these take precedence over the shell catch-all.
 */
export async function mockAcademicsApi(page: Page, opts: AcademicsMockOptions = {}): Promise<void> {
  const students = opts.students ?? (opts.empty ? [] : ACADEMICS_ROSTER)
  const sections = opts.sections ?? (opts.empty ? [] : [SECTION])
  const courses = opts.empty ? [] : [COURSE]
  const totalEnrolled = students.length

  // Universal gate — every academics page waits on the current AY.
  await page.route('**/api/schools/*/academic-years/current**', (r) =>
    r.fulfill(json({ yearId: AY_ID, schoolId: SCHOOL_ID, name: AY_NAME, startDate: '2025-04-14', endDate: '2026-04-13', isCurrent: true, status: 'active' })),
  )
  await page.route('**/api/schools/*/academic-years**', (r) =>
    r.fulfill(json({ items: [{ yearId: AY_ID, id: AY_ID, schoolId: SCHOOL_ID, name: AY_NAME, startDate: '2025-04-14', endDate: '2026-04-13', isCurrent: true, status: 'active', terms: [] }] })),
  )
  await page.route('**/api/schools/*/academic-years/*/grading-periods**', (r) =>
    r.fulfill(json({ items: [{ id: 'term-1', gradingPeriodId: 'term-1', name: 'Term 1', schoolId: SCHOOL_ID, academicYearId: AY_ID }] })),
  )

  // Overview dashboard + enrollment summary.
  await page.route('**/api/academics/dashboard/overview**', (r) =>
    r.fulfill(json({
      schoolId: SCHOOL_ID,
      academicYearId: AY_ID,
      date: today(),
      enrollment: { totalEnrolled, byGradeLevel: { '9': 2, '10': 1 }, byStatus: { active: totalEnrolled }, recentEnrollments: 0, recentWithdrawals: 0 },
      activeSectionsCount: sections.length,
      attendance: { date: today(), totalStudents: totalEnrolled, totalRecorded: totalEnrolled, present: totalEnrolled, absent: 0, late: 0, excused: 0, attendanceRate: 100 },
    })),
  )
  await page.route('**/api/academics/schools/*/years/*/enrollments/summary**', (r) =>
    r.fulfill(json({ totalEnrolled, byGradeLevel: { '9': 2, '10': 1 }, byStatus: { active: totalEnrolled } })),
  )
  await page.route('**/api/academics/schools/*/years/*/enrollments**', (r) =>
    r.fulfill(json({ items: [], hasMore: false, lastEvaluatedKey: undefined, total: totalEnrolled })),
  )

  // Students.
  await page.route('**/api/academics/students?**', (r) =>
    r.fulfill(json({ items: students, hasMore: false, lastEvaluatedKey: undefined, total: students.length })),
  )
  await page.route('**/api/academics/attendance/student-trends**', (r) => r.fulfill(json({ trends: {} })))

  // Sections (classrooms) — some consumers read `items`, the attendance
  // fixture reads `sections`; provide both to be shape-agnostic.
  await page.route('**/api/academics/sections?**', (r) => r.fulfill(json({ items: sections, sections, total: sections.length })))
  await page.route('**/api/academics/sections/*/students**', (r) => r.fulfill(json({ sectionId: SECTION.sectionId, students, total: students.length })))

  // Courses (curriculum).
  await page.route('**/api/academics/courses?**', (r) =>
    r.fulfill(json({ items: courses, hasMore: false, lastEvaluatedKey: undefined, total: courses.length })),
  )

  // Grading policies + grades overview (classrooms gradebook/policies tabs).
  await page.route('**/api/academics/grading-policies**', (r) => r.fulfill(json({ items: [] })))
  await page.route('**/api/academics/grades/overview**', (r) => r.fulfill(json({ schoolId: SCHOOL_ID, academicYearId: AY_ID, sections: [] })))

  // Exams.
  await page.route('**/api/academics/exams/exam-pattern**', (r) => r.fulfill(json({ archetype: E2E_TENANT.archetype, examPattern: ['First Term', 'Mid Term', 'Final Term'] })))
  await page.route('**/api/academics/exams?**', (r) => r.fulfill(json({ items: [], total: 0 })))

  // Attendance surfaces (classrooms attendance tab shares these; the dedicated
  // attendance.spec.ts fixture is more thorough — this keeps the tab from erroring).
  await page.route('**/api/academics/attendance/overview**', (r) =>
    r.fulfill(json({ schoolId: SCHOOL_ID, date: today(), totalStudents: totalEnrolled, totalRecorded: totalEnrolled, attendanceRate: 100, sectionCompletion: { totalSections: sections.length, sectionsWithAttendance: sections.length, sections: [] } })),
  )
  await page.route('**/api/academics/attendance/summary**', (r) =>
    r.fulfill(json({ date: today(), schoolId: SCHOOL_ID, totalStudents: totalEnrolled, totalRecorded: totalEnrolled, present: totalEnrolled, absent: 0, late: 0, excused: 0, attendanceRate: 100 })),
  )
  await page.route('**/api/academics/attendance/alerts**', (r) => r.fulfill(json({ alerts: [], totalAtRiskCount: 0 })))
  await page.route('**/api/academics/attendance/trend**', (r) => r.fulfill(json([])))

  // Staff (overview staff-roster card + teachers page).
  await page.route('**/api/schools/*/staff**', (r) => r.fulfill(json({ items: [], total: 0 })))
}

// ---------------------------------------------------------------------------
// Bulk-action fixtures (#237 — students archive / sections status)
// ---------------------------------------------------------------------------

/** A StudentResponseDto-shaped record (StudentTable reads fullName/currentGradeLevel/status). */
export function student(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    studentId: 'stu-x',
    fullName: 'Student X',
    studentNumber: '000',
    currentGradeLevel: '9',
    status: 'active',
    ...overrides,
  }
}

/** A SectionResponseDto-shaped record (SectionTable/modal read isActive/currentEnrollment/…). */
export function section(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    sectionId: 'sec-x',
    sectionNumber: 'A',
    sectionName: 'Section A',
    courseName: 'Course',
    isActive: true,
    currentEnrollment: 0,
    maxEnrollment: 30,
    ...overrides,
  }
}

/** Captured bulk writes so specs can assert the exact fan-out the UI sent. */
export interface BulkCapture {
  /** studentIds hit by DELETE /academics/students/:id (one per archived student). */
  studentDeletes: string[]
  /** { id, isActive } per PATCH /academics/sections/:id (one per eligible section). */
  sectionPatches: Array<{ id: string; isActive: unknown }>
}

export interface CaptureOptions {
  /** studentIds that should return 409 (EnrollmentLocked) instead of 204. */
  failStudentIds?: string[]
  /** sectionIds that should return 409 instead of 200. */
  failSectionIds?: string[]
}

/**
 * Capture the bulk write fan-out. Register AFTER mockAcademicsApi (later routes
 * win). DELETE has no body, so we capture the id from the URL; section PATCH
 * carries `{ isActive }`. Non-target methods fall through via route.fallback()
 * so the list/roster GET mocks still apply.
 */
export async function captureBulkWrites(page: Page, opts: CaptureOptions = {}): Promise<BulkCapture> {
  const failStudents = new Set(opts.failStudentIds ?? [])
  const failSections = new Set(opts.failSectionIds ?? [])
  const captured: BulkCapture = { studentDeletes: [], sectionPatches: [] }

  await page.route('**/api/academics/students/*', async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()
    const id = new URL(route.request().url()).pathname.split('/').pop()!.split('?')[0]
    captured.studentDeletes.push(id)
    if (failStudents.has(id)) {
      return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'EnrollmentLocked' }) })
    }
    return route.fulfill({ status: 204, body: '' })
  })

  await page.route('**/api/academics/sections/*', async (route) => {
    if (route.request().method() !== 'PATCH') return route.fallback()
    const url = new URL(route.request().url())
    const id = url.pathname.split('/').pop()!.split('?')[0]
    const body = route.request().postDataJSON?.() as { isActive?: unknown } | undefined
    captured.sectionPatches.push({ id, isActive: body?.isActive })
    if (failSections.has(id)) {
      return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'Conflict' }) })
    }
    return route.fulfill(json({ sectionId: id, isActive: body?.isActive }))
  })

  return captured
}
