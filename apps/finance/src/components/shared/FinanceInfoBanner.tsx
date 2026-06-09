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
    bg: 'rgba(55,138,221,0.06)',
    border: 'rgba(55,138,221,0.12)',
    icon: '#378ADD',
    Icon: Info,
  },
  warning: {
    bg: 'rgba(239,159,39,0.06)',
    border: 'rgba(239,159,39,0.12)',
    icon: '#EF9F27',
    Icon: AlertTriangle,
  },
  danger: {
    bg: 'rgba(226,75,74,0.06)',
    border: 'rgba(226,75,74,0.12)',
    icon: '#E24B4A',
    Icon: AlertCircle,
  },
  success: {
    bg: 'rgba(29,158,117,0.06)',
    border: 'rgba(29,158,117,0.12)',
    icon: '#1D9E75',
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
    <div
      className="flex items-center gap-3 rounded-xl"
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        padding: '12px 14px',
      }}
    >
      <IconComponent
        className="w-3.5 h-3.5 flex-shrink-0"
        style={{ color: styles.icon }}
        strokeWidth={2}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: 'rgb(var(--text-primary))' }}>
          {message}
        </p>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-tertiary))' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex-shrink-0 text-xs font-medium px-3 py-1 rounded-md transition-opacity hover:opacity-80"
          style={{
            background: styles.icon,
            color: '#fff',
          }}
        >
          {action.label}
        </button>
      )}
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
          style={{ color: 'rgb(var(--text-tertiary))' }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
