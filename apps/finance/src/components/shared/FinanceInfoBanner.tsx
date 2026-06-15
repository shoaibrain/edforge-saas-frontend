/**
 * FinanceInfoBanner — V2 contextual info/warning/danger/success banner.
 */

import { Info, AlertTriangle, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useState } from 'react'

export interface FinanceInfoBannerProps {
  variant: 'info' | 'warning' | 'danger' | 'success'
  message: string
  subtitle?: string
  action?: { label: string; onClick: () => void }
  dismissible?: boolean
}

const VARIANT_STYLES = {
  info: {
    box: 'bg-[rgb(var(--accent-academics)/0.06)] border-[rgb(var(--accent-academics)/0.12)]',
    fg: 'text-[rgb(var(--accent-academics-text))]',
    btnBg: 'bg-[rgb(var(--accent-academics))]',
    Icon: Info,
  },
  warning: {
    box: 'bg-[rgb(var(--accent-attendance)/0.06)] border-[rgb(var(--accent-attendance)/0.12)]',
    fg: 'text-[rgb(var(--accent-attendance-text))]',
    btnBg: 'bg-[rgb(var(--accent-attendance))]',
    Icon: AlertTriangle,
  },
  danger: {
    box: 'bg-[rgb(var(--accent-finance)/0.06)] border-[rgb(var(--accent-finance)/0.12)]',
    fg: 'text-[rgb(var(--accent-finance-text))]',
    btnBg: 'bg-[rgb(var(--accent-finance))]',
    Icon: AlertCircle,
  },
  success: {
    box: 'bg-[rgb(var(--accent-enrollment)/0.06)] border-[rgb(var(--accent-enrollment)/0.12)]',
    fg: 'text-[rgb(var(--accent-enrollment-text))]',
    btnBg: 'bg-[rgb(var(--action-primary-bg))]',
    Icon: CheckCircle,
  },
} as const

export function FinanceInfoBanner({
  variant,
  message,
  subtitle,
  action,
  dismissible,
}: FinanceInfoBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const styles = VARIANT_STYLES[variant]
  const IconComponent = styles.Icon

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${styles.box}`}>
      <IconComponent
        className={`w-3.5 h-3.5 flex-shrink-0 ${styles.fg}`}
        strokeWidth={2}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[rgb(var(--text-primary))]">
          {message}
        </p>
        {subtitle && (
          <p className="text-xs mt-0.5 text-[rgb(var(--text-tertiary))]">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className={`flex-shrink-0 text-xs font-medium px-3 py-1 rounded-md transition-opacity hover:opacity-80 text-[rgb(var(--text-on-accent))] ${styles.btnBg}`}
        >
          {action.label}
        </button>
      )}
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity text-[rgb(var(--text-tertiary))]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
