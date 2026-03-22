/**
 * Settings-aware currency formatting — re-exports from shared-types.
 *
 * This file re-exports the canonical `formatCurrency` from @aibrains/shared-types
 * so Finance and other frontend modules can import from @edforge/types without
 * needing a direct shared-types dependency.
 */

// Re-export the canonical implementation
export { formatCurrency } from '@aibrains/shared-types/utils/currency'
export type { CurrencyFormatOpts } from '@aibrains/shared-types/utils/currency'
