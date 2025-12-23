/**
 * People Router Configuration
 * 
 * Defines the internal routing for the People micro-frontend.
 * The Shell's AppShell handles all layout concerns (Header, Sidebar).
 */

import {
    createRouter,
    createRoute,
    createRootRoute,
    Outlet,
} from '@tanstack/react-router'
import { PeopleLayout } from './layouts/PeopleLayout'
import { Overview } from './routes/overview'
import StaffPage from './routes/staff'
import NewPersonPage from './routes/new'

// ============================================================================
// ROOT ROUTE
// ============================================================================

const rootRoute = createRootRoute({
    component: () => (
        <PeopleLayout>
            <Outlet />
        </PeopleLayout>
    ),
})

// Overview (Index)
const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Overview,
})

// Staff Directory
const staffRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/staff',
    component: StaffPage,
})

// New Person
const newPersonRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/new',
    component: NewPersonPage,
})

// Placeholder routes (coming soon)
const departmentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/departments',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Departments</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Department management coming soon...</p>
        </div>
    ),
})

const rolesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/roles',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Roles & Permissions</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Roles configuration coming soon...</p>
        </div>
    ),
})

const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Profile Settings</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Profile settings coming soon...</p>
        </div>
    ),
})

const analyticsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/analytics',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">People Analytics</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Workforce analytics coming soon...</p>
        </div>
    ),
})

const routeTree = rootRoute.addChildren([
    indexRoute,
    staffRoute,
    newPersonRoute,
    departmentsRoute,
    rolesRoute,
    settingsRoute,
    analyticsRoute,
])

export const router = createRouter({
    routeTree,
    basepath: '/people',
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
