/**
 * V2AlertItem — Styled alert item for V2 pages
 *
 * Supports critical, warning, and info severities with
 * V2 token-based styling and optional CTA button.
 */

import type { ReactNode } from 'react'

const SEVERITY_CONFIG = {
  critical: {
    bg: 'rgba(226, 75, 74, 0.07)',
    border: 'rgba(226, 75, 74, 0.18)',
    titleColor: '#f09595',
    countColor: '#E24B4A',
    iconBg: 'rgba(226, 75, 74, 0.15)',
    iconColor: '#E24B4A',
    ctaBg: 'rgba(226, 75, 74, 0.08)',
    ctaBorder: 'rgba(226, 75, 74, 0.30)',
    ctaColor: '#E24B4A',
  },
  warning: {
    bg: 'rgba(239, 159, 39, 0.07)',
    border: 'rgba(239, 159, 39, 0.18)',
    titleColor: '#FAC775',
    countColor: '#EF9F27',
    iconBg: 'rgba(239, 159, 39, 0.15)',
    iconColor: '#EF9F27',
    ctaBg: 'rgba(239, 159, 39, 0.08)',
    ctaBorder: 'rgba(239, 159, 39, 0.30)',
    ctaColor: '#EF9F27',
  },
  info: {
    bg: 'rgba(55, 138, 221, 0.07)',
    border: 'rgba(55, 138, 221, 0.18)',
    titleColor: '#85B7EB',
    countColor: '#378ADD',
    iconBg: 'rgba(55, 138, 221, 0.15)',
    iconColor: '#378ADD',
    ctaBg: 'rgba(55, 138, 221, 0.08)',
    ctaBorder: 'rgba(55, 138, 221, 0.30)',
    ctaColor: '#378ADD',
  },
}

export interface V2AlertItemProps {
  severity: 'critical' | 'warning' | 'info'
  title: string
  subtitle: string
  count?: number
  icon?: ReactNode
  cta?: { label: string; onClick: () => void }
}

export function V2AlertItem({
  severity,
  title,
  subtitle,
  count,
  icon,
  cta,
}: V2AlertItemProps) {
  const config = SEVERITY_CONFIG[severity]

  return (
    <div
      // allow-presentation-style: alert bg/border are severity-driven (config)
      className="flex items-center gap-3 rounded-[10px] border"
      style={{
        padding: '11px 14px',
        background: config.bg,
        borderColor: config.border,
      }}
      role="alert"
    >
      {/* Icon */}
      {icon && (
        <div
          // allow-presentation-style: icon chip background is severity-driven (config)
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: config.iconBg,
          }}
        >
          <div
            // allow-presentation-style: icon fill is severity-driven (config)
            style={{ color: config.iconColor }}
            className="w-3.5 h-3.5 flex items-center justify-center"
          >
            {icon}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          // allow-presentation-style: title color is severity-driven (config)
          className="text-xs font-medium truncate"
          style={{ color: config.titleColor }}
        >
          {title}
        </p>
        <p className="text-xs mt-0.5 truncate text-[rgb(var(--text-disabled))]">
          {subtitle}
        </p>
      </div>

      {/* Count */}
      {count != null && (
        <span
          // allow-presentation-style: count color is severity-driven (config)
          className="text-sm font-semibold flex-shrink-0"
          style={{ color: config.countColor }}
        >
          {count}
        </span>
      )}

      {/* CTA button */}
      {cta && (
        <button
          onClick={cta.onClick}
          // allow-presentation-style: CTA colors are severity-driven (config)
          className="text-xs font-medium px-2.5 py-1 rounded-md border whitespace-nowrap flex-shrink-0 transition-opacity hover:opacity-80"
          style={{
            color: config.ctaColor,
            borderColor: config.ctaBorder,
            background: config.ctaBg,
          }}
        >
          {cta.label}
        </button>
      )}
    </div>
  )
}
