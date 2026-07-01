/**
 * AdoptionReportCard — single-week adoption health card for a tenant.
 *
 * Consumes GET /analytics/tenants/{id}/adoption-report. Renders:
 *   - Overall status header (PASS/PARTIAL/FAIL)
 *   - Grace-period badge while inGracePeriod=true
 *   - Holiday callout when holidaysExcluded > 0 (A-WS3.T3)
 *   - Per-metric rows with value/threshold + pass/partial/fail pill
 *
 * The week label respects the tenant's weekStartsOn (A-WS3.T2) by
 * computing the week's Sunday- or Monday-based date range locally.
 */

import type {
  AdoptionMetricEntry,
  AdoptionMetricKey,
  AdoptionStatus,
} from '@edforge/types/analytics'
import type { AdoptionReportV25 } from '../services/analytics.service'
import { Card, CardContent, CardHeader, Skeleton } from '@edforge/ui'
import { AlertCircle, CalendarOff, Info } from 'lucide-react'

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

export interface AdoptionReportCardProps {
  report?: AdoptionReportV25
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
}

// ----------------------------------------------------------------------------
// Humanization
// ----------------------------------------------------------------------------

const METRIC_LABELS: Record<AdoptionMetricKey, string> = {
  teacherLoginCadence: 'Teacher login cadence',
  attendanceCoverage: 'Attendance coverage',
  gradeSubmissionCadence: 'Grade submission cadence',
  adminActivity: 'Admin activity',
  parentPortalReach: 'Parent portal reach',
  studentPortalReach: 'Student portal reach',
}

// Most metrics are rates (0–1); adminActivity is a count.
function formatMetricValue(key: AdoptionMetricKey, value: number): string {
  if (key === 'adminActivity') return value.toString()
  return `${(value * 100).toFixed(0)}%`
}

function formatThreshold(key: AdoptionMetricKey, threshold: number): string {
  if (key === 'adminActivity') return `≥ ${threshold}`
  return `≥ ${(threshold * 100).toFixed(0)}%`
}

// ----------------------------------------------------------------------------
// Status pill
// ----------------------------------------------------------------------------

const STATUS_STYLES: Record<AdoptionStatus, string> = {
  PASS: 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] ring-1 ring-[rgb(var(--state-success-border)/0.35)]',
  PARTIAL: 'bg-[rgb(var(--state-warning-bg)/0.18)] text-[rgb(var(--state-warning-fg))] ring-1 ring-[rgb(var(--state-warning-border)/0.35)]',
  FAIL: 'bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))] ring-1 ring-[rgb(var(--state-danger-border)/0.35)]',
}

function StatusPill({ status }: { status: AdoptionStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  )
}

// ----------------------------------------------------------------------------
// Week label — converts "2026-W16" + weekStartsOn to "Apr 12–18, 2026"
// ----------------------------------------------------------------------------

function parseIsoWeek(weekKey: string): { year: number; week: number } | null {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekKey)
  if (!m) return null
  return { year: Number(m[1]), week: Number(m[2]) }
}

function isoWeekStartDate(year: number, week: number): Date {
  // ISO 8601: week 1 = week containing Jan 4. Week starts Monday.
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Dow = jan4.getUTCDay() || 7   // Sun=0→7, Mon=1...
  const mondayWeek1 = new Date(jan4)
  mondayWeek1.setUTCDate(jan4.getUTCDate() - (jan4Dow - 1))
  const start = new Date(mondayWeek1)
  start.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7)
  return start
}

function formatWeekRange(
  weekKey: string,
  weekStartsOn: 'sunday' | 'monday' | 'saturday',
): string {
  const parsed = parseIsoWeek(weekKey)
  if (!parsed) return weekKey
  const mondayStart = isoWeekStartDate(parsed.year, parsed.week)
  const start = new Date(mondayStart)
  if (weekStartsOn === 'sunday') start.setUTCDate(start.getUTCDate() - 1)
  else if (weekStartsOn === 'saturday') start.setUTCDate(start.getUTCDate() - 2)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)

  const fmt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

export function AdoptionReportCard({
  report,
  isLoading,
  error,
  onRetry,
}: AdoptionReportCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-start gap-3 py-6">
            {/* icon-coverage-static-ok: error-banner mark; the Retry button is text-only */}
            <AlertCircle className="h-5 w-5 text-[rgb(var(--state-danger-fg))] mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[rgb(var(--state-danger-fg))]">
                Could not load adoption report
              </p>
              <p className="text-xs text-[rgb(var(--text-secondary))] mt-1">{error.message}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-3 text-xs text-[rgb(var(--action-secondary-fg))] hover:underline"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!report) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-[rgb(var(--text-tertiary))] py-6 text-center">
            No adoption data available for this week yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  const weekRange = formatWeekRange(report.weekKey, report.weekStartsOn ?? 'monday')
  const holidaysExcluded = report.holidaysExcluded ?? 0
  const metricEntries = Object.entries(report.perMetric) as Array<
    [AdoptionMetricKey, AdoptionMetricEntry]
  >

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">
              Weekly adoption
            </h3>
            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
              {weekRange} · week {report.weekKey}
            </p>
          </div>
          <StatusPill status={report.overall} />
        </div>
      </CardHeader>
      <CardContent>
        {report.inGracePeriod && (
          <div className="mb-3 flex items-start gap-2 rounded-md bg-[rgb(var(--state-info-bg)/0.18)] ring-1 ring-[rgb(var(--state-info-border)/0.35)] px-3 py-2">
            <Info className="h-4 w-4 text-[rgb(var(--action-secondary-fg))] mt-0.5 shrink-0" />
            <p className="text-xs text-[rgb(var(--state-info-fg))]">
              Tenant is in onboarding grace period — thresholds are informational.
            </p>
          </div>
        )}

        {holidaysExcluded > 0 && (
          <div className="mb-3 flex items-start gap-2 rounded-md bg-[rgb(var(--state-warning-bg)/0.18)] ring-1 ring-[rgb(var(--state-warning-border)/0.35)] px-3 py-2">
            <CalendarOff className="h-4 w-4 text-[rgb(var(--state-warning-fg))] mt-0.5 shrink-0" />
            <p className="text-xs text-[rgb(var(--state-warning-fg))]">
              {holidaysExcluded} holiday{holidaysExcluded === 1 ? '' : 's'} this week —
              thresholds reduced proportionally.
            </p>
          </div>
        )}

        <ul className="divide-y divide-[rgb(var(--border-secondary))]">
          {metricEntries.map(([key, entry]) => (
            <li key={key} className="flex items-center justify-between py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-[rgb(var(--text-primary))] truncate">
                  {METRIC_LABELS[key]}
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                  <span className="font-mono">{formatMetricValue(key, entry.value)}</span>
                  <span className="mx-1.5">·</span>
                  <span>{formatThreshold(key, entry.threshold)}</span>
                </p>
              </div>
              <StatusPill status={entry.status} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
