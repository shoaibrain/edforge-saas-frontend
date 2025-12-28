/**
 * Finance Router Configuration
 * 
 * Defines the internal routing for the Finance micro-frontend.
 */

import {
    createRouter,
    createRoute,
    createRootRoute,
    Outlet,
} from '@tanstack/react-router'
import { FinanceLayout } from './layouts/FinanceLayout'
import { Overview } from './routes/overview'
import { LedgerModule } from './routes/ledger'

// ============================================================================
// ROOT ROUTE
// ============================================================================

const rootRoute = createRootRoute({
    component: () => (
        <FinanceLayout>
            <Outlet />
        </FinanceLayout>
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

// Billing
const billingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/billing',
    component: () => <div className="p-8 text-center text-text-secondary">Billing Module</div>,
})

// Payroll
const payrollRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/payroll',
    component: () => <div className="p-8 text-center text-text-secondary">Payroll Module</div>,
})

// Tuition
const tuitionRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/tuition',
    component: () => <div className="p-8 text-center text-text-secondary">Tuition Module</div>,
})

// Expenses
const expensesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/expenses',
    component: () => <div className="p-8 text-center text-text-secondary">Expenses Module</div>,
})

// Ledger - Consolidated GL/AP/AR view
const ledgerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/ledger',
    component: LedgerModule,
})

// ============================================================================
// ROUTE TREE
// ============================================================================

const routeTree = rootRoute.addChildren([
    indexRoute,
    billingRoute,
    payrollRoute,
    tuitionRoute,
    expensesRoute,
    ledgerRoute,
])

/**
 * createRouter Factory
 */
export const router = createRouter({
    routeTree,
    basepath: '/finance', // IMPORTANT: Matches Shell mount point
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
