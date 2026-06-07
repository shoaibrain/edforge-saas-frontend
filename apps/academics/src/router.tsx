/**
 * Academics Router Configuration
 *
 * Defines the internal routing for the Academics micro-frontend.
 *
 * Route consolidation:
 * - /classrooms → Unified Classrooms module (replaces /scheduling, /grades, /attendance)
 * - /classrooms/create → Section create page
 * - /classrooms/$sectionId → Classroom detail page
 * - /classrooms/$sectionId/edit → Section edit page
 * - /classrooms/report-card → Report card page
 * - /curriculum → Curriculum module (courses, grade levels, standards)
 * - /students → Students module
 *
 * Legacy routes (/scheduling, /grades, /attendance, etc.) redirect to /classrooms.
 */

import {
    createRouter,
    createRoute,
    createRootRoute,
    Outlet,
    redirect,
} from '@tanstack/react-router'
import { MfeNotFoundBoundary } from '@edforge/ui'
import { z } from 'zod'
import { AcademicsLayout } from './layouts/AcademicsLayout'
import { Overview } from './routes/overview'
import { StudentsModule } from './routes/students'
import { StudentProfilePage } from './routes/students/$studentId'
import { TeachersModule } from './routes/teachers'
import { EnrollmentModule } from './routes/enrollment'
import { StudentProfilesModule } from './routes/students/profiles'
import { IemisImport } from './components/students/iemis/IemisImport'
import { GovernmentReportsExport } from './components/reports/GovernmentReportsExport'
import { CalendarModule } from './routes/calendar'
import { SectionRosterPage } from './routes/sections/roster'
import { BulkRosteringPage } from './routes/rostering'
import { CurriculumModule } from './routes/curriculum'
import { ExamsModule } from './routes/exams'
import { ExamDetailModule } from './routes/exams/$examId'
import { CourseDetailPage } from './routes/curriculum/$courseId'
import { ReportCardPage } from './routes/grades/report-card'

// Classrooms — consolidated Scheduling + Grades + Attendance
import { ClassroomsModule } from './routes/classrooms'
import { ClassroomDetailPage } from './routes/classrooms/$sectionId'
import { SectionCreatePage } from './routes/classrooms/create'
import { SectionEditPage } from './routes/classrooms/$sectionId.edit'

// ============================================================================
// ROOT ROUTE
// ============================================================================

const rootRoute = createRootRoute({
    component: () => (
        <AcademicsLayout>
            <Outlet />
        </AcademicsLayout>
    ),
})

// ============================================================================
// ROUTES
// ============================================================================

// Overview (Index)
const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Overview,
})

// Students
const studentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/students',
    component: StudentsModule,
})

const studentEnrollmentRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/students/enrollment',
    component: EnrollmentModule,
})

const studentProfileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/students/$studentId',
    component: StudentProfilePage,
})

const studentProfilesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/students/profiles',
    component: StudentProfilesModule,
})

// Phase 3.1 — IEMIS bulk import flow (PABSON pilot / Saraswati day-1).
// Full-page route instead of a modal because import findings can span
// 100+ rows and operators often side-by-side with the source xlsx.
const studentIemisImportRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/students/import/iemis',
    component: IemisImport,
})

// Government Reports — CEHRD IEMIS Flash I/II export (the export counterpart
// to the IEMIS import flow). Full-page route; history + pre-flight can be long.
const reportsGovernmentRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/reports/government',
    component: GovernmentReportsExport,
})

// Teachers
const teachersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/teachers',
    component: TeachersModule,
})

// Calendar
const calendarRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/calendar',
    component: CalendarModule,
})

// ============================================================================
// CLASSROOMS — Nested route tree
// ============================================================================

// Layout route: /classrooms (passthrough)
const classroomsLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/classrooms',
    component: () => <Outlet />,
})

// Index: /classrooms (list page)
const classroomsIndexRoute = createRoute({
    getParentRoute: () => classroomsLayoutRoute,
    path: '/',
    component: ClassroomsModule,
    validateSearch: (search: Record<string, unknown>) => {
        // Backward compat: map removed tab IDs to their replacements
        let tab = search.tab
        if (tab === 'my-classes') tab = 'overview'

        return {
            tab: z
                .enum(['overview', 'gradebook', 'policies', 'attendance'])
                .optional()
                .catch(undefined)
                .parse(tab),
        }
    },
})

// Create: /classrooms/create
const classroomsCreateRoute = createRoute({
    getParentRoute: () => classroomsLayoutRoute,
    path: '/create',
    component: SectionCreatePage,
})

// Report Card: /classrooms/report-card
const reportCardRoute = createRoute({
    getParentRoute: () => classroomsLayoutRoute,
    path: '/report-card',
    component: ReportCardPage,
})

// Detail: /classrooms/$sectionId
const classroomDetailRoute = createRoute({
    getParentRoute: () => classroomsLayoutRoute,
    path: '/$sectionId',
    component: ClassroomDetailPage,
    validateSearch: (search: Record<string, unknown>) => ({
        tab: z
            .enum(['stream', 'classwork', 'people', 'progress', 'grades', 'attendance'])
            .optional()
            .catch(undefined)
            .parse(search.tab),
        view: z
            .enum(['overview', 'gradebook', 'attendance'])
            .optional()
            .catch(undefined)
            .parse(search.view),
    }),
})

// Edit: /classrooms/$sectionId/edit
const classroomEditRoute = createRoute({
    getParentRoute: () => classroomDetailRoute,
    path: '/edit',
    component: SectionEditPage,
})

// ============================================================================
// LEGACY REDIRECTS — Redirect old routes to /classrooms
// ============================================================================

const schedulingRedirectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/scheduling',
    beforeLoad: () => {
        throw redirect({ to: '/classrooms', search: { tab: undefined } })
    },
    component: () => null,
})

const schedulingDetailRedirectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/scheduling/$sectionId',
    beforeLoad: ({ params }) => {
        throw redirect({ to: '/classrooms/$sectionId', params: { sectionId: params.sectionId }, search: { tab: undefined, view: undefined } })
    },
    component: () => null,
})

const gradesRedirectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/grades',
    beforeLoad: () => {
        throw redirect({ to: '/classrooms', search: { tab: 'gradebook' } })
    },
    component: () => null,
})

const attendanceRedirectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/attendance',
    beforeLoad: () => {
        throw redirect({ to: '/classrooms', search: { tab: 'attendance' } })
    },
    component: () => null,
})

const attendanceDashboardRedirectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/attendance/dashboard',
    beforeLoad: () => {
        throw redirect({ to: '/classrooms', search: { tab: 'attendance' } })
    },
    component: () => null,
})

const schedulesRedirectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/schedules',
    beforeLoad: () => {
        throw redirect({ to: '/classrooms', search: { tab: undefined } })
    },
    component: () => null,
})

const timetablesRedirectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/timetables',
    beforeLoad: () => {
        throw redirect({ to: '/classrooms', search: { tab: undefined } })
    },
    component: () => null,
})

const gradebooksRedirectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/gradebooks',
    beforeLoad: () => {
        throw redirect({ to: '/classrooms', search: { tab: 'gradebook' } })
    },
    component: () => null,
})

const assessmentsRedirectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/assessments',
    beforeLoad: () => {
        throw redirect({ to: '/classrooms', search: { tab: 'gradebook' } })
    },
    component: () => null,
})

const examsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/exams',
    component: ExamsModule,
})

const examDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/exams/$examId',
    component: ExamDetailModule,
})

const gradeLevelsRedirectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/grade-levels',
    beforeLoad: () => {
        throw redirect({ to: '/curriculum' })
    },
    component: () => null,
})

const coursesRedirectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/courses',
    beforeLoad: () => {
        throw redirect({ to: '/curriculum' })
    },
    component: () => null,
})

const standardsRedirectRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/standards',
    beforeLoad: () => {
        throw redirect({ to: '/curriculum' })
    },
    component: () => null,
})

// Section roster management
const sectionRosterRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/sections/$sectionId/roster',
    component: SectionRosterPage,
})

// Bulk rostering matrix
const rosteringRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/rostering',
    component: BulkRosteringPage,
})

// Curriculum - Consolidated view of courses, grade levels, and standards
const curriculumRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/curriculum',
    component: CurriculumModule,
})

// Course detail - individual course view
const courseDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/curriculum/$courseId',
    component: CourseDetailPage,
})

// ============================================================================
// ROUTE TREE
// ============================================================================

const routeTree = rootRoute.addChildren([
    indexRoute,
    studentsRoute,
    studentEnrollmentRoute,
    studentProfileRoute,
    studentProfilesRoute,
    studentIemisImportRoute,
    reportsGovernmentRoute,
    teachersRoute,
    calendarRoute,
    // Classrooms (nested tree)
    classroomsLayoutRoute.addChildren([
        classroomsIndexRoute,
        classroomsCreateRoute,
        reportCardRoute,
        classroomDetailRoute.addChildren([
            classroomEditRoute,
        ]),
    ]),
    // Legacy redirects
    schedulingRedirectRoute,
    schedulingDetailRedirectRoute,
    gradesRedirectRoute,
    attendanceRedirectRoute,
    attendanceDashboardRedirectRoute,
    schedulesRedirectRoute,
    timetablesRedirectRoute,
    gradebooksRedirectRoute,
    assessmentsRedirectRoute,
    examsRoute,
    examDetailRoute,
    gradeLevelsRedirectRoute,
    coursesRedirectRoute,
    standardsRedirectRoute,
    // Other routes
    sectionRosterRoute,
    rosteringRoute,
    curriculumRoute,
    courseDetailRoute,
])

/**
 * createRouter Factory
 * Uses 'memory' history by default to behave well within Shell,
 * but syncs with browser URL if basepath allows.
 */
export const router = createRouter({
    routeTree,
    basepath: '/academics', // IMPORTANT: Matches Shell mount point
    defaultNotFoundComponent: () => <MfeNotFoundBoundary mfe="academics" />, // M0.5 — was () => null which hid cross-MFE nav bugs
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
