/**
 * Special Programs Router Configuration
 * 
 * Defines the internal routing for the Special Programs micro-frontend.
 * The Shell's AppShell handles all layout concerns (Header, Sidebar).
 */

import {
    createRouter,
    createRoute,
    createRootRoute,
    Outlet,
} from '@tanstack/react-router'
import { MfeNotFoundBoundary } from '@edforge/ui'
import { Overview } from './routes/overview'

// ============================================================================
// ROOT ROUTE - Passthrough layout (no embedded header)
// ============================================================================

const rootRoute = createRootRoute({
    component: () => <Outlet />,
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

// IEPs
const iepsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/ieps',
    component: () => null,
})

const iepsMeetingsRoute = createRoute({
    getParentRoute: () => iepsRoute,
    path: '/meetings',
    component: () => null,
})

const iepsGoalsRoute = createRoute({
    getParentRoute: () => iepsRoute,
    path: '/goals',
    component: () => null,
})

// 504 Plans
const plans504Route = createRoute({
    getParentRoute: () => rootRoute,
    path: '/504-plans',
    component: () => null,
})

// Accommodations
const accommodationsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/accommodations',
    component: () => null,
})

// Accessibility
const accessibilityRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/accessibility',
    component: () => null,
})

// Counseling
const counselingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/counseling',
    component: () => null,
})

// Interventions
const interventionsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/interventions',
    component: () => null,
})

// ============================================================================
// ROUTE TREE
// ============================================================================

const routeTree = rootRoute.addChildren([
    indexRoute,
    iepsRoute.addChildren([
        iepsMeetingsRoute,
        iepsGoalsRoute,
    ]),
    plans504Route,
    accommodationsRoute,
    accessibilityRoute,
    counselingRoute,
    interventionsRoute,
])

export const router = createRouter({
    routeTree,
    basepath: '/special-programs',
    defaultNotFoundComponent: () => <MfeNotFoundBoundary mfe="special-programs" />, // M0.5 — was () => null which hid cross-MFE nav bugs
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
