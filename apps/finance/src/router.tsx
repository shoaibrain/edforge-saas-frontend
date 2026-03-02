/**
 * Finance Router Configuration
 *
 * Defines the internal routing for the Finance micro-frontend.
 * Includes billing sub-routes (invoices, payments, accounts) and dashboard.
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
import { BillingModule } from './routes/billing'
import InvoicesPage from './routes/billing/invoices/index'
import InvoiceDetailPage from './routes/billing/invoices/$invoiceId'
import BulkInvoicesPage from './routes/billing/invoices/bulk-generate'
import PaymentsPage from './routes/billing/payments/index'
import RecordPaymentPage from './routes/billing/payments/record'
import StudentAccountsPage from './routes/billing/accounts/index'
import FinancialDashboardPage from './routes/dashboard/index'

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

// Billing Overview
const billingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/billing',
    component: BillingModule,
})

// Billing > Invoices List
const invoicesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/billing/invoices',
    component: InvoicesPage,
})

// Billing > Invoice Detail
const invoiceDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/billing/invoices/$invoiceId',
    component: InvoiceDetailPage,
})

// Billing > Bulk Generate Invoices
const bulkGenerateRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/billing/invoices/bulk-generate',
    component: BulkInvoicesPage,
})

// Billing > Payments List
const paymentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/billing/payments',
    component: PaymentsPage,
})

// Billing > Record Payment
const recordPaymentRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/billing/payments/record',
    component: RecordPaymentPage,
})

// Billing > Student Accounts
const accountsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/billing/accounts',
    component: StudentAccountsPage,
})

// Financial Dashboard
const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard',
    component: FinancialDashboardPage,
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
    bulkGenerateRoute,  // Must be before invoiceDetailRoute so /bulk-generate matches before /$invoiceId
    invoicesRoute,
    invoiceDetailRoute,
    paymentsRoute,
    recordPaymentRoute,
    accountsRoute,
    dashboardRoute,
    ledgerRoute,
])

/**
 * createRouter Factory
 */
export const router = createRouter({
    routeTree,
    basepath: '/finance', // IMPORTANT: Matches Shell mount point
    defaultNotFoundComponent: () => null, // Shell handles 404 UI
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
