/**
 * NoCurrentAcademicYearEmptyState
 *
 * Shared empty state rendered when a school has no academic year designated
 * as `isCurrent=true`. The backend `/academic-years/current` endpoint returns
 * 404 in this case and several tabs (Gradebook, Attendance, Grading Policies)
 * depend on a current year being present.
 *
 * Why: the absence of a current AY is operationally normal during initial
 * school setup, AND a recoverable drift state caused by a backend gap that
 * Sprint 4 closes. In both cases the UI should communicate the state plainly
 * rather than crashing or spinning. See
 * docs/academic-year-current-flag-bug/sprint-plan.md.
 */

import { GraduationCap } from 'lucide-react'

export interface NoCurrentAcademicYearEmptyStateProps {
  /** Headline displayed in the empty state. */
  message?: string
  /** Body copy below the headline. */
  secondaryMessage?: string
  /** Visual treatment. `prominent` for top-level page contexts, `subtle` for nested contexts. */
  variant?: 'prominent' | 'subtle'
  /** Optional action link href (e.g. school academic-setup page). When provided, renders an action link below the body. */
  actionHref?: string
  /** Action link label. Required when `actionHref` is provided. */
  actionLabel?: string
}

const DEFAULT_MESSAGE = 'No Academic Year Configured'
const DEFAULT_SECONDARY = 'Set up an academic year in school settings before recording grades.'

export function NoCurrentAcademicYearEmptyState({
  message = DEFAULT_MESSAGE,
  secondaryMessage = DEFAULT_SECONDARY,
  variant = 'prominent',
  actionHref,
  actionLabel,
}: NoCurrentAcademicYearEmptyStateProps) {
  const containerClass =
    variant === 'prominent'
      ? 'bg-caramel-50/40 dark:bg-caramel-500/8 rounded-xl border border-caramel-300/25 dark:border-caramel-400/15 p-12 text-center'
      : 'bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center'

  const iconClass =
    variant === 'prominent'
      ? 'w-12 h-12 mx-auto text-golden-400 mb-4'
      : 'w-12 h-12 mx-auto text-text-tertiary mb-4'

  return (
    <div className={containerClass} role="status" aria-live="polite">
      <GraduationCap className={iconClass} />
      <h4 className="text-lg font-medium text-text-primary mb-2">{message}</h4>
      <p className="text-text-secondary max-w-md mx-auto">{secondaryMessage}</p>
      {actionHref && actionLabel && (
        <a
          href={actionHref}
          className="inline-flex items-center mt-4 px-4 py-2 text-sm font-medium text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--text-primary))]  dark:hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          {actionLabel}
        </a>
      )}
    </div>
  )
}
