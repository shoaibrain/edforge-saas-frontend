/**
 * Analytics Router Configuration
 * 
 * Defines the internal routing for the Analytics micro-frontend.
 * The Shell's AppShell handles all layout concerns (Header, Sidebar).
 */

import {
    createRouter,
    createRoute,
    createRootRoute,
    Outlet,
} from '@tanstack/react-router'
import { AnalyticsLayout } from './layouts/AnalyticsLayout'
import { Overview } from './routes/overview'

// ============================================================================
// ROOT ROUTE
// ============================================================================

const rootRoute = createRootRoute({
    component: () => (
        <AnalyticsLayout>
            <Outlet />
        </AnalyticsLayout>
    ),
})

// Overview (Index)
const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Overview,
})

// Placeholder routes
const enrollmentRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/enrollment',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Enrollment Analytics</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Enrollment trends and projections coming soon...</p>
        </div>
    ),
})

const attendanceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/attendance',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Attendance Analytics</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Attendance trends and patterns coming soon...</p>
        </div>
    ),
})

const performanceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/performance',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Academic Performance</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Academic performance analytics coming soon...</p>
        </div>
    ),
})

const financeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/finance',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Financial Analytics</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Financial reports and forecasts coming soon...</p>
        </div>
    ),
})

const reportsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/reports',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Custom Reports</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Custom report builder coming soon...</p>
        </div>
    ),
})

const dashboardsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboards',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Dashboards</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Custom dashboards coming soon...</p>
        </div>
    ),
})

const routeTree = rootRoute.addChildren([
    indexRoute,
    enrollmentRoute,
    attendanceRoute,
    performanceRoute,
    financeRoute,
    reportsRoute,
    dashboardsRoute,
])

export const router = createRouter({
    routeTree,
    basepath: '/analytics',
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

