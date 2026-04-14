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
import { ComparisonsModule } from './routes/comparisons'
import { CustomReportsModule } from './routes/custom'

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

const enrollmentRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/enrollment',
    component: () => null,
})

const attendanceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/attendance',
    component: () => null,
})

const performanceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/performance',
    component: () => null,
})

const financeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/finance',
    component: () => null,
})

// Comparative Analysis
const comparisonsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/comparisons',
    component: ComparisonsModule,
})

// Custom Reports
const customReportsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/custom',
    component: CustomReportsModule,
})

// Legacy reports route (redirect to custom)
const reportsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/reports',
    component: CustomReportsModule,
})

const dashboardsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboards',
    component: () => null,
})

const routeTree = rootRoute.addChildren([
    indexRoute,
    enrollmentRoute,
    attendanceRoute,
    performanceRoute,
    financeRoute,
    comparisonsRoute,
    customReportsRoute,
    reportsRoute,
    dashboardsRoute,
])

export const router = createRouter({
    routeTree,
    basepath: '/analytics',
    defaultNotFoundComponent: () => null, // Shell handles 404 UI
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
