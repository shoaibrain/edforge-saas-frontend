/**
 * EnrollmentDistributionChart
 *
 * Horizontal bar chart showing enrollment count by grade level.
 * Uses Recharts BarChart with vertical layout.
 * Includes a screen-reader-accessible hidden data table.
 */

import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
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
import { GraduationCap, ArrowRight } from 'lucide-react'
import { Card } from '@edforge/ui'
import type { GradeLevelDistribution } from '../../hooks/useAcademicsOverview'

// ============================================================================
// TYPES
// ============================================================================

interface EnrollmentDistributionChartProps {
  data: GradeLevelDistribution[]
  total: number
  loading?: boolean
}

// ============================================================================
// SKELETON
// ============================================================================

function ChartSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-20 h-4 bg-surface-hover rounded animate-pulse" />
          <div
            className="h-6 bg-surface-hover rounded animate-pulse"
            style={{ width: `${60 - i * 10}%` }}
          />
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// TOOLTIP
// ============================================================================

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload as GradeLevelDistribution
  return (
    <div className="bg-surface-primary border border-border-secondary rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-text-tertiary">{item.displayLabel}</p>
      <p className="text-sm font-semibold text-text-primary">
        {item.count.toLocaleString()} students ({item.percentage}%)
      </p>
    </div>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EnrollmentDistributionChart({
  data,
  total,
  loading,
}: EnrollmentDistributionChartProps) {
  // Build screen-reader summary
  const srSummary = useMemo(() => {
    if (data.length === 0) return 'No enrollment data available.'
    const parts = data.map(
      (d) => `${d.displayLabel}: ${d.count} students (${d.percentage}%)`
    )
    return `Enrollment distribution across ${data.length} grade levels, ${total.toLocaleString()} total students. ${parts.join('. ')}.`
  }, [data, total])

  const chartHeight = Math.max(200, data.length * 44 + 20)

  return (
    <Card className="p-5 border-border-secondary h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)]">
          <GraduationCap className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] " />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">
          Enrollment by Grade Level
        </h3>
        {total > 0 && (
          <span className="ml-auto text-xs text-text-tertiary">
            {total.toLocaleString()} total
          </span>
        )}
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <ChartSkeleton />
        ) : data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-text-tertiary text-sm">
            No enrollment data yet
          </div>
        ) : (
          <figure
            role="img"
            aria-label="Enrollment by grade level chart"
            aria-describedby="enrollment-chart-desc"
          >
            <figcaption id="enrollment-chart-desc" className="sr-only">
              {srSummary}
            </figcaption>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e2e8f0"
                  strokeOpacity={0.5}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'var(--color-text-tertiary, #9ca3af)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="displayLabel"
                  tick={{ fontSize: 12, fill: 'var(--color-text-secondary, #6b7280)' }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-interactive-hover, rgba(0,0,0,0.04))' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                  {data.map((_, index) => (
                    <Cell
                      key={index}
                      fill={index % 2 === 0 ? '#005f73' : '#0a9396'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Hidden data table for screen readers */}
            <table className="sr-only">
              <thead>
                <tr>
                  <th>Grade Level</th>
                  <th>Students</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.gradeLevel}>
                    <td>{d.displayLabel}</td>
                    <td>{d.count}</td>
                    <td>{d.percentage}%</td>
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
          to="/students/enrollment"
          search={{ tab: 'dashboard' }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--action-secondary-fg))]  hover:text-[rgb(var(--text-primary))] dark:hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          View Enrollment
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  )
}
