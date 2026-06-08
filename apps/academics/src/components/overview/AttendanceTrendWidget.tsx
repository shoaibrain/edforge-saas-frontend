/**
 * AttendanceTrendWidget
 *
 * 30-day attendance rate area chart for the overview page.
 * Self-contained: manages its own data fetching via useAttendanceTrendData.
 * Includes screen-reader-accessible hidden data table and summary.
 */

import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { ClipboardCheck, ArrowRight } from 'lucide-react'
import { Card } from '@edforge/ui'
import { useAttendanceTrendData } from '../../hooks/useAcademicsOverview'

// ============================================================================
// TYPES
// ============================================================================

interface AttendanceTrendWidgetProps {
  schoolId: string | null
  enabled?: boolean
}

// ============================================================================
// SKELETON
// ============================================================================

function TrendSkeleton() {
  return (
    <div className="h-52 flex flex-col justify-end gap-1 p-4">
      <div className="flex items-end gap-1 h-full">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-surface-hover rounded-t animate-pulse"
            style={{ height: `${30 + Math.random() * 50}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between pt-2">
        <div className="h-3 w-10 bg-surface-hover rounded animate-pulse" />
        <div className="h-3 w-10 bg-surface-hover rounded animate-pulse" />
      </div>
    </div>
  )
}

// ============================================================================
// TOOLTIP
// ============================================================================

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="bg-surface-primary border border-border-secondary rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-text-tertiary">
        {new Date(point.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}
      </p>
      <p className="text-sm font-semibold text-text-primary">
        {point.rate.toFixed(1)}%
      </p>
      <p className="text-xs text-text-tertiary mt-0.5">
        {point.present} of {point.total} present
      </p>
    </div>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AttendanceTrendWidget({
  schoolId,
  enabled = true,
}: AttendanceTrendWidgetProps) {
  const { chartData, summary, isLoading } = useAttendanceTrendData(
    schoolId,
    enabled
  )

  const srSummary = useMemo(() => {
    if (!summary || chartData.length === 0)
      return 'No attendance trend data available.'
    return `Attendance rate ranged from ${summary.min.toFixed(1)}% to ${summary.max.toFixed(1)}% over the past 30 days, with an average of ${summary.avg.toFixed(1)}%.`
  }, [summary, chartData])

  return (
    <Card className="p-5 border-border-secondary flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)]">
          <ClipboardCheck className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] " />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">
          Attendance Trend (30 Days)
        </h3>
        {summary && (
          <span className="ml-auto text-xs text-text-tertiary">
            Avg {summary.avg.toFixed(1)}%
          </span>
        )}
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <TrendSkeleton />
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-text-tertiary text-sm">
            No attendance data recorded yet
          </div>
        ) : (
          <figure
            role="img"
            aria-label="Attendance trend over 30 days"
            aria-describedby="attendance-trend-desc"
          >
            <figcaption id="attendance-trend-desc" className="sr-only">
              {srSummary}
            </figcaption>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="overviewAttendanceGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#005f73" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#005f73" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis
                  dataKey="displayDate"
                  tick={{
                    fontSize: 11,
                    fill: 'var(--color-text-tertiary, #9ca3af)',
                  }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{
                    fontSize: 11,
                    fill: 'var(--color-text-tertiary, #9ca3af)',
                  }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                  padding={{ top: 10 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#005f73"
                  strokeWidth={2}
                  fill="url(#overviewAttendanceGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: '#005f73',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Hidden data table for screen readers */}
            <table className="sr-only">
              <caption>30-day attendance trend</caption>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Attendance Rate</th>
                  <th>Present</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((d) => (
                  <tr key={d.date}>
                    <td>{d.date}</td>
                    <td>{d.rate.toFixed(1)}%</td>
                    <td>{d.present}</td>
                    <td>{d.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </figure>
        )}
      </div>

      {/* Footer link */}
      <div className="pt-3 mt-auto border-t border-border-secondary">
        <Link
          to="/classrooms"
          search={{ tab: 'attendance' }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--action-secondary-fg))]  hover:text-[rgb(var(--text-primary))] dark:hover:text-cyan-300 transition-colors"
        >
          View Attendance
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  )
}
