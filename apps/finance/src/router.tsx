/**
 * Finance Router Configuration
 *
 * Defines the internal routing for the Finance micro-frontend.
 * Routes are flat (no /billing/ prefix) with legacy redirects for old paths.
 */

import {
    createRouter,
    createRoute,
    createRootRoute,
    redirect,
    Outlet,
} from '@tanstack/react-router'
import { MfeNotFoundBoundary } from '@edforge/ui'
import { FinanceLayout } from './layouts/FinanceLayout'
import { Overview } from './routes/overview'
import InvoicesPage from './routes/billing/invoices/index'
import InvoiceDetailPage from './routes/billing/invoices/$invoiceId'
import BulkInvoicesPage from './routes/billing/invoices/bulk-generate'
import PaymentsPage from './routes/billing/payments/index'
import RecordPaymentPage from './routes/billing/payments/record'
import FinanceReceiptPage from './routes/billing/payments/receipt'
import StudentAccountsPage from './routes/billing/accounts/index'
import FeeStructuresPage from './routes/configuration/fee-structures'
import PaymentGatewaysPage from './routes/configuration/payment-gateways'

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
// ROUTES (flat — no /billing/ prefix)
// ============================================================================

// Overview (Index)
const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Overview,
})

// Invoices List
const invoicesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/invoices',
    component: InvoicesPage,
})

// Invoice Detail
const invoiceDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/invoices/$invoiceId',
    component: InvoiceDetailPage,
})

// Bulk Generate Invoices
const bulkGenerateRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/invoices/bulk-generate',
    component: BulkInvoicesPage,
})

// Payments List
const paymentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/payments',
    component: PaymentsPage,
})

// Record Payment
const recordPaymentRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/payments/record',
    component: RecordPaymentPage,
})

// Receipt Detail (M1.5-FU.2 — moved from shell). The optional `invoiceId`
// search param carries the originating invoice so the page can render a
// "Back to invoice" link + invoice deep-link on the paper document.
const receiptRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/payments/$paymentId/receipt',
    component: FinanceReceiptPage,
    validateSearch: (search: Record<string, unknown>): { invoiceId?: string } => ({
        invoiceId: typeof search.invoiceId === 'string' ? search.invoiceId : undefined,
    }),
})

// Student Accounts
const accountsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/accounts',
    component: StudentAccountsPage,
})

// Configuration > Fee Structures
const feeStructuresRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/configuration/fee-structures',
    component: FeeStructuresPage,
})

// Configuration > Payment Gateways
const paymentGatewaysRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/configuration/payment-gateways',
    component: PaymentGatewaysPage,
})

// ============================================================================
// LEGACY REDIRECTS
// ============================================================================

// /dashboard → / (merged into Overview)
const dashboardRedirect = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard',
    beforeLoad: () => { throw redirect({ to: '/' }) },
})

// /billing → /invoices (landing page removed, prefix flattened)
const billingRedirect = createRoute({
    getParentRoute: () => rootRoute,
    path: '/billing',
    beforeLoad: () => { throw redirect({ to: '/invoices' }) },
})

// /billing/invoices → /invoices
const billingInvoicesRedirect = createRoute({
    getParentRoute: () => rootRoute,
    path: '/billing/invoices',
    beforeLoad: () => { throw redirect({ to: '/invoices' }) },
})

// /billing/payments → /payments
const billingPaymentsRedirect = createRoute({
    getParentRoute: () => rootRoute,
    path: '/billing/payments',
    beforeLoad: () => { throw redirect({ to: '/payments' }) },
})

// /billing/accounts → /accounts
const billingAccountsRedirect = createRoute({
    getParentRoute: () => rootRoute,
    path: '/billing/accounts',
    beforeLoad: () => { throw redirect({ to: '/accounts' }) },
})

// ============================================================================
// ROUTE TREE
// ============================================================================

const routeTree = rootRoute.addChildren([
    indexRoute,
    bulkGenerateRoute,  // Must be before invoiceDetailRoute so /bulk-generate matches before /$invoiceId
    invoicesRoute,
    invoiceDetailRoute,
    paymentsRoute,
    recordPaymentRoute,
    receiptRoute,
    accountsRoute,
    feeStructuresRoute,
    paymentGatewaysRoute,
    // Legacy redirects
    dashboardRedirect,
    billingRedirect,
    billingInvoicesRedirect,
    billingPaymentsRedirect,
    billingAccountsRedirect,
])

/**
 * createRouter Factory
 */
export const router = createRouter({
    routeTree,
    basepath: '/finance', // IMPORTANT: Matches Shell mount point
    defaultNotFoundComponent: () => <MfeNotFoundBoundary mfe="finance" />, // M0.5 — was () => null which hid cross-MFE nav bugs
})

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
