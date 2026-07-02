/**
 * WidgetShell — shared card chrome for the Attendance dashboard's monitoring
 * widgets (at-risk, day-of-week, grade comparison, 30-day trend). Mirrors the
 * prototype's .widget/.w-head/.w-body with semantic tokens only. The
 * Sections-to-record widget keeps a bespoke head (folded coverage band) and does
 * not use this shell.
 */

import type { ReactNode } from 'react'

interface WidgetShellProps {
  icon?: ReactNode
  title: string
  subtitle?: string
  right?: ReactNode
  children: ReactNode
  className?: string
}

export function WidgetShell({ icon, title, subtitle, right, children, className = '' }: WidgetShellProps) {
  return (
    <section className={`flex flex-col rounded-xl border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))] ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-[rgb(var(--border-primary)/0.3)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon && <span className="shrink-0 text-[rgb(var(--text-secondary))]">{icon}</span>}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{title}</div>
            {subtitle && <div className="truncate text-2xs text-[rgb(var(--text-tertiary))]">{subtitle}</div>}
          </div>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      <div className="flex-1 p-4">{children}</div>
    </section>
  )
}
