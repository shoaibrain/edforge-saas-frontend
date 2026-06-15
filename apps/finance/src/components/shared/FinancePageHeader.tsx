/**
 * FinancePageHeader — finance page header built on the shared ContextBar.
 *
 * The in-body page title is intentionally dropped: the shell breadcrumb carries
 * it (e.g. "Home › Finance › Invoices"), matching the academics rollout pattern.
 * `meta` shows the operating date, the subtitle becomes the ContextBar
 * description, and per-page actions are preserved. `icon`, `title`, `accentColor`,
 * and `iconColor` remain on the prop type for call-site compatibility but are no
 * longer rendered.
 */

import type { LucideIcon } from 'lucide-react'
import { ContextBar } from '@edforge/ui'

export interface FinancePageHeaderProps {
  icon?: LucideIcon
  title?: string
  subtitle: string
  accentColor?: string
  iconColor?: string
  actions?: React.ReactNode
}

export function FinancePageHeader({ subtitle, actions }: FinancePageHeaderProps) {
  return (
    <ContextBar
      meta={
        <span>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      }
      description={<span>{subtitle}</span>}
      actions={actions}
    />
  )
}
