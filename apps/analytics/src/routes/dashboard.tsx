/**
 * Tenant Adoption Dashboard
 *
 * Composes:
 *   - AdoptionReportCard (single-week adoption health)
 *   - TimeSeriesChart    (multi-metric activity trend with dual-date tooltip)
 *   - ExportCsvButton    (presigned CSV download)
 *
 * Tenant context comes from the JWT (X-Tenant-Id is auto-injected on every
 * request by lib/api.ts). The user picks granularity + date range; week-of
 * defaults to the current ISO week.
 */

import { useMemo, useState } from 'react'
import type { Granularity } from '@edforge/types/analytics'
import { useAdoptionReport, useTenantTimeSeries } from '../hooks/useAnalytics'
import { useTenant } from '../hooks/useTenant'
import { useTenantId } from '../hooks/useTenantId'
import { AdoptionReportCard } from '../components/AdoptionReportCard'
import { TimeSeriesChart } from '../components/TimeSeriesChart'
import { ExportCsvButton } from '../components/ExportCsvButton'

// ----------------------------------------------------------------------------
// Date helpers
// ----------------------------------------------------------------------------

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function currentIsoWeekKey(now: Date = new Date()): string {
  // ISO week: Thursday of the week determines the year.
  const tmp = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

function defaultDateRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to)
  from.setDate(to.getDate() - 30)
  return { from: isoDate(from), to: isoDate(to) }
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function Dashboard() {
  const tenantId = useTenantId() ?? ''
  const [{ from, to }] = useState(defaultDateRange)
  const [granularity, setGranularity] = useState<Granularity>('day')
  const weekKey = useMemo(() => currentIsoWeekKey(), [])

  // C3 — pull tenant `createdAt` so the adoption-report's grace-period
  // calculation actually fires. Falls back to workspaceConfirmedAt if
  // present (more accurate "ready for production" anchor). Empty string
  // until the fetch resolves; backend treats missing as not-in-grace,
  // so worst case is one render with stricter thresholds.
  const tenant = useTenant(tenantId, { enabled: Boolean(tenantId) })
  const provisionedAt =
    tenant.data?.workspaceConfirmedAt ?? tenant.data?.createdAt ?? ''

  const adoption = useAdoptionReport(
    { tenantId, week: weekKey, provisionedAt, holidays: [] },
    { enabled: Boolean(tenantId) && Boolean(provisionedAt) },
  )
  const timeSeries = useTenantTimeSeries(
    { tenantId, from, to, granularity },
    { enabled: Boolean(tenantId) },
  )

  if (!tenantId) {
    return (
      <div className="p-8">
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          Loading tenant context…
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
            Adoption dashboard
          </h1>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
            {from} – {to}
          </p>
        </div>
        <ExportCsvButton
          tenantId={tenantId}
          from={from}
          to={to}
          granularity={granularity}
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AdoptionReportCard
            report={adoption.data}
            isLoading={adoption.isLoading}
            error={adoption.error as Error | null}
            onRetry={() => adoption.refetch()}
          />
        </div>
        <div className="lg:col-span-2">
          <TimeSeriesChart
            data={timeSeries.data}
            isLoading={timeSeries.isLoading}
            error={timeSeries.error as Error | null}
            granularity={granularity}
            onGranularityChange={setGranularity}
          />
        </div>
      </div>
    </div>
  )
}
