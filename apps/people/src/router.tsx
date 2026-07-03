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
import { MfeNotFoundBoundary } from '@edforge/ui'
import { PeopleLayout } from './layouts/PeopleLayout'
import { Overview } from './routes/overview'
import StaffPage from './routes/staff'
import StaffDetailPage from './routes/staff/detail'
import StaffNewPage from './routes/staff/new'
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

// Staff Creation Wizard
const staffNewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/staff/new',
    component: StaffNewPage,
})

// Staff Detail
const staffDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/staff/$staffId',
    component: StaffDetailPage,
})

// New Person
const newPersonRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/new',
    component: NewPersonPage,
})

const routeTree = rootRoute.addChildren([
    indexRoute,
    staffRoute,
    staffNewRoute,
    staffDetailRoute,
    newPersonRoute,
])

export const router = createRouter({
    routeTree,
    basepath: '/people',
    defaultNotFoundComponent: () => <MfeNotFoundBoundary mfe="people" />, // M0.5 — was () => null which hid cross-MFE nav bugs
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
