/**
 * TenantDate — Sprint C4
 *
 * A presentational component (and matching hook) that renders an ISO date
 * string in the calendar system the active tenant has configured in
 * Workspace Settings (`regional.defaultCalendarSystem`).
 *
 * Why this exists:
 *
 *   Most date displays in the app use ad-hoc `toLocaleDateString('en-US')`
 *   calls, which always render Gregorian regardless of tenant. That's
 *   confusing for PABSON tenants who entered the date in Bikram Sambat
 *   on a BsDatePicker, then see it rendered back as "4/15/2026" — a
 *   different number system from the one they typed into.
 *
 *   This component centralizes the conversion. Drop it in anywhere a
 *   date is rendered (`<TenantDate value={year.startDate} />`) and it
 *   will respect the tenant's calendar setting. When `enableDualDateDisplay`
 *   is on, both BS and AD are shown so cross-team coordination stays easy.
 *
 * Scope (V1):
 *   Today this is wired into the Academic Setup screens only — that's the
 *   highest-confusion screen per the user's feedback. A wider audit and
 *   replacement of ad-hoc `toLocaleDateString` calls is queued as a
 *   follow-up sprint (C6 in the C4 plan).
 *
 * Renders `—` for null/undefined/invalid input so it can be used inline
 * without nullish-checks at every call site.
 */

import { formatDate } from '@edforge/date-utils'
import { useWorkspaceSettings } from '../../lib/shell-context'

export type TenantDateFormat = 'short' | 'medium' | 'long' | 'numeric'

/**
 * Hook: returns a function that formats an ISO date according to the
 * current tenant's workspace settings. For string interpolation (e.g.
 * `<title>${fmt(date)}</title>`) where a JSX component is awkward.
 */
export function useTenantDateFormat() {
  const settings = useWorkspaceSettings()
  const calendar = settings?.defaultCalendarSystem === 'bikram_sambat' ? 'bs' : 'ad'
  const dual = !!settings?.enableDualDateDisplay

  return (
    value: string | Date | null | undefined,
    format: TenantDateFormat = 'medium',
  ): string => {
    if (value === null || value === undefined || value === '') return '—'
    const primary = formatDate(value, { calendar, format })
    if (!dual || calendar === 'ad') return primary
    const ad = formatDate(value, { calendar: 'ad', format })
    return `${primary} (${ad})`
  }
}

/**
 * Component: drop-in replacement for `<span>{year.startDate}</span>` that
 * renders the date in the tenant's preferred calendar system.
 */
export function TenantDate({
  value,
  format = 'medium',
  className,
}: {
  value: string | Date | null | undefined
  format?: TenantDateFormat
  className?: string
}) {
  const fmt = useTenantDateFormat()
  return <span className={className}>{fmt(value, format)}</span>
}

/**
 * Component: render a date range "<start> – <end>" both formatted via
 * the tenant calendar. Convenience wrapper around two `TenantDate`s.
 */
export function TenantDateRange({
  start,
  end,
  format = 'medium',
  separator = ' – ',
  className,
}: {
  start: string | Date | null | undefined
  end: string | Date | null | undefined
  format?: TenantDateFormat
  separator?: string
  className?: string
}) {
  const fmt = useTenantDateFormat()
  return (
    <span className={className}>
      {fmt(start, format)}
      {separator}
      {fmt(end, format)}
    </span>
  )
}
