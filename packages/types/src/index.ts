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

// Billing types (fee structures, invoices, student accounts, agreements)
export * from './billing'

// Family types (families, siblings, members, open-invoices)
export * from './family'

// Payment types (gateways, payments, receipts)
export * from './payment'

// Finance utilities (formatters for fee types, gateways, statuses, dates)
export * from './finance-utils'

// Academics utilities (attendance color, grade sorting/formatting)
export * from './academics-utils'

// Analytics API contract (re-export from @aibrains/shared-types/schemas/analytics)
export * from './analytics'

// Workspace field governance (Sprint B) — canonical source is
// @aibrains/shared-types 0.28.0. Re-exported here so frontend consumers
// can keep a single `@edforge/types` import surface.
export {
  WORKSPACE_FIELD_LOCK_CLASS,
  isWorkspaceFieldLocked,
  classifyWorkspaceUpdate,
  type WorkspaceFieldLockClass,
  type FieldLockViolation,
  type WorkspaceLockHolder,
} from '@aibrains/shared-types'

