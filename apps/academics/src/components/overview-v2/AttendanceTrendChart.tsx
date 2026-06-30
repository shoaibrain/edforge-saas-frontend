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
import { useTranslation } from '@edforge/i18n'
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
            // allow-presentation-style: randomized skeleton bar height
            className="flex-1 rounded-t v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]"
            style={{ height: `${30 + Math.random() * 50}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload }: any) {
  const { t, i18n } = useTranslation('academics')

  if (!active || !payload?.length) return null
  const point = payload[0].payload
  const locale = i18n.language === 'ne' ? 'ne-NP' : 'en-US'

  return (
    <div className="rounded-md shadow-lg px-3 py-2 border text-xs bg-[rgb(var(--background-tertiary))] border-[rgb(var(--border-primary)/0.35)]">
      <p className="text-[rgb(var(--text-tertiary))]">
        {new Date(point.date).toLocaleDateString(locale, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}
      </p>
      <p className="font-semibold mt-0.5 text-[rgb(var(--text-primary))]">
        {point.rate.toFixed(1)}%
      </p>
      <p className="mt-0.5 text-[rgb(var(--text-tertiary))]">
        {t('moduleOverview.attendanceTrend.tooltipPresent', {
          present: point.present,
          total: point.total,
        })}
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
  const { t } = useTranslation('academics')
  const resolvedTheme = useAppStore((s) => s.theme) === 'dark' ? 'dark' : 'light'
  const colors = useV2ChartColors(resolvedTheme as 'dark' | 'light')

  const srSummary = useMemo(() => {
    if (!summary || chartData.length === 0) return t('moduleOverview.attendanceTrend.srNoData')
    return t('moduleOverview.attendanceTrend.srSummary', {
      min: summary.min.toFixed(1),
      max: summary.max.toFixed(1),
      avg: summary.avg.toFixed(1),
      target: THRESHOLD,
    })
  }, [summary, chartData, t])

  return (
    <div
      // allow-presentation-style: card padding (18px) is off the 4px scale
      className="rounded-xl border flex flex-col bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      style={{ padding: 18 }}
    >
      {/* Legend */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
            {t('moduleOverview.attendanceTrend.title')}
          </h3>
          <p className="text-xs mt-0.5 text-[rgb(var(--text-disabled))]">
            {t('moduleOverview.attendanceTrend.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="rounded-sm w-2 h-0.5 bg-[rgb(var(--accent-enrollment))]" />
            <span className="text-xs text-[rgb(var(--text-disabled))]">{t('moduleOverview.attendanceTrend.actual')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 8, height: 0, borderTop: '1px dashed rgba(239, 159, 39, 0.6)' }} />
            <span className="text-xs text-[rgb(var(--text-disabled))]">{t('moduleOverview.attendanceTrend.target', { value: THRESHOLD })}</span>
          </div>
          {summary && (
            <span className="text-xs font-semibold text-[rgb(var(--accent-enrollment-text))]">
              {t('moduleOverview.attendanceTrend.average', { value: summary.avg.toFixed(1) })}
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
            // allow-presentation-style: fixed 160px empty-state height
            className="flex items-center justify-center text-sm text-[rgb(var(--text-tertiary))]"
            style={{ height: 160 }}
          >
            {t('moduleOverview.attendanceTrend.empty')}
          </div>
        ) : (
          <figure
            role="img"
            aria-label={t('moduleOverview.attendanceTrend.aria')}
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
      <div className="pt-3 mt-3 border-t border-[rgb(var(--border-primary)/0.35)]">
        <Link
          to="/classrooms"
          search={{ tab: 'attendance' }}
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80 text-[rgb(var(--accent-enrollment-text))]"
        >
          {t('moduleOverview.attendanceTrend.viewAttendance')}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
