/**
 * InvoiceStatusCard — V2
 *
 * Donut pie chart for invoice status distribution
 * with legend, plus payment methods breakdown below.
 */

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'
import { AnimatedProgressBar } from '@edforge/ui'
import { formatInvoiceStatus, formatGatewayLabel } from '@edforge/types'

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

interface InvoiceStatusCardProps {
  invoicesByStatus: Record<string, number>
  totalInvoiceCount: number
  paymentsByGateway: Record<string, number>
  totalPaymentCount: number
  isLoading: boolean
}

function StatusSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between">
            <div className="h-3 w-16 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
            <div className="h-3 w-10 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
          </div>
          <div className="h-1 rounded-sm v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
        </div>
      ))}
    </div>
  )
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
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

export function InvoiceStatusCard({
  invoicesByStatus,
  totalInvoiceCount,
  paymentsByGateway,
  totalPaymentCount,
  isLoading,
}: InvoiceStatusCardProps) {
  const sortedStatuses = Object.entries(invoicesByStatus)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)

  const sortedGateways = Object.entries(paymentsByGateway)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)

  // Donut data
  const donutData = sortedStatuses.map(([status, count]) => ({
    name: formatInvoiceStatus(status),
    value: count,
    color: STATUS_COLORS[status] || '#888780',
    pct: totalInvoiceCount > 0 ? Math.round((count / totalInvoiceCount) * 100) : 0,
  }))

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        padding: 18,
      }}
    >
      {/* Invoice status header */}
      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--v2-text-secondary)' }}>
        Invoice status breakdown
      </h3>

      {isLoading ? (
        <StatusSkeleton />
      ) : totalInvoiceCount === 0 ? (
        <p className="text-xs py-4" style={{ color: 'var(--v2-text-hint)' }}>No invoices yet.</p>
      ) : (
        <div className="flex items-start gap-4">
          {/* Donut chart */}
          <div className="flex-shrink-0 relative" style={{ width: 120, height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={54}
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
            {/* Center label */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            >
              <span className="text-base font-semibold leading-none" style={{ color: 'var(--v2-text-primary)' }}>
                {totalInvoiceCount}
              </span>
              <span className="text-xs mt-0.5" style={{ color: 'var(--v2-text-faint)' }}>
                total
              </span>
            </div>
          </div>

          {/* Legend list */}
          <div className="flex-1 space-y-2 pt-1">
            {donutData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: item.color }}
                  />
                  <span className="text-xs" style={{ color: 'var(--v2-text-secondary)' }}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--v2-text-faint)' }}>
                    {item.pct}%
                  </span>
                  <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--v2-text-secondary)' }}>
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="my-4" style={{ height: 1, background: 'var(--v2-border-default)' }} />

      {/* Payment methods */}
      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--v2-text-secondary)' }}>
        Payment methods
      </h3>

      {isLoading ? (
        <StatusSkeleton />
      ) : totalPaymentCount === 0 ? (
        <p className="text-xs py-4" style={{ color: 'var(--v2-text-hint)' }}>No payments yet.</p>
      ) : (
        <div className="space-y-2.5">
          {sortedGateways.map(([gateway, count]) => {
            const pct = totalPaymentCount > 0 ? (count / totalPaymentCount) * 100 : 0
            const color = GATEWAY_COLORS[gateway] || '#888780'
            return (
              <div key={gateway} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-xs" style={{ color: 'var(--v2-text-secondary)' }}>
                      {formatGatewayLabel(gateway)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--v2-text-faint)' }}>
                      {pct.toFixed(0)}%
                    </span>
                    <span className="text-xs font-medium" style={{ color: 'var(--v2-text-secondary)' }}>
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
  )
}
