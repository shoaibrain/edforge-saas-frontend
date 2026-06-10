/**
 * FinancePageHeader — V2 page header with icon square, title, and subtitle.
 *
 * Matches the V2 design pattern from the Finance Overview page header.
 */

import type { LucideIcon } from 'lucide-react'

export interface FinancePageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle: string
  accentColor: string
  iconColor: string
  actions?: React.ReactNode
}

export function FinancePageHeader({
  icon: Icon,
  title,
  subtitle,
  accentColor,
  iconColor,
  actions,
}: FinancePageHeaderProps) {
  return (
    <div className="flex items-center justify-between" style={{ minHeight: 44 }}>
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div
            // allow-presentation-style: per-page accent tint passed as prop
            className="w-7 h-7 rounded-[7px] flex items-center justify-center"
            style={{ background: accentColor }}
          >
            <Icon
              // allow-presentation-style: per-page icon color passed as prop
              className="w-4 h-4"
              style={{ color: iconColor }}
            />
          </div>
          <h1 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            {title}
          </h1>
        </div>
        <p className="text-xs text-[rgb(var(--text-tertiary))]">
          {subtitle}
        </p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
