import type { ReactNode } from 'react'
import { Bdi } from './Bdi'
import { cn } from '../utils'

export interface MoneyProps {
  /**
   * A pre-formatted currency string, e.g. from `useCurrency().format(amount)`
   * or `formatCurrency(...)` — "NPR 1,50,000.00", "रू १,५०,०००.००", etc.
   */
  children: ReactNode
  className?: string
}

/**
 * Money — display atom for a pre-formatted currency amount.
 *
 * Renders the amount as a bidi-isolated, tabular-figures LTR island so its
 * "symbol grouping.decimals" order is preserved inside RTL (Arabic) content.
 * A no-op visually in LTR locales, so it is always safe to use. For currency
 * that is interpolated into a translated sentence, annotate the placeholder
 * with the `isolate` format instead (`"{{amount, isolate}}"`).
 */
export function Money({ children, className }: MoneyProps) {
  return <Bdi className={cn('tabular-nums', className)}>{children}</Bdi>
}
