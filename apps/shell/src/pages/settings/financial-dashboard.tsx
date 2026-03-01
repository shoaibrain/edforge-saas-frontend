/**
 * Financial Dashboard Page
 *
 * Overview of school finances with summary cards, breakdowns, and recent payments.
 * Route: /settings/financial-dashboard
 */

import { motion } from 'framer-motion'
import { Button } from '@edforge/ui'
import {
  Loader2,
  BarChart3,
  Download,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Receipt,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../stores/app.store'
import { useDashboardSummary, useExportInvoicesCsv } from '../../hooks/usePayments'
import type { Payment } from '@edforge/types'

function formatNPR(amount: number): string {
  return `NPR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatNPRShort(amount: number): string {
  if (amount >= 10_00_000) {
    return `NPR ${(amount / 10_00_000).toFixed(1)}M`
  }
  if (amount >= 1_00_000) {
    return `NPR ${(amount / 1_00_000).toFixed(1)}L`
  }
  return formatNPR(amount)
}

// ============================================================================
// SUMMARY CARD
// ============================================================================

function SummaryCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string
  value: string
  icon: React.ElementType
  colorClass: string
}) {
  return (
    <div className="bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
          {label}
        </span>
        <div className={`p-1.5 rounded-md ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl font-bold text-[rgb(var(--text-primary))]">{value}</p>
    </div>
  )
}

// ============================================================================
// PERCENTAGE BAR
// ============================================================================

function PercentageBar({
  label,
  value,
  total,
  colorClass,
}: {
  label: string
  value: number
  total: number
  colorClass: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[rgb(var(--text-secondary))] capitalize">{label.replace('_', ' ')}</span>
        <span className="font-medium text-[rgb(var(--text-primary))]">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-[rgb(var(--surface-tertiary))] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function FinancialDashboardPage() {
  const schoolId = useAppStore((s) => s.activeSchoolId)

  const { data: summary, isLoading } = useDashboardSummary(schoolId ?? '')
  const exportCsvMutation = useExportInvoicesCsv()

  const handleExportCSV = () => {
    if (!schoolId) return
    exportCsvMutation.mutate(schoolId, {
      onSuccess: () => toast.success('CSV export downloaded'),
      onError: () => toast.error('Failed to export CSV'),
    })
  }

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        Select a school to view the financial dashboard.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--text-tertiary))] opacity-40" />
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">No financial data yet</p>
        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
          Start generating invoices to see your financial dashboard.
        </p>
      </div>
    )
  }

  const invoiceStatuses = summary.invoicesByStatus ?? {}
  const totalInvoiceCount = Object.values(invoiceStatuses).reduce((a, b) => a + b, 0)

  const paymentGateways = summary.paymentsByGateway ?? {}
  const totalPaymentCount = Object.values(paymentGateways).reduce((a, b) => a + b, 0)

  const recentPayments: Payment[] = summary.recentPayments ?? []

  const invoiceStatusColors: Record<string, string> = {
    draft: 'bg-gray-400',
    issued: 'bg-blue-500',
    partially_paid: 'bg-amber-500',
    paid: 'bg-green-500',
    overdue: 'bg-red-500',
    cancelled: 'bg-gray-300',
    written_off: 'bg-gray-500',
  }

  const gatewayColors: Record<string, string> = {
    esewa: 'bg-green-500',
    khalti: 'bg-purple-500',
    fonepay: 'bg-blue-500',
    connectips: 'bg-cyan-500',
    stripe: 'bg-indigo-500',
    cash: 'bg-amber-500',
    bank_transfer: 'bg-teal-500',
    cheque: 'bg-orange-500',
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
              Financial Dashboard
            </h1>
            <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5">
              Overview of school finances and collection metrics.
            </p>
          </div>
          <Button variant="outline" onClick={handleExportCSV} disabled={exportCsvMutation.isPending}>
            {exportCsvMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1.5" />
            )}
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard
            label="Total Invoiced"
            value={formatNPRShort(summary.totalInvoiced)}
            icon={DollarSign}
            colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <SummaryCard
            label="Total Collected"
            value={formatNPRShort(summary.totalCollected)}
            icon={TrendingUp}
            colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          />
          <SummaryCard
            label="Outstanding"
            value={formatNPRShort(summary.outstanding)}
            icon={Receipt}
            colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          />
          <SummaryCard
            label="Overdue"
            value={formatNPRShort(summary.overdue)}
            icon={AlertTriangle}
            colorClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          />
          <SummaryCard
            label="Collection Rate"
            value={`${summary.collectionRate.toFixed(1)}%`}
            icon={BarChart3}
            colorClass="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
          />
        </div>

        {/* Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice Status Breakdown */}
          <div className="border border-[rgb(var(--border-primary))] rounded-lg p-5">
            <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-4">
              Invoice Status Breakdown
            </h2>
            {totalInvoiceCount === 0 ? (
              <p className="text-xs text-[rgb(var(--text-tertiary))]">No invoices yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(invoiceStatuses).map(([status, count]) => (
                  <PercentageBar
                    key={status}
                    label={status}
                    value={count}
                    total={totalInvoiceCount}
                    colorClass={invoiceStatusColors[status] || 'bg-gray-400'}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Payment Methods Breakdown */}
          <div className="border border-[rgb(var(--border-primary))] rounded-lg p-5">
            <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-4">
              Payment Methods Breakdown
            </h2>
            {totalPaymentCount === 0 ? (
              <p className="text-xs text-[rgb(var(--text-tertiary))]">No payments yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(paymentGateways).map(([gateway, count]) => (
                  <PercentageBar
                    key={gateway}
                    label={gateway}
                    value={count}
                    total={totalPaymentCount}
                    colorClass={gatewayColors[gateway] || 'bg-gray-400'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="border border-[rgb(var(--border-primary))] rounded-lg overflow-hidden">
          <div className="bg-[rgb(var(--surface-secondary))] px-4 py-3 border-b border-[rgb(var(--border-primary))]">
            <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              Recent Payments
            </h2>
          </div>
          {recentPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-[rgb(var(--text-tertiary))]">No recent payments.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgb(var(--border-primary))]">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Receipt #</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Gateway</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border-primary))]">
                {recentPayments.slice(0, 10).map((payment) => (
                  <tr key={payment.id} className="hover:bg-[rgb(var(--surface-secondary))] transition-colors">
                    <td className="px-4 py-2.5 text-sm font-medium text-[rgb(var(--text-primary))]">
                      {payment.receiptNumber || payment.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right font-medium text-[rgb(var(--text-primary))]">
                      {formatNPR(payment.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-[rgb(var(--text-secondary))] capitalize">
                      {payment.gateway.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : payment.status === 'failed'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-[rgb(var(--text-secondary))]">
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleDateString()
                        : payment.createdAt
                          ? new Date(payment.createdAt).toLocaleDateString()
                          : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  )
}
