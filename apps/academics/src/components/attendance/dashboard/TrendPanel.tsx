/**
 * TrendPanel — full-width 30-day recorded-attendance-rate line chart with a 90%
 * target line and an average label. Explicitly a RATE (among sections that
 * recorded), not coverage. Bound to `useAttendanceOverview`'s `trend` +
 * `periodAverages`. SVG colours use semantic tokens via inline style (CSS vars
 * don't resolve in SVG presentation attributes), marked allow-presentation-style.
 */

import { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import type { AttendanceOverviewResponse } from '../../../services/academics.service'
import { useAcademicsI18n } from '../../../lib/i18n'
import { WidgetShell } from './WidgetShell'

interface TrendPanelProps {
  trend: AttendanceOverviewResponse['trend']
  periodAverages: AttendanceOverviewResponse['periodAverages']
}

const TARGET = 90

export function TrendPanel({ trend, periodAverages }: TrendPanelProps) {
  const { t, formatDate, formatNumber } = useAcademicsI18n()
  const sorted = useMemo(() => [...trend].sort((a, b) => a.date.localeCompare(b.date)), [trend])

  // The canonical 30-day average (not a recompute of the visible series).
  const avg = Math.round(periodAverages.last30Days)

  const right = (
    <span className="whitespace-nowrap text-2xs text-[rgb(var(--text-tertiary))]">
      {t('attendance.dashboard.trendAvgTarget', { avg: formatNumber(avg), target: TARGET })}
    </span>
  )

  if (sorted.length === 0) {
    return (
      <WidgetShell
        icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
        title={t('attendance.dashboard.trendTitle')}
        subtitle={t('attendance.dashboard.trendRateNote')}
        right={right}
      >
        <div className="py-8 text-center text-2xs text-[rgb(var(--text-tertiary))]">
          {t('attendance.dashboard.trendEmpty')}
        </div>
      </WidgetShell>
    )
  }

  const width = 760
  const height = 110
  const n = sorted.length
  const step = n > 1 ? width / (n - 1) : width
  const points = sorted.map((d, i) => ({
    x: i * step,
    y: height - (d.attendanceRate / 100) * height,
  }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`
  const targetY = height - (TARGET / 100) * height

  const labelCount = Math.min(5, n)
  const dateLabels: { label: string; key: number }[] = []
  for (let i = 0; i < labelCount; i++) {
    const idx = Math.round((i / Math.max(1, labelCount - 1)) * (n - 1))
    dateLabels.push({ label: formatDate(sorted[idx].date, { month: 'short', day: 'numeric' }), key: idx })
  }

  return (
    <WidgetShell
      icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
      title={t('attendance.dashboard.trendTitle')}
      subtitle={t('attendance.dashboard.trendRateNote')}
      right={right}
    >
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label={t('attendance.dashboard.trendAria', { avg: formatNumber(avg) })}>
        <defs>
          <linearGradient id="attnTrendFill" x1="0" y1="0" x2="0" y2="1">
            {/* allow-presentation-style: token-driven gradient stops */}
            <stop offset="0%" style={{ stopColor: 'rgb(var(--state-success-fg))' }} stopOpacity={0.22} />
            <stop offset="100%" style={{ stopColor: 'rgb(var(--state-success-fg))' }} stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* Target line */}
        <line
          x1="0"
          y1={targetY}
          x2={width}
          y2={targetY}
          strokeDasharray="4 4"
          strokeWidth="1"
          // allow-presentation-style: token-driven target guide
          style={{ stroke: 'rgb(var(--border-primary) / 0.6)' }}
        />
        <path d={areaPath} fill="url(#attnTrendFill)" />
        <path
          d={linePath}
          fill="none"
          strokeWidth="1.5"
          strokeLinejoin="round"
          // allow-presentation-style: token-driven line stroke
          style={{ stroke: 'rgb(var(--state-success-fg))' }}
        />
        {points.length >= 1 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={3}
            // allow-presentation-style: token-driven end dot
            style={{ fill: 'rgb(var(--state-success-fg))' }}
          />
        )}
      </svg>
      <div className="mt-1.5 flex justify-between text-3xs text-[rgb(var(--text-tertiary))]">
        {dateLabels.map((dl) => (
          <span key={dl.key}>{dl.label}</span>
        ))}
      </div>
    </WidgetShell>
  )
}
