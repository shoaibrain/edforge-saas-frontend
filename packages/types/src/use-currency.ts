/**
 * useCurrency — convenience hook that pre-binds resolved settings to formatCurrency.
 *
 * Reduces boilerplate: `format(150000)` instead of `formatCurrency(150000, "NPR", { ... })`.
 */

import { useMemo } from 'react'
import { formatCurrency } from '@aibrains/shared-types/utils/currency'
import type { ResolvedSettings } from '@edforge/config/resolved-settings'

export function useCurrency(settings: ResolvedSettings) {
  return useMemo(() => ({
    /** Full format: "NPR 1,50,000.00" */
    format: (amount: number, opts?: { decimals?: number }) =>
      formatCurrency(amount, settings.currency, {
        decimals: opts?.decimals ?? 2,
      }),

    /** Compact format: "NPR 4.9L", "$150K" */
    formatCompact: (amount: number) =>
      formatCurrency(amount, settings.currency, { compact: true }),

    /** Short format: "NPR 1.5 lakh", "$150,000" */
    formatShort: (amount: number) =>
      formatCurrency(amount, settings.currency, { short: true }),
  }), [settings.currency])
}
