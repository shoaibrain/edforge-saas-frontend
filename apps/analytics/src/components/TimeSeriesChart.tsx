/**
 * TimeSeriesChart — multi-metric time series for a tenant.
 *
 * Consumes GET /analytics/tenants/{id} (TenantTimeSeriesResponse).
 *
 * Pivots the backend's array-of-series shape into one row per date so
 * Recharts can render multiple metric lines on a shared X axis. Each
 * point that carries `dateSecondary` (e.g., BS for Nepal tenants with
 * dual-display enabled) is surfaced in the tooltip — A-WS3.T4.
 */

import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  Granularity,
  MetricSeries,
  TenantTimeSeriesResponse,
} from '@edforge/types/analytics'
import { Card, CardContent, CardHeader, Skeleton } from '@edforge/ui'
import { AlertCircle } from 'lucide-react'

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

export interface TimeSeriesChartProps {
  data?: TenantTimeSeriesResponse
  isLoading?: boolean
  error?: Error | null
  granularity: Granularity
  onGranularityChange: (g: Granularity) => void
}

// ----------------------------------------------------------------------------
// Color palette (cycled per metric)
// ----------------------------------------------------------------------------

const PALETTE = [
  '#1D9E75', // green
  '#3B82F6', // blue
  '#EF9F27', // amber
  '#A855F7', // purple
  '#F43F5E', // rose
  '#0EA5E9', // sky
  '#10B981', // emerald
  '#EC4899', // pink
]

// ----------------------------------------------------------------------------
// Pivot helper — flatten array-of-series into one row per date
// ----------------------------------------------------------------------------

interface PivotedRow {
  date: string                              // primary (Gregorian)
  dateSecondary?: { system: string; value: string }
  [metric: string]: number | string | { system: string; value: string } | undefined
}

function pivotToRows(series: MetricSeries[]): {
  rows: PivotedRow[]
  metricKeys: string[]
} {
  const byDate = new Map<string, PivotedRow>()
  for (const m of series) {
    for (const p of m.series) {
      const existing = byDate.get(p.date) ?? ({ date: p.date } as PivotedRow)
      existing[m.metric] = p.value
      // Prefer dateSecondary from any series that carries it (they should agree).
      if (p.dateSecondary && !existing.dateSecondary) {
        existing.dateSecondary = p.dateSecondary
      }
      byDate.set(p.date, existing)
    }
  }
  const rows = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
  return { rows, metricKeys: series.map((s) => s.metric) }
}

// ----------------------------------------------------------------------------
// Tooltip
// ----------------------------------------------------------------------------

interface TooltipPayloadEntry {
  name: string
  value: number
  color: string
  payload: PivotedRow
}

function ChartTooltip({
  active,
  payload,
}: { active?: boolean; payload?: TooltipPayloadEntry[] }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const dateLabel = new Date(row.date + 'T00:00:00Z').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return (
    <div className="rounded-md shadow-lg px-3 py-2 border text-xs bg-[rgb(var(--surface-elevated))] border-[rgb(var(--border-secondary))]">
      <p className="text-[rgb(var(--text-tertiary))]">{dateLabel}</p>
      {row.dateSecondary && (
        <p className="text-[rgb(var(--text-tertiary))] text-xs mt-0.5">
          {row.dateSecondary.value} {row.dateSecondary.system}
        </p>
      )}
      <ul className="mt-1.5 space-y-0.5">
        {payload.map((p) => (
          <li key={p.name} className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[rgb(var(--text-primary))] font-mono">{p.value}</span>
            <span className="text-[rgb(var(--text-tertiary))] truncate">{p.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Granularity toggle
// ----------------------------------------------------------------------------

const GRANULARITIES: Granularity[] = ['day', 'week', 'month']

function GranularityToggle({
  value,
  onChange,
}: { value: Granularity; onChange: (g: Granularity) => void }) {
  return (
    <div className="inline-flex rounded-md ring-1 ring-[rgb(var(--border-secondary))] overflow-hidden">
      {GRANULARITIES.map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            value === g
              ? 'bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))]'
              : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-tertiary))]'
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Metric picker (chip set)
// ----------------------------------------------------------------------------

function MetricPicker({
  allMetrics,
  selected,
  onToggle,
}: {
  allMetrics: string[]
  selected: Set<string>
  onToggle: (metric: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {allMetrics.map((m, i) => {
        const isOn = selected.has(m)
        const color = PALETTE[i % PALETTE.length]
        return (
          <button
            key={m}
            type="button"
            onClick={() => onToggle(m)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 transition-all ${
              isOn
                ? 'bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] ring-[rgb(var(--action-primary-bg))]'
                : 'text-[rgb(var(--text-secondary))] ring-[rgb(var(--border-secondary))] hover:bg-[rgb(var(--surface-tertiary))]'
            }`}
            style={isOn ? undefined : { color }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: color }} />
            {m}
          </button>
        )
      })}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

export function TimeSeriesChart({
  data,
  isLoading,
  error,
  granularity,
  onGranularityChange,
}: TimeSeriesChartProps) {
  const { rows, metricKeys } = useMemo(() => {
    return data ? pivotToRows(data) : { rows: [], metricKeys: [] }
  }, [data])

  // Default selection: first 4 metrics on. User can toggle.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const effectiveSelected = useMemo(() => {
    if (selected.size > 0) return selected
    return new Set(metricKeys.slice(0, 4))
  }, [selected, metricKeys])

  const toggleMetric = (m: string) => {
    setSelected((prev) => {
      const next = new Set(prev.size === 0 ? metricKeys.slice(0, 4) : prev)
      if (next.has(m)) next.delete(m)
      else next.add(m)
      return next
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">Activity over time</h3>
          <GranularityToggle value={granularity} onChange={onGranularityChange} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 py-12 justify-center">
            <AlertCircle className="h-5 w-5 text-[rgb(var(--state-danger-fg))] mt-0.5" />
            <p className="text-sm text-[rgb(var(--state-danger-fg))]">{error.message}</p>
          </div>
        ) : metricKeys.length === 0 ? (
          <p className="text-sm text-[rgb(var(--text-tertiary))] py-12 text-center">
            No activity recorded for this date range yet.
          </p>
        ) : (
          <>
            <div className="mb-3">
              <MetricPicker
                allMetrics={metricKeys}
                selected={effectiveSelected}
                onToggle={toggleMetric}
              />
            </div>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(v) =>
                      new Date(v + 'T00:00:00Z').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'UTC',
                      })
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    width={40}
                    allowDecimals={false}
                  />
                  <RechartsTooltip content={<ChartTooltip />} />
                  {metricKeys.map((m, i) =>
                    effectiveSelected.has(m) ? (
                      <Line
                        key={m}
                        type="monotone"
                        dataKey={m}
                        stroke={PALETTE[i % PALETTE.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    ) : null,
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
