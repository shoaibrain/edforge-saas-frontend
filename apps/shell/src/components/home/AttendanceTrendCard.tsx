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
import { useTranslation } from '@edforge/i18n'

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
      tick: resolvedTheme === 'dark' ? '#4a5068' : '#6b7280',
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
            className="flex-1 rounded-t v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]"
            style={{ height: `${30 + Math.random() * 50}%` }}
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
    <div className="rounded-md shadow-lg px-3 py-2 border text-xs bg-[rgb(var(--background-tertiary))] border-[rgb(var(--border-primary)/0.35)]">
      <p className="text-[rgb(var(--text-tertiary))]">
        {new Date(point.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}
      </p>
      <p className="font-semibold mt-0.5 text-[rgb(var(--text-primary))]">
        {point.rate.toFixed(1)}%
      </p>
      <p className="mt-0.5 text-[rgb(var(--text-tertiary))]">
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
  /** When true, render only the legend + chart (no card chrome / title / footer)
   *  so a WidgetCard can frame it. */
  bare?: boolean
}

/** Reusable footer link → the attendance view (also usable as a WidgetCard footer). */
export function AttendanceTrendFooter() {
  const { t } = useTranslation('dashboard')
  return (
    <Link
      to="/academics/$"
      params={{ _splat: 'classrooms?tab=attendance' }}
      className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80 text-[#1D9E75]"
    >
      {t('homeV2.trend.viewAttendance')}
      <ArrowRight className="w-3 h-3" />
    </Link>
  )
}

export function AttendanceTrendCard({
  chartData,
  summary,
  isLoading,
  bare,
}: AttendanceTrendCardProps) {
  const colors = useV2ChartColors()
  const { t } = useTranslation('dashboard')

  const srSummary = useMemo(() => {
    if (!summary || chartData.length === 0)
      return 'No attendance trend data available.'
    return `Attendance rate ranged from ${summary.min.toFixed(1)}% to ${summary.max.toFixed(1)}% over the past 30 days, with an average of ${summary.avg.toFixed(1)}%, compared to the ${ATTENDANCE_THRESHOLD}% target.`
  }, [summary, chartData])

  const legend = (
    <div className="flex items-center gap-4">
      {/* Actual swatch */}
      <div className="flex items-center gap-1.5">
        <div className="rounded-sm w-2 h-0.5 bg-[#1D9E75]" />
        <span className="text-xs text-[rgb(var(--text-disabled))]">
          {t('homeV2.trend.actual')}
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
        <span className="text-xs text-[rgb(var(--text-disabled))]">
          {t('homeV2.trend.target', { threshold: ATTENDANCE_THRESHOLD })}
        </span>
      </div>
      {/* Average */}
      {summary && (
        <span className="text-xs font-semibold text-[#1D9E75]">
          {t('homeV2.trend.avg', { avg: summary.avg.toFixed(1) })}
        </span>
      )}
    </div>
  )

  const chartRegion = (
    <div className="flex-1 min-h-0">
      {isLoading ? (
        <TrendSkeleton />
      ) : chartData.length === 0 ? (
        <div
          // allow-presentation-style: fixed 148px empty-state height (matches chart)
          className="flex items-center justify-center text-sm text-[rgb(var(--text-tertiary))]"
          style={{ height: 148 }}
        >
          {t('homeV2.trend.noData')}
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
  )

  if (bare) {
    return (
      <div className="flex flex-col">
        <div className="mb-3 flex justify-end">{legend}</div>
        {chartRegion}
      </div>
    )
  }

  return (
    <div
      // allow-presentation-style: card padding (18px) is off the 4px scale
      className="rounded-xl border flex flex-col bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      style={{ padding: 18 }}
    >
      {/* Custom HTML legend */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
            {t('homeV2.trend.attendanceTrend')}
          </h3>
          <p className="text-xs mt-0.5 text-[rgb(var(--text-disabled))]">
            {t('homeV2.trend.rollingAverage')}
          </p>
        </div>
        {legend}
      </div>

      {/* Chart */}
      {chartRegion}

      {/* Footer link */}
      <div className="pt-3 mt-3 border-t border-[rgb(var(--border-primary)/0.35)]">
        <AttendanceTrendFooter />
      </div>
    </div>
  )
}
