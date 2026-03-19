/**
 * AlertsRow
 *
 * Critical alerts section for the admin command center.
 * Conditionally rendered — hidden when no alerts exist.
 * Mirrors severity styling from the academics ActivityFeedWidget.
 */

import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ClipboardCheck,
  DollarSign,
} from 'lucide-react'
import type { HomeAlert } from '../../hooks/useHomeData'

const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    border: 'border-l-4 border-red-500',
    label: 'Critical',
    icon: AlertTriangle,
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    border: 'border-l-4 border-amber-400',
    label: 'Warning',
    icon: AlertCircle,
  },
}

const MODULE_ICONS = {
  academics: ClipboardCheck,
  finance: DollarSign,
}

interface AlertsRowProps {
  alerts: HomeAlert[]
  loading?: boolean
}

function AlertSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-r-lg bg-[rgb(var(--surface-secondary))] border-l-4 border-[rgb(var(--border-primary))] animate-pulse">
      <div className="w-9 h-9 bg-[rgb(var(--surface-tertiary))] rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 bg-[rgb(var(--surface-tertiary))] rounded" />
        <div className="h-3 w-32 bg-[rgb(var(--surface-tertiary))] rounded" />
      </div>
    </div>
  )
}

export function AlertsRow({ alerts, loading }: AlertsRowProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <AlertSkeleton />
        <AlertSkeleton />
      </div>
    )
  }

  if (alerts.length === 0) return null

  return (
    <ul role="list" className="space-y-2">
      {alerts.map((alert, index) => {
        const style = SEVERITY_STYLES[alert.severity]
        const SeverityIcon = style.icon
        const ModuleIcon = MODULE_ICONS[alert.module]

        return (
          <motion.li
            key={alert.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.25 }}
          >
            <Link to={alert.href as any}>
              <div
                className={`group flex items-center gap-3 p-4 rounded-r-lg ${style.bg} ${style.border} cursor-pointer hover:brightness-[0.98] dark:hover:brightness-110 transition-all`}
              >
                <div className="relative p-2 rounded-lg bg-white/60 dark:bg-white/10 flex-shrink-0">
                  <ModuleIcon className={`w-5 h-5 ${style.text}`} />
                  <div className="absolute -top-1 -right-1">
                    <SeverityIcon className={`w-3.5 h-3.5 ${style.text}`} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                      {alert.title}
                    </p>
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${style.badge} flex-shrink-0`}
                    >
                      {style.label}
                    </span>
                  </div>
                  <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5 truncate">
                    {alert.description}
                  </p>
                </div>

                {alert.count != null && (
                  <span className="text-xs font-medium text-[rgb(var(--text-secondary))] bg-white/60 dark:bg-white/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    {alert.count}
                  </span>
                )}

                <ArrowRight className="w-4 h-4 text-[rgb(var(--text-tertiary))] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            </Link>
          </motion.li>
        )
      })}
    </ul>
  )
}
