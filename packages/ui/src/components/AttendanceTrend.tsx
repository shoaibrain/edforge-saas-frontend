/**
 * AttendanceTrend
 *
 * Inline, enterprise-grade attendance signal for dense tables. Replaces the
 * flat donut ring (AttendanceDonutRing) in the Students roster with a compact
 * trend that degrades gracefully by available data:
 *
 *   series.length >= 2   ->  area sparkline (shape) + % + trend caret
 *   rate only            ->  mini progress bar + % + trend caret
 *   neither              ->  "—"
 *
 * Pure SVG (no per-row chart lib). Threshold colors match AttendanceDonutRing
 * (the surface it replaces): < 80 danger, < 90 warning, >= 90 good — i.e. the
 * 90%-at-risk model used across the academics attendance surface. This is
 * deliberately NOT the @edforge/types getAttendanceColor (60/80), which serves
 * a different, dashboard-level semantic.
 */

import type { CSSProperties } from 'react'
import { cn } from '../utils'

// ============================================================================
// TYPES
// ============================================================================

export type AttendanceTrendDirection = 'improving' | 'declining' | 'stable'

export interface AttendanceTrendProps {
  /** Current / aggregate attendance rate (0–100). */
  rate?: number | null
  /** Daily rate (or present-flag) series, oldest → newest. Sparkline needs ≥ 2. */
  series?: number[] | null
  /** Direction caret. Derived server-side from the record window. */
  trend?: AttendanceTrendDirection
  /** Sparkline / bar width in px — default 64. */
  width?: number
  /** Height in px — default 24. */
  height?: number
  /** Render the numeric "%" beside the spark/bar — default true. */
  showValue?: boolean
  /** BCP-47 locale for the percentage (e.g. 'ne-NP' → Devanagari numerals). */
  locale?: string
  className?: string
  style?: CSSProperties
}

// ============================================================================
// THRESHOLDS — 90%-at-risk model (matches AttendanceDonutRing)
// ============================================================================

const DANGER = '#E24B4A'
const WARNING = '#EF9F27'
const GOOD = '#1D9E75'

function thresholdColor(rate: number): string {
  if (rate < 80) return DANGER
  if (rate < 90) return WARNING
  return GOOD
}

const CARET: Record<AttendanceTrendDirection, { color: string; path: string; label: string }> = {
  improving: { color: GOOD, path: 'M1 7l3.5-4 3.5 4', label: 'improving' },
  declining: { color: DANGER, path: 'M1 3l3.5 4 3.5-4', label: 'declining' },
  stable: { color: 'rgb(var(--text-tertiary))', path: 'M1 5h7', label: 'stable' },
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))

function formatPct(rate: number, locale?: string): string {
  try {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(rate))}%`
  } catch {
    return `${Math.round(rate)}%`
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AttendanceTrend({
  rate,
  series,
  trend,
  width = 64,
  height = 24,
  showValue = true,
  locale,
  className,
  style,
}: AttendanceTrendProps) {
  const hasRate = rate != null && Number.isFinite(rate)
  const clean = (series ?? []).filter((n): n is number => typeof n === 'number' && Number.isFinite(n)).map(clamp)
  const hasSeries = clean.length >= 2

  // Effective rate for color/label: explicit rate wins, else the latest series
  // point (a 1-point series is still a usable rate, just not a sparkline).
  const effRate = hasRate ? clamp(rate as number) : clean.length >= 1 ? clean[clean.length - 1] : null

  if (effRate == null) {
    return (
      <span
        // allow-presentation-style: accepts a caller style override (spread)
        className={cn('text-xs', className)}
        style={{ color: 'rgb(var(--text-tertiary))', ...style }}
        title="No attendance recorded yet"
        aria-label="Attendance: no data"
      >
        —
      </span>
    )
  }

  const color = thresholdColor(effRate)
  const caret = trend ? CARET[trend] : null
  const ariaLabel = `Attendance ${Math.round(effRate)} percent${trend ? `, trend ${caret!.label}` : ''}`

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      style={style}
      role="img"
      aria-label={ariaLabel}
    >
      {hasSeries ? (
        <Spark series={clean} color={color} width={width} height={height} />
      ) : (
        <Bar rate={effRate} color={color} width={width} height={height} />
      )}

      {showValue && (
        <span className="inline-flex items-center gap-1">
          <span
            // allow-presentation-style: value color is the attendance threshold tier
            className="text-xs font-semibold tabular-nums"
            style={{ color }}
          >
            {formatPct(effRate, locale)}
          </span>
          {caret && (
            <svg width="9" height="9" viewBox="0 0 9 10" aria-hidden="true" className="flex-shrink-0">
              <path
                d={caret.path}
                fill="none"
                stroke={caret.color}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      )}
    </div>
  )
}

// ============================================================================
// SPARKLINE — relative shape within the series (level is conveyed by % + color)
// ============================================================================

function Spark({
  series,
  color,
  width,
  height,
}: {
  series: number[]
  color: string
  width: number
  height: number
}) {
  const pad = 2
  const min = Math.min(...series)
  const max = Math.max(...series)
  // Pad the domain so a flat/near-flat series still reads as a calm line.
  const lo = min - 3
  const range = max - min + 6 || 1
  const x = (i: number) => pad + i * ((width - 2 * pad) / (series.length - 1))
  const y = (v: number) => height - pad - ((v - lo) / range) * (height - 2 * pad)

  const line = series.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${x(series.length - 1).toFixed(1)},${height - pad} L${x(0).toFixed(1)},${height - pad} Z`
  const gradId = `att-spark-${Math.random().toString(36).slice(2, 8)}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block flex-shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(series.length - 1).toFixed(1)} cy={y(series[series.length - 1]).toFixed(1)} r="2.2" fill={color} />
    </svg>
  )
}

// ============================================================================
// BAR — degraded fallback when only an aggregate rate is known
// ============================================================================

function Bar({ rate, color, width, height }: { rate: number; color: string; width: number; height: number }) {
  return (
    <div
      // allow-presentation-style: bar width + vertical centering are computed from the size props
      className="relative rounded-full flex-shrink-0 overflow-hidden"
      style={{ width, height: 4, background: 'rgb(var(--border-secondary)/0.5)', marginTop: (height - 4) / 2, marginBottom: (height - 4) / 2 }}
    >
      <div
        // allow-presentation-style: fill width is the attendance rate; color is the threshold tier
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${rate}%`, background: color }}
      />
    </div>
  )
}
