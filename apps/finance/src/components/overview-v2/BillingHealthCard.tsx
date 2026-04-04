/**
 * BillingHealthCard — V2
 *
 * Unified billing health view merging invoice status (donut),
 * aging spectrum (heatbar), and payment methods into one card.
 * Replaces the separate InvoiceStatusCard + AgingReportCard.
 */

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'
import { CheckCircle2 } from 'lucide-react'
import { AnimatedProgressBar } from '@edforge/ui'
import { formatInvoiceStatus, formatGatewayLabel } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../layouts/FinanceLayout'

// ─── Colors ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  overdue: '#E24B4A',
  draft: '#888780',
  paid: '#1D9E75',
  partially_paid: '#EF9F27',
  issued: '#378ADD',
  cancelled: '#5F5E5A',
  written_off: '#5F5E5A',
}

const GATEWAY_COLORS: Record<string, string> = {
  cash: '#1D9E75',
  cheque: '#7F77DD',
  bank_transfer: '#378ADD',
  esewa: '#60C06E',
  khalti: '#5C2D91',
  fonepay: '#2196F3',
  connectips: '#00BCD4',
  stripe: '#6772E5',
}

// Aging heat spectrum — color intensity increases with age
const AGING_COLORS = [
  '#1D9E75',  // Current — healthy green
  '#EF9F27',  // 1-30 days — amber
  '#E8762B',  // 31-60 days — orange
  '#E24B4A',  // 61-90 days — red
  '#9B2C2C',  // 90+ days — dark red
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgingBucket {
  label: string
  minDays: number
  maxDays: number | null
  count: number
  amount: number
}

interface BillingHealthCardProps {
  invoicesByStatus: Record<string, number>
  totalInvoiceCount: number
  paymentsByGateway: Record<string, number>
  totalPaymentCount: number
  agingReport: AgingBucket[]
  isLoading: boolean
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between">
            <div className="h-3 w-16 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
            <div className="h-3 w-10 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
          </div>
          <div className="h-[3px] rounded-sm v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
        </div>
      ))}
    </div>
  )
}

function SpectrumSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-6 rounded-lg v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
      <div className="flex gap-4 justify-between">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-3 w-12 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
        ))}
      </div>
    </div>
  )
}

// ─── Tooltips ────────────────────────────────────────────────────────────────

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div
      className="rounded-lg border px-3 py-2 text-[11px] shadow-lg"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        color: 'var(--v2-text-secondary)',
      }}
    >
      <div className="font-semibold">{d.name}</div>
      <div style={{ color: 'var(--v2-text-faint)' }}>
        {d.value} invoice{d.value !== 1 ? 's' : ''} · {d.payload.pct}%
      </div>
    </div>
  )
}

// ─── Aging Insight Generator ─────────────────────────────────────────────────

function getAgingInsight(buckets: AgingBucket[], fmtShort: (amount: number) => string): string | null {
  const activeBuckets = buckets.filter((b) => b.count > 0)
  if (activeBuckets.length === 0) return null

  const total = activeBuckets.reduce((sum, b) => sum + b.count, 0)
  const totalAmount = activeBuckets.reduce((sum, b) => sum + b.amount, 0)

  if (activeBuckets.length === 1) {
    const b = activeBuckets[0]
    return `${b.count} invoice${b.count !== 1 ? 's' : ''} overdue (${fmtShort(b.amount)}), all within the ${b.label} window.`
  }

  // Multiple buckets active — find the worst
  const worst = activeBuckets[activeBuckets.length - 1]
  return `${total} invoices overdue totaling ${fmtShort(totalAmount)}. ${worst.count} invoice${worst.count !== 1 ? 's' : ''} in the ${worst.label} bucket need${worst.count === 1 ? 's' : ''} immediate attention.`
}

// ─── Default Buckets ─────────────────────────────────────────────────────────

const DEFAULT_BUCKETS: AgingBucket[] = [
  { label: 'Current', minDays: 0, maxDays: 0, count: 0, amount: 0 },
  { label: '1-30 days', minDays: 1, maxDays: 30, count: 0, amount: 0 },
  { label: '31-60 days', minDays: 31, maxDays: 60, count: 0, amount: 0 },
  { label: '61-90 days', minDays: 61, maxDays: 90, count: 0, amount: 0 },
  { label: '90+ days', minDays: 91, maxDays: null, count: 0, amount: 0 },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function BillingHealthCard({
  invoicesByStatus,
  totalInvoiceCount,
  paymentsByGateway,
  totalPaymentCount,
  agingReport,
  isLoading,
}: BillingHealthCardProps) {
  const settings = useFinanceSettings()
  const { formatShort } = useCurrency(settings)

  const sortedStatuses = useMemo(
    () =>
      Object.entries(invoicesByStatus)
        .filter(([, count]) => count > 0)
        .sort(([, a], [, b]) => b - a),
    [invoicesByStatus]
  )

  const donutData = useMemo(
    () =>
      sortedStatuses.map(([status, count]) => ({
        name: formatInvoiceStatus(status),
        value: count,
        color: STATUS_COLORS[status] || '#888780',
        pct: totalInvoiceCount > 0 ? Math.round((count / totalInvoiceCount) * 100) : 0,
      })),
    [sortedStatuses, totalInvoiceCount]
  )

  const sortedGateways = useMemo(
    () =>
      Object.entries(paymentsByGateway)
        .filter(([, count]) => count > 0)
        .sort(([, a], [, b]) => b - a),
    [paymentsByGateway]
  )

  const buckets = agingReport.length > 0 ? agingReport : DEFAULT_BUCKETS
  const hasAnyOverdue = buckets.some((b) => b.count > 0)
  const agingInsight = useMemo(() => getAgingInsight(buckets, formatShort), [buckets, formatShort])

  // Spectrum bar segment widths — proportional to count, minimum 6% for visibility
  const totalCount = buckets.reduce((s, b) => s + b.count, 0)

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        padding: 18,
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-medium" style={{ color: 'var(--v2-text-secondary)' }}>
          Billing health
        </h3>
        {!isLoading && !hasAnyOverdue && totalInvoiceCount > 0 && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(29,158,117,0.12)', color: '#1D9E75' }}
          >
            <CheckCircle2 className="w-3 h-3" />
            All accounts current
          </span>
        )}
      </div>

      {/* ── Invoice Status: Donut + Legend ── */}
      {isLoading ? (
        <SectionSkeleton />
      ) : totalInvoiceCount === 0 ? (
        <div className="flex flex-col items-center py-6">
          <CheckCircle2 className="w-8 h-8 mb-2" style={{ color: 'var(--v2-text-hint)', opacity: 0.4 }} />
          <p className="text-[12px] font-medium" style={{ color: 'var(--v2-text-hint)' }}>
            No invoices yet
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--v2-text-faint)' }}>
            Create your first invoice to see billing health data.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-4">
            {/* Donut */}
            <div className="flex-shrink-0 relative" style={{ width: 110, height: 110 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={33}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                    animationDuration={700}
                    animationEasing="ease-out"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[15px] font-semibold leading-none" style={{ color: 'var(--v2-text-primary)' }}>
                  {totalInvoiceCount}
                </span>
                <span className="text-[9px] mt-0.5" style={{ color: 'var(--v2-text-faint)' }}>
                  invoices
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-1.5 pt-1">
              {donutData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <span className="text-[11px]" style={{ color: 'var(--v2-text-secondary)' }}>
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] tabular-nums" style={{ color: 'var(--v2-text-faint)' }}>
                      {item.pct}%
                    </span>
                    <span className="text-[11px] font-medium tabular-nums" style={{ color: 'var(--v2-text-secondary)' }}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="my-4" style={{ height: 1, background: 'var(--v2-border-default)' }} />

          {/* ── Aging Spectrum ── */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-medium" style={{ color: 'var(--v2-text-secondary)' }}>
                Aging overview
              </span>
              {hasAnyOverdue && (
                <span className="text-[10px] tabular-nums" style={{ color: 'var(--v2-text-faint)' }}>
                  {totalCount} overdue
                </span>
              )}
            </div>

            {/* Insight text */}
            {agingInsight && (
              <p className="text-[11px] mb-3 leading-relaxed" style={{ color: 'var(--v2-text-hint)' }}>
                {agingInsight}
              </p>
            )}

            {isLoading ? (
              <SpectrumSkeleton />
            ) : !hasAnyOverdue ? (
              <div
                className="rounded-lg px-4 py-3 flex items-center gap-2"
                style={{
                  background: 'rgba(29, 158, 117, 0.06)',
                  border: '1px solid rgba(29, 158, 117, 0.15)',
                }}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#1D9E75' }} />
                <span className="text-[11px]" style={{ color: '#1D9E75' }}>
                  No overdue invoices — all accounts are current.
                </span>
              </div>
            ) : (
              <>
                {/* Spectrum heatbar */}
                <div className="flex rounded-lg overflow-hidden" style={{ height: 24 }}>
                  {buckets.map((bucket, idx) => {
                    // Width proportional to count; minimum 6% for empty segments, proportional for active
                    const isActive = bucket.count > 0
                    const minWidth = 6
                    const proportionalWidth = totalCount > 0 ? (bucket.count / totalCount) * 100 : 0
                    const width = isActive ? Math.max(proportionalWidth, 12) : minWidth
                    const color = AGING_COLORS[idx] || AGING_COLORS[AGING_COLORS.length - 1]

                    return (
                      <div
                        key={bucket.label}
                        className="relative flex items-center justify-center transition-all duration-500"
                        style={{
                          width: `${width}%`,
                          background: isActive ? color : 'var(--v2-bg-elevated)',
                          opacity: isActive ? 1 : 0.4,
                          borderRight: idx < buckets.length - 1 ? '1px solid var(--v2-bg-base)' : undefined,
                        }}
                        title={`${bucket.label}: ${bucket.count} invoices (${formatShort(bucket.amount)})`}
                      >
                        {isActive && bucket.count > 0 && (
                          <span className="text-[10px] font-bold text-white drop-shadow-sm">
                            {bucket.count}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Bucket labels */}
                <div className="flex mt-1.5" style={{ gap: 2 }}>
                  {buckets.map((bucket, idx) => {
                    const isActive = bucket.count > 0
                    const minWidth = 6
                    const proportionalWidth = totalCount > 0 ? (bucket.count / totalCount) * 100 : 0
                    const width = isActive ? Math.max(proportionalWidth, 12) : minWidth
                    const color = AGING_COLORS[idx] || AGING_COLORS[AGING_COLORS.length - 1]

                    return (
                      <div
                        key={bucket.label}
                        className="text-center"
                        style={{ width: `${width}%` }}
                      >
                        <div
                          className="text-[9px] font-medium truncate"
                          style={{ color: isActive ? color : 'var(--v2-text-faint)' }}
                        >
                          {bucket.label}
                        </div>
                        {isActive && (
                          <div className="text-[9px] tabular-nums" style={{ color: 'var(--v2-text-hint)' }}>
                            {formatShort(bucket.amount)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="mb-4" style={{ height: 1, background: 'var(--v2-border-default)' }} />

          {/* ── Payment Methods ── */}
          <div>
            <span className="text-[12px] font-medium" style={{ color: 'var(--v2-text-secondary)' }}>
              Payment methods
            </span>

            {totalPaymentCount === 0 ? (
              <p className="text-[11px] py-3" style={{ color: 'var(--v2-text-hint)' }}>No payments recorded yet.</p>
            ) : (
              <div className="space-y-2 mt-2.5">
                {sortedGateways.map(([gateway, count]) => {
                  const pct = totalPaymentCount > 0 ? (count / totalPaymentCount) * 100 : 0
                  const color = GATEWAY_COLORS[gateway] || '#888780'
                  return (
                    <div key={gateway} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="text-[11px]" style={{ color: 'var(--v2-text-secondary)' }}>
                            {formatGatewayLabel(gateway)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] tabular-nums" style={{ color: 'var(--v2-text-faint)' }}>
                            {pct.toFixed(0)}%
                          </span>
                          <span className="text-[11px] font-medium tabular-nums" style={{ color: 'var(--v2-text-secondary)' }}>
                            {count}
                          </span>
                        </div>
                      </div>
                      <AnimatedProgressBar
                        percentage={pct}
                        color={color}
                        label={`${formatGatewayLabel(gateway)}: ${count} (${pct.toFixed(0)}%)`}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
