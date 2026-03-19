/**
 * ActivityFeedWidget
 *
 * Displays prioritized academic alerts with severity-differentiated indicators.
 * Uses distinct icons (not just color) for each severity level to ensure
 * accessibility for users with color vision deficiency.
 */

import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import { Bell, ArrowRight, CheckCircle } from 'lucide-react'
import { Card } from '@edforge/ui'
import type { AcademicAlert } from '../../hooks/useAcademicsOverview'

// ============================================================================
// TYPES
// ============================================================================

interface ActivityFeedWidgetProps {
  alerts: AcademicAlert[]
  totalCount: number
  loading?: boolean
}

// ============================================================================
// SEVERITY STYLES
// ============================================================================

const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    border: 'border-l-4 border-red-500',
    label: 'Critical',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    border: 'border-l-4 border-amber-400',
    label: 'Warning',
  },
  info: {
    bg: 'bg-teal-50 dark:bg-teal-500/10',
    text: 'text-teal-600 dark:text-teal-400',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400',
    border: 'border-l-4 border-teal-500',
    label: 'Info',
  },
}

// ============================================================================
// SKELETON
// ============================================================================

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl animate-pulse"
        >
          <div className="w-9 h-9 bg-surface-hover rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-surface-hover rounded" />
            <div className="h-3 w-32 bg-surface-hover rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// ALERT ITEM
// ============================================================================

function AlertItem({ alert, index }: { alert: AcademicAlert; index: number }) {
  const style = SEVERITY_STYLES[alert.severity]
  const SeverityIcon = alert.severityIcon
  const TypeIcon = alert.typeIcon

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
    >
      <Link to={alert.href as any}>
        <div className={`group flex items-center gap-3 p-4 rounded-r-lg ${style.bg} ${style.border} cursor-pointer hover:brightness-[0.98] dark:hover:brightness-110 transition-all`}>
          {/* Severity + Type icons */}
          <div className="relative p-2 rounded-lg bg-white/60 dark:bg-white/10 flex-shrink-0">
            <TypeIcon className={`w-5 h-5 ${style.text}`} />
            <div className="absolute -top-1 -right-1">
              <SeverityIcon className={`w-3.5 h-3.5 ${style.text}`} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-text-primary truncate">
                {alert.title}
              </p>
              <span
                className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${style.badge} flex-shrink-0`}
              >
                {style.label}
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-0.5 truncate">
              {alert.description}
            </p>
          </div>

          {/* Count badge */}
          {alert.count != null && (
            <span className="text-xs font-medium text-text-secondary bg-white/60 dark:bg-white/10 px-2 py-0.5 rounded-full flex-shrink-0">
              {alert.count}
            </span>
          )}

          {/* Arrow */}
          <ArrowRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
      </Link>
    </motion.li>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ActivityFeedWidget({
  alerts,
  totalCount,
  loading,
}: ActivityFeedWidgetProps) {
  const displayAlerts = alerts.slice(0, 5)
  const hasMore = totalCount > 5

  return (
    <Card className="p-5 border-border-secondary flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-amber-500/10">
          <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">
          Activity & Alerts
        </h3>
        {totalCount > 0 && (
          <span className="ml-auto text-xs text-text-tertiary">
            {totalCount} alert{totalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <FeedSkeleton />
        ) : displayAlerts.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
            <p className="text-sm font-medium text-text-primary">All clear!</p>
            <p className="text-xs text-text-tertiary mt-1">
              No alerts at this time
            </p>
          </div>
        ) : (
          <ul role="list" className="space-y-2">
            {displayAlerts.map((alert, index) => (
              <AlertItem key={alert.id} alert={alert} index={index} />
            ))}
          </ul>
        )}
      </div>

      {/* Show more link */}
      {hasMore && (
        <div className="pt-3 mt-2 border-t border-border-secondary">
          <Link
            to="/classrooms"
            search={{ tab: 'attendance' }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-cyan-400 hover:text-teal-700 dark:hover:text-cyan-300 transition-colors"
          >
            View all ({totalCount})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </Card>
  )
}
