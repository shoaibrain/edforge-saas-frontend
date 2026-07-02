import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn, focusRing } from '../../utils'
import { Heading } from '../typography/Heading'
import { Text } from '../typography/Text'

/**
 * PageHeader has three modes:
 *
 * - `titled` (default) — the classic title / description / actions / breadcrumbs
 *   header used by detail, settings, and form pages. Renders an <h1>.
 * - `pagebar` — the handoff operator surface ①: right-aligned page actions with
 *   an optional breadcrumb row and NO <h1>/subtitle (the breadcrumb names the
 *   page, the StatBand summarizes it). Used by list/dashboard pages. The app is
 *   always scoped to the current academic year, so no year chip / date is shown.
 * - `greeting` — the Home dashboard variant: a "Good morning, {firstName} 👋"
 *   greeting on the left and page actions on the right. Same footprint/props
 *   shape as pagebar (actions[]), also with NO <h1>.
 *
 * `mode` is optional and defaults to `titled`, so existing `<PageHeader title=…>`
 * callers keep compiling unchanged.
 */
export interface PageHeaderTitledProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  mode?: 'titled'
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  breadcrumbs?: ReactNode
}

export interface PageHeaderAction {
  label: string
  icon?: ReactNode
  primary?: boolean
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
}

export interface PageHeaderPagebarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  mode: 'pagebar'
  /** Right-aligned page actions (primary last). */
  actions?: PageHeaderAction[]
  breadcrumbs?: ReactNode
  /**
   * Top-left header slot — the Attention Corner pill mounts here, balancing
   * the primary actions on the right (same row, same height).
   */
  attention?: ReactNode
}

export interface PageHeaderGreetingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  mode: 'greeting'
  /** Full greeting line, e.g. "Good morning, Shoaib". */
  greeting: ReactNode
  /** Show the waving-hand emoji after the greeting (default true). Gated on reduced-motion. */
  wave?: boolean
  /** Right-aligned page actions (primary last). */
  actions?: PageHeaderAction[]
  breadcrumbs?: ReactNode
}

export type PageHeaderProps =
  | PageHeaderTitledProps
  | PageHeaderPagebarProps
  | PageHeaderGreetingProps

/** Right-aligned page-action buttons, shared by pagebar + greeting modes. */
function PageActions({ actions }: { actions?: PageHeaderAction[] }) {
  if (!actions?.length) return null
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {actions.map((action, i) => (
        <button
          key={`${action.label}-${i}`}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          aria-label={action.ariaLabel ?? action.label}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors disabled:opacity-50',
            focusRing,
            action.primary
              ? 'bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))]'
              : 'border border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary))]',
          )}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  )
}

const PageBar = forwardRef<HTMLDivElement, PageHeaderPagebarProps>(
  ({ className, actions, breadcrumbs, attention, mode: _mode, ...props }, ref) => {
    // No year chip / date anymore — an empty pagebar renders nothing.
    if (!breadcrumbs && !actions?.length && !attention) return null
    return (
      <div ref={ref} className={cn('flex flex-col gap-3', className)} {...props}>
        {breadcrumbs ? <div className="text-sm text-[rgb(var(--text-tertiary))]">{breadcrumbs}</div> : null}
        {actions?.length || attention ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center">{attention}</div>
            <PageActions actions={actions} />
          </div>
        ) : null}
      </div>
    )
  },
)
PageBar.displayName = 'PageBar'

const GreetingHeader = forwardRef<HTMLDivElement, PageHeaderGreetingProps>(
  ({ className, greeting, wave = true, actions, breadcrumbs, mode: _mode, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-3', className)} {...props}>
      {breadcrumbs ? <div className="text-sm text-[rgb(var(--text-tertiary))]">{breadcrumbs}</div> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold text-[rgb(var(--text-primary))]">
            {greeting}
            {wave ? (
              <span className="ml-1.5 inline-block" role="img" aria-label="waving hand">
                👋
              </span>
            ) : null}
          </p>
        </div>
        <PageActions actions={actions} />
      </div>
    </div>
  ),
)
GreetingHeader.displayName = 'GreetingHeader'

const TitledHeader = forwardRef<HTMLDivElement, PageHeaderTitledProps>(
  ({ className, title, description, actions, breadcrumbs, mode: _mode, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-3', className)} {...props}>
      {breadcrumbs ? <div className="text-sm text-[rgb(var(--text-tertiary))]">{breadcrumbs}</div> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <Heading level={1} variant="page">
            {title}
          </Heading>
          {description ? (
            <Text variant="secondary" className="max-w-3xl">
              {description}
            </Text>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  ),
)
TitledHeader.displayName = 'TitledHeader'

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>((props, ref) => {
  if (props.mode === 'pagebar') {
    return <PageBar ref={ref} {...props} />
  }
  if (props.mode === 'greeting') {
    return <GreetingHeader ref={ref} {...props} />
  }
  return <TitledHeader ref={ref} {...props} />
})

PageHeader.displayName = 'PageHeader'
