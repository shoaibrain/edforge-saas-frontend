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
// We will create this layout component
import { AcademicsLayout } from './layouts/AcademicsLayout'
import { Overview } from './routes/overview'
import { AttendanceModule } from './routes/attendance'
import { StudentsModule } from './routes/students'
import { TeachersModule } from './routes/teachers'
import { GradebookModule } from './routes/gradebook'
import { EnrollmentModule } from './routes/enrollment'

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

const studentProfilesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/students/profiles',
    component: () => <div className="p-8 text-center text-text-secondary">Student Profiles Module</div>,
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
    component: () => <div className="p-8 text-center text-text-secondary">Classrooms Module</div>,
})

const schedulesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/schedules',
    component: () => <div className="p-8 text-center text-text-secondary">Class Schedules Module</div>,
})

const timetablesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/timetables',
    component: () => <div className="p-8 text-center text-text-secondary">Timetables Module</div>,
})

// Curriculum
const gradeLevelsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/grade-levels',
    component: () => <div className="p-8 text-center text-text-secondary">Grade Levels Module</div>,
})

const coursesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/courses',
    component: () => <div className="p-8 text-center text-text-secondary">Courses Module</div>,
})

const standardsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/standards',
    component: () => <div className="p-8 text-center text-text-secondary">Standards Module</div>,
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
    component: () => <div className="p-8 text-center text-text-secondary">Assessments Module</div>,
})

const examsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/exams',
    component: () => <div className="p-8 text-center text-text-secondary">Exams Module</div>,
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
    component: () => <div className="p-8 text-center text-text-secondary">Academic Calendar Module</div>,
})

// ============================================================================
// ROUTE TREE
// ============================================================================

const routeTree = rootRoute.addChildren([
    indexRoute,
    studentsRoute,
    studentEnrollmentRoute,
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
])

/**
 * createRouter Factory
 * Uses 'memory' history by default to behave well within Shell,
 * but syncs with browser URL if basepath allows.
 */
export const router = createRouter({
    routeTree,
    basepath: '/academics', // IMPORTANT: Matches Shell mount point
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
