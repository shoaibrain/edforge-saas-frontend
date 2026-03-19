/**
 * AttendanceAlertsCard — V2
 *
 * Full-width card showing critical/warning/info attendance alerts.
 * Uses V2AlertItem from @edforge/ui.
 */

import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, AlertCircle, Info, ArrowRight } from 'lucide-react'
import { V2AlertItem, WidgetErrorBoundaryV2 } from '@edforge/ui'
import type { AcademicAlert } from '../../hooks/useAcademicsOverview'

interface AttendanceAlertsCardProps {
  alerts: AcademicAlert[]
  totalCount: number
  unrecordedCount?: number
  isLoading: boolean
}

function AlertsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-[10px] border"
          style={{
            padding: '11px 14px',
            background: 'var(--v2-bg-surface)',
            borderColor: 'var(--v2-border-default)',
          }}
        >
          <div
            className="w-7 h-7 rounded-[7px] flex-shrink-0 v2-skeleton-pulse"
            style={{ background: 'var(--v2-bg-elevated)' }}
          />
          <div className="flex-1 space-y-1.5">
            <div
              className="h-3.5 w-48 rounded v2-skeleton-pulse"
              style={{ background: 'var(--v2-bg-elevated)' }}
            />
            <div
              className="h-3 w-32 rounded v2-skeleton-pulse"
              style={{ background: 'var(--v2-bg-elevated)' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const SEVERITY_ICONS = {
  critical: <AlertTriangle className="w-3.5 h-3.5" />,
  warning: <AlertCircle className="w-3.5 h-3.5" />,
  info: <Info className="w-3.5 h-3.5" />,
}

export function AttendanceAlertsCard({
  alerts,
  totalCount,
  unrecordedCount,
  isLoading,
}: AttendanceAlertsCardProps) {
  if (!isLoading && alerts.length === 0 && !unrecordedCount) return null

  return (
    <WidgetErrorBoundaryV2 fallbackMessage="Unable to load alerts">
      <div
        className="rounded-xl border"
        style={{
          background: 'var(--v2-bg-surface)',
          borderColor: 'var(--v2-border-default)',
          padding: 18,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3
              className="text-[13px] font-medium"
              style={{ color: 'var(--v2-text-secondary)' }}
            >
              Attendance alerts
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--v2-text-faint)' }}>
              {totalCount} student{totalCount !== 1 ? 's' : ''} below 90% threshold · 30-day period
            </p>
          </div>
          <Link
            to="/students"
            className="text-[11px] font-medium transition-opacity hover:opacity-80 inline-flex items-center gap-1"
            style={{ color: 'var(--v2-brand-primary)' }}
          >
            View all students
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Alerts */}
        {isLoading ? (
          <AlertsSkeleton />
        ) : (
          <div className="space-y-1.5" aria-live="polite">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
              >
                <V2AlertItem
                  severity={alert.severity}
                  title={alert.title}
                  subtitle={alert.description}
                  count={alert.count}
                  icon={SEVERITY_ICONS[alert.severity]}
                />
              </motion.div>
            ))}

            {/* Info alert for unrecorded attendance */}
            {unrecordedCount != null && unrecordedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: alerts.length * 0.08, duration: 0.3 }}
              >
                <V2AlertItem
                  severity="info"
                  title={`${unrecordedCount} student${unrecordedCount !== 1 ? 's' : ''} without attendance record`}
                  subtitle="Attendance has not been recorded for all students today"
                  count={unrecordedCount}
                  icon={<Info className="w-3.5 h-3.5" />}
                />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </WidgetErrorBoundaryV2>
  )
}
