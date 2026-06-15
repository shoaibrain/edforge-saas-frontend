/**
 * FinancePageHeader — finance page header built on the shared ContextBar.
 *
 * The page title is rendered only as a visually-hidden <h1> (for assistive tech /
 * heading navigation); visually the title is dropped because the shell breadcrumb
 * carries it (e.g. "Home › Finance › Invoices"), matching the academics rollout
 * pattern. `meta` shows the operating date, the subtitle becomes the ContextBar
 * description, and per-page actions are preserved.
 */

import { ContextBar } from '@edforge/ui'

export interface FinancePageHeaderProps {
  title: string
  subtitle: string
  actions?: React.ReactNode
}

export function FinancePageHeader({ title, subtitle, actions }: FinancePageHeaderProps) {
  return (
    <>
      <h1 className="sr-only">{title}</h1>
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
    </>
  )
}
