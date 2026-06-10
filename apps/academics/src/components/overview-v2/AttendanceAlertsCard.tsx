/**
 * AttendanceAlertsCard — V2 (Compact)
 *
 * Compact inline alert strip with max 3 rows (one per severity level).
 * Matches Finance's OverdueAlertBanner pattern — no card chrome, just alert items.
 */

import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { V2AlertItem } from '@edforge/ui'
import type { AcademicAlert } from '../../hooks/useAcademicsOverview'

interface AttendanceAlertsCardProps {
  alerts: AcademicAlert[]
  totalCount: number
  unrecordedCount?: number
  isLoading: boolean
}

function AlertsSkeleton() {
  return (
    <div className="space-y-1.5">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-[10px] border px-3.5 py-3 bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
        >
          <div className="w-7 h-7 rounded-[7px] flex-shrink-0 v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-48 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
            <div className="h-3 w-32 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AttendanceAlertsCard({
  alerts,
  totalCount,
  unrecordedCount,
  isLoading,
}: AttendanceAlertsCardProps) {
  const navigate = useNavigate()

  if (!isLoading && alerts.length === 0 && !unrecordedCount) return null

  if (isLoading) return <AlertsSkeleton />

  // Aggregate alerts by severity into single summary rows
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical')
  const warningAlerts = alerts.filter((a) => a.severity === 'warning')

  const criticalCount = criticalAlerts.reduce((sum, a) => sum + (a.count ?? 0), 0)
  const warningCount = warningAlerts.reduce((sum, a) => sum + (a.count ?? 0), 0)

  return (
    <div className="space-y-1.5" aria-live="polite">
      {/* Critical summary */}
      {criticalCount > 0 && (
        <V2AlertItem
          severity="critical"
          title={`${criticalCount} student${criticalCount !== 1 ? 's' : ''} below 80% attendance — immediate intervention needed`}
          subtitle={`30-day period · ${totalCount} total at-risk`}
          count={criticalCount}
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          cta={{
            label: 'View details',
            onClick: () => navigate({ to: '/students' }),
          }}
        />
      )}

      {/* Warning summary */}
      {warningCount > 0 && (
        <V2AlertItem
          severity="warning"
          title={`${warningCount} student${warningCount !== 1 ? 's' : ''} below 90% attendance threshold`}
          subtitle="Attendance rate below school threshold"
          count={warningCount}
          icon={<AlertCircle className="w-3.5 h-3.5" />}
          cta={{
            label: 'Review',
            onClick: () => navigate({ to: '/students' }),
          }}
        />
      )}

      {/* Unrecorded info */}
      {unrecordedCount != null && unrecordedCount > 0 && (
        <V2AlertItem
          severity="info"
          title={`${unrecordedCount} student${unrecordedCount !== 1 ? 's' : ''} without attendance record today`}
          subtitle="Attendance has not been recorded for all students today"
          count={unrecordedCount}
          icon={<Info className="w-3.5 h-3.5" />}
        />
      )}
    </div>
  )
}
