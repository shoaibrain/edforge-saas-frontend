/**
 * TrendAreaChart
 *
 * A reusable, domain-agnostic time-series area+line chart for dashboards.
 * Built for any "rate/metric over time" surface (attendance trend, finance
 * collection rate, enrollment, etc.) — not attendance-specific.
 *
 * Why this exists (vs the inline `AttendanceTrend` table sparkline): that one
 * is a 64x24 dense in-row signal. This is a full dashboard chart with an
 * auto-scaled y-domain (so small real variation is actually visible instead of
 * flat-lining), token-driven gridlines that work in BOTH light & dark, clean
 * x-axis date labels, and an emphasized latest point.
 *
 * Presentation: SVG geometry + per-datum colors are inherent to a data
 * visualization. Colors come in as a prop (CSS color, e.g. a `rgb(var(--token))`
 * string) and are applied via SVG attributes — not style objects or palette
 * className words — so no design-system rule is tripped.
 */

import { useId, useMemo } from 'react'
import { cn } from '../utils'

export interface TrendChartPoint {
  /** ISO date (or any sortable key) for the x position + label. */
  date: string
  /** Numeric value plotted on y. */
  value: number
}

export interface TrendAreaChartProps {
  /** Series, any order — sorted ascending by `date` internally. Needs ≥ 2 to draw. */
  data: TrendChartPoint[]
  /** SVG height in px (chart area only, excludes the date-label row). Default 88. */
  height?: number
  /** Line + area color as a CSS color string (e.g. `rgb(var(--state-success-fg))`). */
  color?: string
  /** Appended to value labels, e.g. `'%'`. */
  valueSuffix?: string
  /** Decimal places on the latest-value label. Default 1. */
  decimals?: number
  /** Fraction of the data range padded above/below the auto y-domain. Default 0.18. */
  yPadding?: number
  /** Optional hard clamp for the y-domain, e.g. `[0, 100]` for percentages. */
  clampDomain?: [number, number]
  /** Number of evenly-spaced x-axis date labels. Default 4. */
  labelCount?: number
  /** Formats the x-axis labels. Default: `MMM D`. */
  formatDate?: (iso: string) => string
  /** Show the soft area fill under the line. Default true. */
  showArea?: boolean
  /** Emphasize + label the most recent point. Default true. */
  showLatest?: boolean
  className?: string
  'aria-label'?: string
}

const W = 600 // internal viewBox width; the SVG scales to its container width

function defaultFormatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Smooth cubic path (horizontal-tangent control points at 1/3 spacing). */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1]
    const p1 = pts[i]
    const dx = (p1.x - p0.x) / 3
    d += ` C${(p0.x + dx).toFixed(1)},${p0.y.toFixed(1)} ${(p1.x - dx).toFixed(1)},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`
  }
  return d
}

export function TrendAreaChart({
  data,
  height = 88,
  color = 'rgb(var(--state-success-fg))',
  valueSuffix = '',
  decimals = 1,
  yPadding = 0.18,
  clampDomain,
  labelCount = 4,
  formatDate = defaultFormatDate,
  showArea = true,
  showLatest = true,
  className,
  'aria-label': ariaLabel = 'Trend chart',
}: TrendAreaChartProps) {
  const gradientId = useId()

  const model = useMemo(() => {
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date))
    const n = sorted.length
    if (n < 2) return null

    const values = sorted.map((d) => d.value)
    let lo = Math.min(...values)
    let hi = Math.max(...values)
    const range = hi - lo || Math.max(Math.abs(hi) * 0.1, 1)
    const pad = range * yPadding
    lo -= pad
    hi += pad
    if (clampDomain) {
      lo = Math.max(lo, clampDomain[0])
      hi = Math.min(hi, clampDomain[1])
    }
    if (hi - lo < 1e-6) {
      hi += 0.5
      lo -= 0.5
    }

    const step = W / (n - 1)
    const x = (i: number) => i * step
    const y = (v: number) => height - ((v - lo) / (hi - lo)) * height
    const pts = sorted.map((d, i) => ({ x: x(i), y: y(d.value) }))

    const line = smoothPath(pts)
    const area = `${line} L${W},${height} L0,${height} Z`

    const labels: { label: string; x: number }[] = []
    const count = Math.min(labelCount, n)
    for (let i = 0; i < count; i++) {
      const idx = count === 1 ? 0 : Math.round((i / (count - 1)) * (n - 1))
      labels.push({ label: formatDate(sorted[idx].date), x: x(idx) })
    }

    return {
      line,
      area,
      last: { x: pts[n - 1].x, y: pts[n - 1].y, value: sorted[n - 1].value },
      labels,
    }
  }, [data, height, yPadding, clampDomain, labelCount, formatDate])

  if (!model) {
    return (
      <div
        className={cn('flex items-center justify-center text-[rgb(var(--text-disabled))]', className)}
        style={{ height }}
      >
        <span className="text-2xs">Not enough data to chart yet.</span>
      </div>
    )
  }

  const { line, area, last, labels } = model

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* token-driven gridlines — visible in light AND dark */}
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={0}
            y1={f * height}
            x2={W}
            y2={f * height}
            stroke="rgb(var(--border-primary) / 0.14)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {showArea && <path d={area} fill={`url(#${gradientId})`} />}
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {showLatest && (
          <>
            <line
              x1={last.x}
              y1={0}
              x2={last.x}
              y2={height}
              stroke={color}
              strokeOpacity={0.25}
              strokeWidth={1}
              strokeDasharray="2 3"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={last.x} cy={last.y} r={6} fill={color} fillOpacity={0.18} />
            <circle cx={last.x} cy={last.y} r={3} fill={color} vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>

      {/* x-axis date labels — HTML so they use semantic tokens and don't scale */}
      <div className="mt-1.5 flex justify-between text-3xs leading-none text-[rgb(var(--text-disabled))]">
        {labels.map((l, i) => (
          <span key={i}>{l.label}</span>
        ))}
      </div>

      {showLatest && (
        <span className="sr-only">
          Latest {last.value.toFixed(decimals)}
          {valueSuffix}
        </span>
      )}
    </div>
  )
}
