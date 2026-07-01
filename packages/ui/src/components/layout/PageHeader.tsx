import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn, focusRing } from '../../utils'
import { Heading } from '../typography/Heading'
import { Text } from '../typography/Text'

/**
 * PageHeader has three modes:
 *
 * - `titled` (default) — the classic title / description / actions / breadcrumbs
 *   header used by detail, settings, and form pages. Renders an <h1>.
 * - `pagebar` — the handoff operator surface ①: a year switcher + date on the
 *   left and page actions on the right, with NO <h1>/subtitle (the breadcrumb
 *   names the page, the StatBand summarizes it). Used by list/dashboard pages.
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
  /**
   * Academic-year label shown in the switcher chip (e.g. "2083"). Optional —
   * omit it for module overviews that aren't scoped to an academic year (e.g.
   * People), and the header renders date + actions only, no year chip.
   */
  year?: ReactNode
  /** Small trailing label after the year (default "Academic Year"). */
  yearLabel?: string
  /** When provided, the year chip becomes a switcher button. */
  onYearClick?: () => void
  /** Secondary date / context line (e.g. "Tuesday, Jun 30"). */
  date?: ReactNode
  /** Right-aligned page actions (primary last). */
  actions?: PageHeaderAction[]
  breadcrumbs?: ReactNode
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

const ChevronDown = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="text-[rgb(var(--text-tertiary))]"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
)

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
  ({ className, year, yearLabel = 'Academic Year', onYearClick, date, actions, breadcrumbs, mode: _mode, ...props }, ref) => {
    const yearChipClass = cn(
      'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm',
      'border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-primary))]',
      'transition-colors hover:border-[rgb(var(--border-strong))] hover:bg-[rgb(var(--background-tertiary))]',
    )
    const yearInner = (
      <>
        <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--border-focus))]" aria-hidden="true" />
        <b className="font-semibold tabular-nums">{year}</b>
        <span className="font-normal text-[rgb(var(--text-tertiary))]">{yearLabel}</span>
        {onYearClick ? <ChevronDown /> : null}
      </>
    )

    return (
      <div ref={ref} className={cn('flex flex-col gap-3', className)} {...props}>
        {breadcrumbs ? <div className="text-sm text-[rgb(var(--text-tertiary))]">{breadcrumbs}</div> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {year != null ? (
              onYearClick ? (
                <button type="button" onClick={onYearClick} title="Switch academic year" className={cn(yearChipClass, focusRing)}>
                  {yearInner}
                </button>
              ) : (
                <span className={yearChipClass}>{yearInner}</span>
              )
            ) : null}
            {date ? <span className="whitespace-nowrap text-sm text-[rgb(var(--text-tertiary))]">{date}</span> : null}
          </div>
          <PageActions actions={actions} />
        </div>
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
