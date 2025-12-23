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
    component: () => <div className="p-8 text-center text-text-secondary">Students Module</div>,
})

// Teachers
const teachersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/teachers',
    component: () => <div className="p-8 text-center text-text-secondary">Teachers Module</div>,
})

// Attendance
const attendanceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/attendance',
    component: () => <div className="p-8 text-center text-text-secondary">Attendance Module</div>,
})

// Gradebook
const gradebookRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/gradebook',
    component: () => <div className="p-8 text-center text-text-secondary">Gradebook Module</div>,
})

// Enrollment
const enrollmentRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/enrollment',
    component: () => <div className="p-8 text-center text-text-secondary">Enrollment Module</div>,
})

// ============================================================================
// ROUTE TREE
// ============================================================================

const routeTree = rootRoute.addChildren([
    indexRoute,
    studentsRoute,
    teachersRoute,
    attendanceRoute,
    gradebookRoute,
    enrollmentRoute,
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
