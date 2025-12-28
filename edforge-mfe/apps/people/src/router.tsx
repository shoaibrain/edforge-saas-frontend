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
import { DepartmentsModule } from './routes/departments'
import { RolesModule } from './routes/roles'
import { SettingsModule } from './routes/settings'
import { AnalyticsModule } from './routes/analytics'
import { HRAdminModule } from './routes/hr'

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
    component: DepartmentsModule,
})

const rolesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/roles',
    component: RolesModule,
})

const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: SettingsModule,
})

const analyticsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/analytics',
    component: AnalyticsModule,
})

// HR Admin - Consolidated Payroll/Contracts/PD/Reviews
const hrRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/hr',
    component: HRAdminModule,
})

const routeTree = rootRoute.addChildren([
    indexRoute,
    staffRoute,
    newPersonRoute,
    departmentsRoute,
    rolesRoute,
    settingsRoute,
    analyticsRoute,
    hrRoute,
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
