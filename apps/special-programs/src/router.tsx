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
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">IEPs</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">IEP management coming soon...</p>
        </div>
    ),
})

const iepsMeetingsRoute = createRoute({
    getParentRoute: () => iepsRoute,
    path: '/meetings',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">IEP Meetings</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">IEP meetings coming soon...</p>
        </div>
    ),
})

const iepsGoalsRoute = createRoute({
    getParentRoute: () => iepsRoute,
    path: '/goals',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Goals & Objectives</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">IEP goals and objectives coming soon...</p>
        </div>
    ),
})

// 504 Plans
const plans504Route = createRoute({
    getParentRoute: () => rootRoute,
    path: '/504-plans',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">504 Plans</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">504 Plans management coming soon...</p>
        </div>
    ),
})

// Accommodations
const accommodationsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/accommodations',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Accommodations</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Accommodations management coming soon...</p>
        </div>
    ),
})

// Accessibility
const accessibilityRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/accessibility',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Accessibility Services</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Accessibility services coming soon...</p>
        </div>
    ),
})

// Counseling
const counselingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/counseling',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Counseling</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Counseling services coming soon...</p>
        </div>
    ),
})

// Interventions
const interventionsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/interventions',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Interventions</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Interventions management coming soon...</p>
        </div>
    ),
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
    defaultNotFoundComponent: () => null, // Shell handles 404 UI
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
