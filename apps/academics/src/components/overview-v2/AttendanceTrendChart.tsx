/**
 * AttendanceTrendChart — V2
 *
 * 30-day attendance rate area chart with 80% threshold reference line,
 * custom HTML legend, and V2 token-based styling.
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
  ReferenceLine,
} from 'recharts'
import { ArrowRight } from 'lucide-react'
import { useV2ChartColors } from '@edforge/ui'
import { useAppStore } from '../../stores/app.store'
import type { AttendanceTrendPoint } from '../../hooks/useAcademicsOverview'

const THRESHOLD = 80

function TrendSkeleton() {
  return (
    <div style={{ height: 160 }} className="flex flex-col justify-end gap-1 px-2">
      <div className="flex items-end gap-1 h-full">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t v2-skeleton-pulse"
            style={{
              height: `${30 + Math.random() * 50}%`,
              background: 'rgb(var(--background-tertiary))',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div
      className="rounded-md shadow-lg px-3 py-2 border text-xs"
      style={{
        background: 'rgb(var(--background-tertiary))',
        borderColor: 'rgb(var(--border-primary) / 0.35)',
      }}
    >
      <p style={{ color: 'rgb(var(--text-tertiary))' }}>
        {new Date(point.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}
      </p>
      <p className="font-semibold mt-0.5" style={{ color: 'rgb(var(--text-primary))' }}>
        {point.rate.toFixed(1)}%
      </p>
      <p className="mt-0.5" style={{ color: 'rgb(var(--text-tertiary))' }}>
        {point.present} of {point.total} present
      </p>
    </div>
  )
}

interface AttendanceTrendChartProps {
  chartData: AttendanceTrendPoint[]
  summary: { min: number; max: number; avg: number } | null
  isLoading: boolean
}

export function AttendanceTrendChart({
  chartData,
  summary,
  isLoading,
}: AttendanceTrendChartProps) {
  const resolvedTheme = useAppStore((s) => s.theme) === 'dark' ? 'dark' : 'light'
  const colors = useV2ChartColors(resolvedTheme as 'dark' | 'light')

  const srSummary = useMemo(() => {
    if (!summary || chartData.length === 0) return 'No attendance trend data available.'
    return `Attendance rate ranged from ${summary.min.toFixed(1)}% to ${summary.max.toFixed(1)}% over the past 30 days, with an average of ${summary.avg.toFixed(1)}%, compared to the ${THRESHOLD}% target.`
  }, [summary, chartData])

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{
        background: 'rgb(var(--background-secondary))',
        borderColor: 'rgb(var(--border-primary) / 0.35)',
        padding: 18,
      }}
    >
      {/* Legend */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            className="text-sm font-medium"
            style={{ color: 'rgb(var(--text-secondary))' }}
          >
            Attendance trend
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-disabled))' }}>
            30-day rolling average
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="rounded-sm" style={{ width: 8, height: 2, background: '#1D9E75' }} />
            <span className="text-xs" style={{ color: 'rgb(var(--text-disabled))' }}>Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 8, height: 0, borderTop: '1px dashed rgba(239, 159, 39, 0.6)' }} />
            <span className="text-xs" style={{ color: 'rgb(var(--text-disabled))' }}>{THRESHOLD}% target</span>
          </div>
          {summary && (
            <span className="text-xs font-semibold" style={{ color: '#1D9E75' }}>
              Avg {summary.avg.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <TrendSkeleton />
        ) : chartData.length === 0 ? (
          <div
            className="flex items-center justify-center text-sm"
            style={{ height: 160, color: 'rgb(var(--text-tertiary))' }}
          >
            No attendance data recorded yet
          </div>
        ) : (
          <figure
            role="img"
            aria-label="Attendance trend over 30 days"
            aria-describedby="academics-v2-trend-desc"
          >
            <figcaption id="academics-v2-trend-desc" className="sr-only">
              {srSummary}
            </figcaption>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="v2AcademicsTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.line} stopOpacity={0.08} />
                    <stop offset="95%" stopColor={colors.line} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 10, fill: colors.tick }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[40, 110]}
                  tick={{ fontSize: 10, fill: colors.tick }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine
                  y={THRESHOLD}
                  stroke={colors.threshold}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke={colors.line}
                  strokeWidth={2}
                  fill="url(#v2AcademicsTrendGradient)"
                  dot={{ r: 2.5, fill: colors.line, stroke: colors.pointBorder, strokeWidth: 1.5 }}
                  activeDot={{ r: 4, fill: colors.line, stroke: colors.pointBorder, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </figure>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 mt-3" style={{ borderTop: '1px solid rgb(var(--border-primary) / 0.35)' }}>
        <Link
          to="/classrooms"
          search={{ tab: 'attendance' }}
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ color: '#1D9E75' }}
        >
          View Attendance
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
