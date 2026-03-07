/**
 * Financial Dashboard Page
 *
 * Overview of school finances with summary cards, breakdowns, and recent payments.
 * Route: /finance/dashboard
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@edforge/ui'
import {
  Loader2,
  BarChart3,
  Download,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Receipt,
  FileText,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../stores/app.store'
import { useDashboardSummary, useExportInvoicesCsv, useFeeStructures } from '@edforge/finance-services'
import { formatNPR, formatNPRShort } from '@edforge/types'
import { formatDate } from '../../utils/format-date'

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

/** Get first day of current month as YYYY-MM-DD */
function firstOfMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

/** Get today as YYYY-MM-DD */
function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export default function FinancialDashboardPage() {
  const navigate = useNavigate()
  const schoolId = useAppStore((s) => s.activeSchoolId)

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [academicYear, setAcademicYear] = useState('')

  const filters = useMemo(() => {
    const f: { from?: string; to?: string; academicYear?: string } = {}
    if (fromDate) f.from = fromDate
    if (toDate) f.to = toDate
    if (academicYear) f.academicYear = academicYear
    return Object.keys(f).length > 0 ? f : undefined
  }, [fromDate, toDate, academicYear])

  const { data: summary, isLoading, isError } = useDashboardSummary(schoolId ?? '', filters)
  const { data: feeStructures } = useFeeStructures(schoolId ?? '')
  const exportCsvMutation = useExportInvoicesCsv()

  // Extract unique academic years from fee structures
  const academicYears = useMemo(() => {
    if (!feeStructures) return []
    const years = new Set(feeStructures.map((f) => f.academicYear).filter(Boolean))
    return [...years].sort().reverse()
  }, [feeStructures])

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

  if (isError) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-400 opacity-60" />
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Failed to load dashboard</p>
        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
          Please check your connection and try again.
        </p>
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

  const recentPayments = summary.recentPayments ?? []

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

        {/* Filters */}
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-tertiary))] mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-tertiary))] mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
          {academicYears.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-tertiary))] mb-1">Academic Year</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="px-3 py-1.5 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="">All Years</option>
                {academicYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}
          {(fromDate || toDate || academicYear) && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); setAcademicYear('') }}
              className="px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
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

        {/* Recent Activity Feed */}
        <RecentActivityFeed
          recentPayments={recentPayments}
          recentInvoices={summary.recentInvoices ?? []}
          onNavigate={(path) => navigate({ to: path as string })}
        />
      </motion.div>
    </div>
  )
}

// ============================================================================
// RECENT ACTIVITY FEED
// ============================================================================

interface ActivityItem {
  type: 'invoice' | 'payment'
  id: string
  description: string
  amount: string
  status: string
  date: string
  navigateTo: string
}

const invoiceStatusBadge: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  issued: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  partially_paid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
}

const paymentStatusBadge: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

function RecentActivityFeed({
  recentPayments,
  recentInvoices,
  onNavigate,
}: {
  recentPayments: Array<{
    id: string
    amount: number
    gateway: string
    status: string
    receiptNumber?: string
    paidAt?: string
    createdAt: string
  }>
  recentInvoices: Array<{
    id: string
    invoiceNumber: string
    studentName: string
    grandTotal: number
    amountDue: number
    status: string
    issuedDate: string
    createdAt: string
  }>
  onNavigate: (path: string) => void
}) {
  const activities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = []

    for (const inv of recentInvoices) {
      items.push({
        type: 'invoice',
        id: `inv-${inv.id}`,
        description: `${inv.invoiceNumber} — ${inv.studentName || 'Unknown'}`,
        amount: formatNPR(inv.grandTotal),
        status: inv.status,
        date: inv.createdAt,
        navigateTo: `/billing/invoices/${inv.id}`,
      })
    }

    for (const pay of recentPayments) {
      items.push({
        type: 'payment',
        id: `pay-${pay.id}`,
        description: `${pay.receiptNumber || pay.id.slice(0, 8)} via ${pay.gateway.replace('_', ' ')}`,
        amount: formatNPR(pay.amount),
        status: pay.status,
        date: pay.paidAt || pay.createdAt,
        navigateTo: '/billing/payments',
      })
    }

    return items
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20)
  }, [recentPayments, recentInvoices])

  return (
    <div className="border border-[rgb(var(--border-primary))] rounded-lg overflow-hidden">
      <div className="bg-[rgb(var(--surface-secondary))] px-4 py-3 border-b border-[rgb(var(--border-primary))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
          Recent Activity
        </h2>
      </div>
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xs text-[rgb(var(--text-tertiary))]">No recent activity.</p>
        </div>
      ) : (
        <div className="divide-y divide-[rgb(var(--border-primary))]">
          {activities.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.navigateTo)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[rgb(var(--surface-secondary))] transition-colors"
            >
              <div className={`p-1.5 rounded-md flex-shrink-0 ${
                item.type === 'invoice'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {item.type === 'invoice'
                  ? <FileText className="w-3.5 h-3.5" />
                  : <CreditCard className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-[rgb(var(--text-primary))] truncate">
                    {item.description}
                  </span>
                  <span className="text-sm font-medium text-[rgb(var(--text-primary))] flex-shrink-0">
                    {item.amount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                    item.type === 'invoice'
                      ? invoiceStatusBadge[item.status] || invoiceStatusBadge.draft
                      : paymentStatusBadge[item.status] || paymentStatusBadge.pending
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-[rgb(var(--text-tertiary))]">
                    {formatDate(item.date)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
