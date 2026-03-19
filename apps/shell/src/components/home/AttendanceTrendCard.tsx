/**
 * AttendanceTrendCard — V2
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
import { useThemeStore } from '../../stores/theme.store'
import type { TrendPoint } from '../../hooks/useHomeData'
import { ATTENDANCE_THRESHOLD } from '../../hooks/useHomeData'

// ============================================================================
// CHART COLORS HOOK
// ============================================================================

function useV2ChartColors() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme)
  return useMemo(
    () => ({
      line: '#1D9E75',
      fill: 'rgba(29, 158, 117, 0.08)',
      threshold: 'rgba(239, 159, 39, 0.35)',
      grid: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      tick: '#3a4055',
      tooltipBg: resolvedTheme === 'dark' ? '#1e2436' : '#ffffff',
      tooltipBorder: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.08)' : '#e0e4ec',
      pointBorder: resolvedTheme === 'dark' ? '#161b27' : '#ffffff',
    }),
    [resolvedTheme],
  )
}

// ============================================================================
// SKELETON
// ============================================================================

function TrendSkeleton() {
  return (
    <div style={{ height: 148 }} className="flex flex-col justify-end gap-1 px-2">
      <div className="flex items-end gap-1 h-full">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t v2-skeleton-pulse"
            style={{
              height: `${30 + Math.random() * 50}%`,
              background: 'var(--v2-bg-elevated)',
            }}
          />
        ))}
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
    <div
      className="rounded-md shadow-lg px-3 py-2 border text-xs"
      style={{
        background: 'var(--v2-bg-elevated)',
        borderColor: 'var(--v2-border-default)',
      }}
    >
      <p style={{ color: 'var(--v2-text-muted)' }}>
        {new Date(point.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}
      </p>
      <p className="font-semibold mt-0.5" style={{ color: 'var(--v2-text-primary)' }}>
        {point.rate.toFixed(1)}%
      </p>
      <p className="mt-0.5" style={{ color: 'var(--v2-text-muted)' }}>
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
  const colors = useV2ChartColors()

  const srSummary = useMemo(() => {
    if (!summary || chartData.length === 0)
      return 'No attendance trend data available.'
    return `Attendance rate ranged from ${summary.min.toFixed(1)}% to ${summary.max.toFixed(1)}% over the past 30 days, with an average of ${summary.avg.toFixed(1)}%, compared to the ${ATTENDANCE_THRESHOLD}% target.`
  }, [summary, chartData])

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        padding: 18,
      }}
    >
      {/* Custom HTML legend */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            className="text-[13px] font-medium"
            style={{ color: 'var(--v2-text-secondary)' }}
          >
            Attendance trend
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--v2-text-faint)' }}>
            30-day rolling average
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Actual swatch */}
          <div className="flex items-center gap-1.5">
            <div
              className="rounded-sm"
              style={{ width: 8, height: 2, background: '#1D9E75' }}
            />
            <span className="text-[10px]" style={{ color: 'var(--v2-text-faint)' }}>
              Actual
            </span>
          </div>
          {/* Target swatch */}
          <div className="flex items-center gap-1.5">
            <div
              style={{
                width: 8,
                height: 0,
                borderTop: '1px dashed rgba(239, 159, 39, 0.6)',
              }}
            />
            <span className="text-[10px]" style={{ color: 'var(--v2-text-faint)' }}>
              {ATTENDANCE_THRESHOLD}% target
            </span>
          </div>
          {/* Average */}
          {summary && (
            <span className="text-[11px] font-semibold" style={{ color: '#1D9E75' }}>
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
            style={{ height: 148, color: 'var(--v2-text-hint)' }}
          >
            No attendance data recorded yet
          </div>
        ) : (
          <figure
            role="img"
            aria-label="Attendance trend over 30 days"
            aria-describedby="home-v2-trend-desc"
          >
            <figcaption id="home-v2-trend-desc" className="sr-only">
              {srSummary}
            </figcaption>
            <ResponsiveContainer width="100%" height={148}>
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="v2AttGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.line} stopOpacity={0.08} />
                    <stop offset="95%" stopColor={colors.line} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.grid}
                  vertical={false}
                />
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
                  y={ATTENDANCE_THRESHOLD}
                  stroke={colors.threshold}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke={colors.line}
                  strokeWidth={1.5}
                  fill="url(#v2AttGradient)"
                  dot={{
                    r: 2.5,
                    fill: colors.line,
                    stroke: colors.pointBorder,
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 4,
                    fill: colors.line,
                    stroke: colors.pointBorder,
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </figure>
        )}
      </div>

      {/* Footer link */}
      <div
        className="pt-3 mt-3"
        style={{ borderTop: '1px solid var(--v2-border-default)' }}
      >
        <Link
          to="/academics/$"
          params={{ _splat: 'classrooms?tab=attendance' }}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--v2-brand-primary)' }}
        >
          View Attendance
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
