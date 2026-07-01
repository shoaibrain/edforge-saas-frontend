/**
 * EnrollmentByGradeChart — V2
 *
 * Horizontal bar chart showing enrollment count per grade level
 * using Recharts BarChart with V2 token styling.
 */

import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { useV2ChartColors } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import type { GradeLevelDistribution } from '../../hooks/useAcademicsOverview'

const BAR_PALETTE = ['#1D9E75', '#378ADD', '#7F77DD', '#EF9F27', '#D85A30']

interface EnrollmentByGradeChartProps {
  data: GradeLevelDistribution[]
  total: number
  isLoading: boolean
  /** Render only the chart (no card chrome / title / footer) for WidgetCard framing. */
  bare?: boolean
}

/** Reusable footer link → the students/enrollment view (also usable as a WidgetCard footer). */
export function EnrollmentByGradeChartFooter() {
  const { t } = useTranslation('academics')
  return (
    <Link
      to="/students"
      className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80 text-[rgb(var(--accent-enrollment-text))]"
    >
      {t('moduleOverview.enrollmentChart.viewEnrollment')}
      <ArrowRight className="w-3 h-3" />
    </Link>
  )
}

function ChartSkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-14 h-3 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          <div className="flex-1">
            <div
              // allow-presentation-style: randomized skeleton bar width
              className="h-3.5 rounded-sm v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]"
              style={{ width: `${30 + Math.random() * 50}%` }}
            />
          </div>
          <div className="w-6 h-3 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
        </div>
      ))}
    </div>
  )
}

function CustomTooltip({ active, payload }: any) {
  const { t } = useTranslation('academics')

  if (!active || !payload?.length) return null
  const d = payload[0].payload as GradeLevelDistribution
  return (
    <div className="rounded-lg border px-3 py-2 text-xs shadow-lg bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]">
      <div className="font-semibold">{d.displayLabel}</div>
      <div className="text-[rgb(var(--text-disabled))]">
        {t('moduleOverview.enrollmentChart.tooltip', {
          count: d.count,
          percentage: d.percentage,
        })}
      </div>
    </div>
  )
}

export function EnrollmentByGradeChart({
  data,
  total,
  isLoading,
  bare,
}: EnrollmentByGradeChartProps) {
  const { t } = useTranslation('academics')
  const colors = useV2ChartColors()

  // Recharts needs a height proportional to data rows
  const chartHeight = useMemo(() => Math.max(data.length * 28, 120), [data.length])

  const chartRegion = (
    <div
      className="flex-1 min-h-0"
      aria-label={t('moduleOverview.enrollmentChart.aria', { total })}
    >
      {isLoading ? (
          <ChartSkeleton />
        ) : data.length === 0 ? (
          <div
            // allow-presentation-style: fixed 120px empty-state height
            className="flex items-center justify-center text-sm text-[rgb(var(--text-tertiary))]"
            style={{ height: 120 }}
          >
            {t('moduleOverview.enrollmentChart.empty')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 4, left: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                horizontal={false}
                strokeDasharray="3 3"
                stroke={colors.grid}
              />
              <XAxis
                type="number"
                hide
                domain={[0, 'dataMax']}
              />
              <YAxis
                type="category"
                dataKey="displayLabel"
                width={72}
                tick={{ fontSize: 11, fill: colors.tick }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                maxBarSize={16}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={BAR_PALETTE[index % BAR_PALETTE.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
    </div>
  )

  if (bare) return chartRegion

  return (
    <div
      // allow-presentation-style: card padding (18px) is off the 4px scale
      className="rounded-xl border flex flex-col bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      style={{ padding: 18 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          {t('moduleOverview.enrollmentChart.title')}
        </h3>
        <span className="text-xs font-semibold text-[rgb(var(--state-info-fg))]">
          {t('moduleOverview.enrollmentChart.total', { total })}
        </span>
      </div>

      {chartRegion}

      {/* Footer */}
      <div className="pt-3 mt-3 border-t border-[rgb(var(--border-primary)/0.35)]">
        <EnrollmentByGradeChartFooter />
      </div>
    </div>
  )
}
