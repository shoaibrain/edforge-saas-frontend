/**
 * AttendanceTrendCard
 *
 * 30-day attendance rate area chart for the home page.
 * Mirrors the academics AttendanceTrendWidget using recharts.
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
import type { TrendPoint } from '../../hooks/useHomeData'

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
            className="flex-1 bg-[rgb(var(--surface-tertiary))] rounded-t animate-pulse"
            style={{ height: `${30 + Math.random() * 50}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between pt-2">
        <div className="h-3 w-10 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
        <div className="h-3 w-10 bg-[rgb(var(--surface-tertiary))] rounded animate-pulse" />
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
    <div className="bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-secondary))] rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-[rgb(var(--text-tertiary))]">
        {new Date(point.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}
      </p>
      <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
        {point.rate.toFixed(1)}%
      </p>
      <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
        {point.present} of {point.total} present
      </p>
    </div>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

interface AttendanceTrendCardProps {
  chartData: TrendPoint[]
  summary: { min: number; max: number; avg: number } | null
  isLoading: boolean
}

export function AttendanceTrendCard({
  chartData,
  summary,
  isLoading,
}: AttendanceTrendCardProps) {
  const srSummary = useMemo(() => {
    if (!summary || chartData.length === 0)
      return 'No attendance trend data available.'
    return `Attendance rate ranged from ${summary.min.toFixed(1)}% to ${summary.max.toFixed(1)}% over the past 30 days, with an average of ${summary.avg.toFixed(1)}%.`
  }, [summary, chartData])

  return (
    <Card className="p-5 border-[rgb(var(--border-primary))] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-teal-500/10">
          <ClipboardCheck className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
        </div>
        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
          Attendance Trend (30 Days)
        </h3>
        {summary && (
          <span className="ml-auto text-xs text-[rgb(var(--text-tertiary))]">
            Avg {summary.avg.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <TrendSkeleton />
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-[rgb(var(--text-tertiary))] text-sm">
            No attendance data recorded yet
          </div>
        ) : (
          <figure
            role="img"
            aria-label="Attendance trend over 30 days"
            aria-describedby="home-attendance-trend-desc"
          >
            <figcaption id="home-attendance-trend-desc" className="sr-only">
              {srSummary}
            </figcaption>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="homeAttendanceGradient"
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
                  fill="url(#homeAttendanceGradient)"
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
          </figure>
        )}
      </div>

      <div className="pt-3 mt-auto border-t border-[rgb(var(--border-primary))]">
        <Link
          to="/academics/$"
          params={{ _splat: 'classrooms?tab=attendance' }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-cyan-400 hover:text-teal-700 dark:hover:text-cyan-300 transition-colors"
        >
          View Attendance
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  )
}
