import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils'

export interface ContextBarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Left-aligned operating context the breadcrumb can't carry — e.g. active
   * school, academic year, today's date. Compose with `ContextBarSep` /
   * `ContextBarYear` for the platform-standard look.
   */
  meta: ReactNode
  /** Optional secondary line under the meta row (e.g. an insight strip). */
  description?: ReactNode
  /** Right-aligned page actions (1–2 buttons; primary last). */
  actions?: ReactNode
  /**
   * Render the bottom hairline divider. Default true. Set false when the bar
   * sits directly above another separated element (e.g. a tab bar) that already
   * provides the visual break.
   */
  divider?: boolean
}

/**
 * ContextBar — the top region of every operator module page.
 *
 * Replaces redundant per-page title headers: the breadcrumb in the shell topbar
 * is the page's wayfinding, so the page opens with operating *context* (school ·
 * year · date) and its actions instead of repeating its own name.
 */
export const ContextBar = forwardRef<HTMLDivElement, ContextBarProps>(
  ({ className, meta, description, actions, divider = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        divider && 'border-b border-[rgb(var(--border-primary)/0.2)] pb-4',
        className,
      )}
      {...props}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-[rgb(var(--text-secondary))]">
          {meta}
        </div>
        {description ? <div className="min-w-0">{description}</div> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  ),
)

ContextBar.displayName = 'ContextBar'

/** Dot separator between context items. */
export function ContextBarSep() {
  return <span className="text-[rgb(var(--text-tertiary))]">·</span>
}

/** Academic-year context item with a leading accent pip. */
export function ContextBarYear({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-medium">
      <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent-academics))]" />
      {children}
    </span>
  )
}
