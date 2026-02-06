/**
 * Academics Router Configuration
 * 
 * Defines the internal routing for the Academics micro-frontend.
 */

import {
    createRouter,
    createRoute,
    createRootRoute,
    Outlet,
} from '@tanstack/react-router'
import { AcademicsLayout } from './layouts/AcademicsLayout'
import { Overview } from './routes/overview'
import { AttendanceModule } from './routes/attendance'
import { StudentsModule } from './routes/students'
import { StudentProfilePage } from './routes/students/$studentId'
import { TeachersModule } from './routes/teachers'
import { GradebookModule } from './routes/gradebook'
import { EnrollmentModule } from './routes/enrollment'
import { StudentProfilesModule } from './routes/students/profiles'
import { ClassroomsModule } from './routes/classrooms'
import { SchedulesModule } from './routes/schedules'
import { TimetablesModule } from './routes/timetables'
import { GradeLevelsModule } from './routes/grade-levels'
import { CoursesModule } from './routes/courses'
import { StandardsModule } from './routes/standards'
import { AssessmentsModule } from './routes/assessments'
import { ExamsModule } from './routes/exams'
import { CalendarModule } from './routes/calendar'
import { GradesModule } from './routes/grades'
import { SchedulingModule } from './routes/scheduling'
import { CurriculumModule } from './routes/curriculum'

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

// Teachers
const teachersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/teachers',
    component: TeachersModule,
})

// Classes & Scheduling
const classroomsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/classrooms',
    component: ClassroomsModule,
})

const schedulesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/schedules',
    component: SchedulesModule,
})

const timetablesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/timetables',
    component: TimetablesModule,
})

// Curriculum
const gradeLevelsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/grade-levels',
    component: GradeLevelsModule,
})

const coursesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/courses',
    component: CoursesModule,
})

const standardsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/standards',
    component: StandardsModule,
})

// Assessment
const gradebooksRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/gradebooks',
    component: GradebookModule,
})

const assessmentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/assessments',
    component: AssessmentsModule,
})

const examsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/exams',
    component: ExamsModule,
})

// Tracking
const attendanceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/attendance',
    component: AttendanceModule,
})

const calendarRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/calendar',
    component: CalendarModule,
})

// ============================================================================
// CONSOLIDATED ROUTES (Workflow-Oriented)
// These new routes map to the simplified sidebar navigation
// ============================================================================

// Grades & Assessments - Consolidated view of gradebooks, assessments, and exams
const gradesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/grades',
    component: GradesModule,
})

// Scheduling - Consolidated view of schedules, timetables, and classrooms
const schedulingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/scheduling',
    component: SchedulingModule,
})

// Curriculum - Consolidated view of courses, grade levels, and standards
const curriculumRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/curriculum',
    component: CurriculumModule,
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
    teachersRoute,
    classroomsRoute,
    schedulesRoute,
    timetablesRoute,
    gradeLevelsRoute,
    coursesRoute,
    standardsRoute,
    gradebooksRoute,
    assessmentsRoute,
    examsRoute,
    attendanceRoute,
    calendarRoute,
    // Consolidated routes
    gradesRoute,
    schedulingRoute,
    curriculumRoute,
])

/**
 * createRouter Factory
 * Uses 'memory' history by default to behave well within Shell,
 * but syncs with browser URL if basepath allows.
 */
export const router = createRouter({
    routeTree,
    basepath: '/academics', // IMPORTANT: Matches Shell mount point
    defaultNotFoundComponent: () => null, // Shell handles 404 UI
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
