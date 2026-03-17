/**
 * Finance Overview Page (Unified)
 *
 * Main landing page for the Finance module. Merges the previous
 * Overview + Dashboard into a single page with KPI cards, breakdowns,
 * filters, CSV export, and recent activity feed.
 */

import { useState, useMemo } from 'react'
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
import { useAppStore } from '../stores/app.store'
import { useDashboardSummary, useExportInvoicesCsv, useFeeStructures } from '@edforge/finance-services'
import { formatNPR, formatNPRShort } from '@edforge/types'
import { formatDate } from '../utils/format-date'
import { StatusBadge } from '../components/StatusBadge'

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
        <div className={`p-1.5 rounded-md ${colorClass}`} aria-label={label}>
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

function formatStatusLabel(label: string): string {
  return label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

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
        <span className="text-[rgb(var(--text-secondary))]">
          {formatStatusLabel(label)} — {value} ({pct}%)
        </span>
        <span className="font-medium text-[rgb(var(--text-primary))]">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[rgb(var(--surface-tertiary))] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
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
        navigateTo: `/invoices/${inv.id}`,
      })
    }

    for (const pay of recentPayments) {
      items.push({
        type: 'payment',
        id: `pay-${pay.id}`,
        description: `${pay.receiptNumber || pay.id.slice(0, 8)} via ${formatStatusLabel(pay.gateway)}`,
        amount: formatNPR(pay.amount),
        status: pay.status,
        date: pay.paidAt || pay.createdAt,
        navigateTo: '/payments',
      })
    }

    return items
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10)
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
                  <StatusBadge status={item.status} size="xs" />
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

// ============================================================================
// MAIN PAGE
// ============================================================================

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

export function Overview() {
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <DollarSign className="w-12 h-12 mx-auto text-[rgb(var(--text-tertiary))] mb-4" />
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-1">Select a School</h2>
          <p className="text-sm text-[rgb(var(--text-tertiary))]">
            Choose a school from the top navigation to view financial data.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-400 opacity-60" />
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Failed to load financial data</p>
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
          Start generating invoices to see your financial overview.
        </p>
      </div>
    )
  }

  const invoiceStatuses = summary.invoicesByStatus ?? {}
  const totalInvoiceCount = Object.values(invoiceStatuses).reduce((a, b) => a + b, 0)

  const paymentGateways = summary.paymentsByGateway ?? {}
  const totalPaymentCount = Object.values(paymentGateways).reduce((a, b) => a + b, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            Finance Overview
          </h1>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5">
            Manage billing, payments, and financial operations.
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
        recentPayments={summary.recentPayments ?? []}
        recentInvoices={summary.recentInvoices ?? []}
        onNavigate={(path) => navigate({ to: path as string })}
      />
    </div>
  )
}
