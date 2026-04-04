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
import type { GradeLevelDistribution } from '../../hooks/useAcademicsOverview'

const BAR_PALETTE = ['#1D9E75', '#378ADD', '#7F77DD', '#EF9F27', '#D85A30']

interface EnrollmentByGradeChartProps {
  data: GradeLevelDistribution[]
  total: number
  isLoading: boolean
}

function ChartSkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className="w-14 h-3 rounded v2-skeleton-pulse"
            style={{ background: 'var(--v2-bg-elevated)' }}
          />
          <div className="flex-1">
            <div
              className="h-[14px] rounded-sm v2-skeleton-pulse"
              style={{ background: 'var(--v2-bg-elevated)', width: `${30 + Math.random() * 50}%` }}
            />
          </div>
          <div
            className="w-6 h-3 rounded v2-skeleton-pulse"
            style={{ background: 'var(--v2-bg-elevated)' }}
          />
        </div>
      ))}
    </div>
  )
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as GradeLevelDistribution
  return (
    <div
      className="rounded-lg border px-3 py-2 text-[11px] shadow-lg"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        color: 'var(--v2-text-secondary)',
      }}
    >
      <div className="font-semibold">{d.displayLabel}</div>
      <div style={{ color: 'var(--v2-text-faint)' }}>
        {d.count} student{d.count !== 1 ? 's' : ''} · {d.percentage}%
      </div>
    </div>
  )
}

export function EnrollmentByGradeChart({
  data,
  total,
  isLoading,
}: EnrollmentByGradeChartProps) {
  const colors = useV2ChartColors()

  // Recharts needs a height proportional to data rows
  const chartHeight = useMemo(() => Math.max(data.length * 28, 120), [data.length])

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        padding: 18,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-[13px] font-medium"
          style={{ color: 'var(--v2-text-secondary)' }}
        >
          Enrollment by grade level
        </h3>
        <span className="text-[12px] font-semibold" style={{ color: 'var(--v2-info)' }}>
          {total} total
        </span>
      </div>

      {/* Chart */}
      <div
        className="flex-1 min-h-0"
        aria-label={`Enrollment by grade level, ${total} total students`}
      >
        {isLoading ? (
          <ChartSkeleton />
        ) : data.length === 0 ? (
          <div
            className="flex items-center justify-center text-sm"
            style={{ height: 120, color: 'var(--v2-text-hint)' }}
          >
            No enrollment data
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

      {/* Footer */}
      <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--v2-border-default)' }}>
        <Link
          to="/students"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--v2-brand-primary)' }}
        >
          View Enrollment
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
