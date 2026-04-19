/**
 * @edforge/types
 *
 * Shared TypeScript type definitions for the EdForge EMIS platform.
 */

// Auth types
export * from './auth'

// Tenant types
export * from './tenant'

// Person types
export * from './person'

// Billing types (fee structures, invoices, student accounts)
export * from './billing'

// Payment types (gateways, payments, receipts)
export * from './payment'

// Finance utilities (formatters for fee types, gateways, statuses, dates)
export * from './finance-utils'

// Academics utilities (attendance color, grade sorting/formatting)
export * from './academics-utils'

// Analytics API contract (re-export from @aibrains/shared-types/schemas/analytics)
export * from './analytics'

