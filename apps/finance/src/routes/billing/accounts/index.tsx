/**
 * Admin Student Accounts Page
 *
 * View student billing accounts with balances.
 * Expanded rows show tabbed detail: Ledger | Invoices | Payments.
 * Route: /finance/billing/accounts
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2,
  Users,
  TrendingUp,
  Receipt,
  AlertTriangle,
  Wallet,
  Mail,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import {
  TanstackDataTable,
  createExpandColumn,
  createSelectColumn,
  FilterTabs,
  type BulkAction,
  type ColumnDef,
  StatCard,
  WidgetErrorBoundaryV2,
} from '@edforge/ui'
import { UuidBadge } from '@edforge/archetype'
import { useAppStore } from '../../../stores/app.store'
import {
  useStudentAccounts,
  useStudentLedger,
  useInvoices,
} from '@edforge/finance-services'
import type { StudentAccount, StudentLedgerEntry, Invoice } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { FinancePageHeader, FinanceStatusChip } from '../../../components/shared'
import { formatDate, formatDateDual } from '../../../utils/format-date'

type AccountTab = 'ledger' | 'invoices' | 'payments'

const ACCOUNT_TABS = [
  { key: 'ledger', label: 'Ledger' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'payments', label: 'Payments' },
] satisfies { key: AccountTab; label: string }[]

// ============================================================================
// LEDGER TAB
// ============================================================================

function LedgerTab({ schoolId, accountId }: { schoolId: string; accountId: string }) {
  const ledgerSettings = useFinanceSettings()
  const { format } = useCurrency(ledgerSettings)
  const { data: ledger, isLoading, isError, error, refetch } = useStudentLedger(schoolId, accountId)
  // getStudentLedger now always returns an array; the Array.isArray fallback
  // remains as a defense against a future regression but should never fire.
  const entries: StudentLedgerEntry[] = Array.isArray(ledger) ? ledger : []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]">
          Failed to load ledger entries.
        </p>
        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
          {(error as Error)?.message ?? 'Unknown error'}
        </p>
        <button
          type="button"
          onClick={() => { void refetch() }}
          className="mt-2 text-xs px-2 py-1 rounded border border-[rgb(var(--border-primary))] hover:bg-[rgb(var(--background-secondary))]"
        >
          Retry
        </button>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-[rgb(var(--text-tertiary))]">No ledger entries yet.</p>
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-[rgb(var(--border-primary))]">
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Date</th>
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Type</th>
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Description</th>
          <th className="text-right px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Debit</th>
          <th className="text-right px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Credit</th>
          <th className="text-right px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Balance</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[rgb(var(--border-primary))]">
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td className="px-2 py-1.5 text-xs text-[rgb(var(--text-secondary))]">
              {formatDate(entry.date, ledgerSettings)}
            </td>
            <td className="px-2 py-1.5">
              <FinanceStatusChip status={entry.entryType} size="xs" />
            </td>
            <td className="px-2 py-1.5 text-xs text-[rgb(var(--text-primary))]">
              {entry.description}
            </td>
            <td className="px-2 py-1.5 text-xs text-right text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]">
              {entry.debit > 0 ? format(entry.debit) : ''}
            </td>
            <td className="px-2 py-1.5 text-xs text-right text-[rgb(var(--state-success-fg))] ">
              {entry.credit > 0 ? format(entry.credit) : ''}
            </td>
            <td className="px-2 py-1.5 text-xs text-right font-medium text-[rgb(var(--text-primary))]">
              {format(entry.balance)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ============================================================================
// INVOICES TAB
// ============================================================================

function InvoicesTab({ schoolId, studentId }: { schoolId: string; studentId: string }) {
  const navigate = useNavigate()
  const invSettings = useFinanceSettings()
  const { format } = useCurrency(invSettings)
  const { data, isLoading } = useInvoices(schoolId, { studentId })
  const invoices: Invoice[] = Array.isArray(data) ? data : (data?.items ?? [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] animate-spin" />
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-[rgb(var(--text-tertiary))]">No invoices for this student.</p>
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-[rgb(var(--border-primary))]">
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Invoice #</th>
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Status</th>
          <th className="text-right px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Total</th>
          <th className="text-right px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Due</th>
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Due Date</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[rgb(var(--border-primary))]">
        {invoices.map((invoice) => (
          <tr
            key={invoice.id}
            className="hover:bg-[rgb(var(--background-primary))] cursor-pointer transition-colors"
            onClick={() => navigate({ to: '/invoices/$invoiceId', params: { invoiceId: invoice.id } })}
          >
            <td className="px-2 py-1.5 text-xs font-medium text-[rgb(var(--action-secondary-fg))] ">
              {invoice.invoiceNumber}
            </td>
            <td className="px-2 py-1.5"><FinanceStatusChip status={invoice.status} size="xs" /></td>
            <td className="px-2 py-1.5 text-xs text-right text-[rgb(var(--text-primary))]">
              {format(invoice.grandTotal)}
            </td>
            <td className="px-2 py-1.5 text-xs text-right font-medium">
              <span className={invoice.amountDue > 0 ? 'text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]' : 'text-[rgb(var(--state-success-fg))] '}>
                {format(invoice.amountDue)}
              </span>
            </td>
            <td className="px-2 py-1.5 text-xs text-[rgb(var(--text-secondary))]">
              {formatDateDual(invoice.dueDate, invSettings)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ============================================================================
// PAYMENTS TAB
// ============================================================================

// Sprint 5, Ticket 5.3 will replace this with actual per-student payment records
// using useSchoolPayments filtered by studentAccountId.
function PaymentsTab({ schoolId, studentId }: { schoolId: string; studentId: string }) {
  return <PaymentsFromLedger schoolId={schoolId} studentId={studentId} />
}

function PaymentsFromLedger({ schoolId, studentId }: { schoolId: string; studentId: string }) {
  const paySettings = useFinanceSettings()
  const { format } = useCurrency(paySettings)
  const { data, isLoading } = useInvoices(schoolId, { studentId })
  const invoices: Invoice[] = Array.isArray(data) ? data : (data?.items ?? [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] animate-spin" />
      </div>
    )
  }

  const paidInvoices = invoices.filter((inv) => inv.amountPaid > 0)

  if (paidInvoices.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-[rgb(var(--text-tertiary))]">No payments recorded for this student.</p>
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-[rgb(var(--border-primary))]">
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Invoice #</th>
          <th className="text-right px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Amount Paid</th>
          <th className="text-right px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Grand Total</th>
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[rgb(var(--border-primary))]">
        {paidInvoices.map((inv) => (
          <tr key={inv.id}>
            <td className="px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-primary))]">
              {inv.invoiceNumber}
            </td>
            <td className="px-2 py-1.5 text-xs text-right text-[rgb(var(--state-success-fg))] ">
              {format(inv.amountPaid)}
            </td>
            <td className="px-2 py-1.5 text-xs text-right text-[rgb(var(--text-secondary))]">
              {format(inv.grandTotal)}
            </td>
            <td className="px-2 py-1.5"><FinanceStatusChip status={inv.status} size="xs" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ============================================================================
// ACCOUNT DETAIL (expanded row content)
// ============================================================================

// ============================================================================
// PD.3.5 — OPENING BALANCE SUMMARY CARD
// ============================================================================

function OpeningBalanceCard({
  account,
  format,
  settings,
}: {
  account: StudentAccount
  format: (amount: number) => string
  settings: ReturnType<typeof useFinanceSettings>
}) {
  const [expanded, setExpanded] = useState(false)
  const amount = account.openingBalance ?? 0
  const remaining = account.openingBalanceRemaining ?? amount
  const settled = Math.max(0, amount - remaining)
  const note = account.openingBalanceNote
  const noteIsLong = (note?.length ?? 0) > 80

  return (
    <div className="rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] p-3">
      <div className="flex items-center gap-2 mb-2">
        <Wallet className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
        <p className="text-xs uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
          Opening Balance (Previous Dues)
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">Amount</p>
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            {format(amount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">As of</p>
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            {account.openingBalanceAsOf
              ? formatDate(account.openingBalanceAsOf, settings)
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">Remaining</p>
          <p className={`text-sm font-semibold ${
            remaining > 0
              ? 'text-[rgb(var(--state-warning-fg))]'
              : 'text-[rgb(var(--state-success-fg))]'
          }`}>
            {format(remaining)}
            {settled > 0 && (
              <span className="ml-2 text-xs font-normal text-[rgb(var(--text-tertiary))]">
                ({format(settled)} settled)
              </span>
            )}
          </p>
        </div>
      </div>
      {note && (
        <div className="mt-2 pt-2 border-t border-[rgb(var(--border-primary))]">
          <p className="text-xs text-[rgb(var(--text-tertiary))]">Note</p>
          <p
            className={`text-sm text-[rgb(var(--text-secondary))] ${
              expanded ? '' : 'line-clamp-1'
            }`}
            title={note}
          >
            {note}
          </p>
          {noteIsLong && (
            <button
              type="button"
              className="text-xs text-[rgb(var(--text-link))] hover:underline mt-0.5"
              onClick={() => setExpanded(prev => !prev)}
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function AccountDetail({
  account,
  schoolId,
}: {
  account: StudentAccount
  schoolId: string
}) {
  const detailSettings = useFinanceSettings()
  const { format } = useCurrency(detailSettings)
  const [activeTab, setActiveTab] = useState<AccountTab>('ledger')

  return (
    <div className="px-4 pb-4 space-y-3">
      {/* Pilot Onboarding Hardening PD.3.5 — Opening Balance summary card.
          Rendered only when the operator has set previous-dues on this
          account. The 3-col grid below covers the always-on state. */}
      {account.openingBalance !== undefined && account.openingBalance !== null && (
        <OpeningBalanceCard
          account={account}
          format={format}
          settings={detailSettings}
        />
      )}

      {/* Summary Header */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[rgb(var(--background-primary))] rounded-lg p-3 border border-[rgb(var(--border-primary))]">
          <p className="text-xs uppercase tracking-wider text-[rgb(var(--text-tertiary))]">Outstanding</p>
          <p className={`text-sm font-semibold mt-0.5 ${
            account.balance > 0 ? 'text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]' : 'text-[rgb(var(--state-success-fg))] '
          }`}>
            {format(account.balance)}
          </p>
        </div>
        <div className="bg-[rgb(var(--background-primary))] rounded-lg p-3 border border-[rgb(var(--border-primary))]">
          <p className="text-xs uppercase tracking-wider text-[rgb(var(--text-tertiary))]">Total Paid</p>
          <p className="text-sm font-semibold mt-0.5 text-[rgb(var(--text-primary))]">
            {format(account.totalPaid)}
          </p>
        </div>
        <div className="bg-[rgb(var(--background-primary))] rounded-lg p-3 border border-[rgb(var(--border-primary))]">
          <p className="text-xs uppercase tracking-wider text-[rgb(var(--text-tertiary))]">Last Payment</p>
          <p className="text-sm font-semibold mt-0.5 text-[rgb(var(--text-primary))]">
            {account.lastPaymentDate ? formatDate(account.lastPaymentDate, detailSettings) : 'Never'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <FilterTabs
        tabs={ACCOUNT_TABS}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as AccountTab)}
        className="rounded-lg bg-[rgb(var(--background-tertiary))] p-1"
      />

      {/* Tab Content */}
      <div className="border border-[rgb(var(--border-primary))] rounded-lg overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            {activeTab === 'ledger' && (
              <LedgerTab schoolId={schoolId} accountId={account.id} />
            )}
            {activeTab === 'invoices' && (
              <InvoicesTab schoolId={schoolId} studentId={account.studentId} />
            )}
            {activeTab === 'payments' && (
              <PaymentsTab schoolId={schoolId} studentId={account.studentId} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ============================================================================
// AVATAR HELPER
// ============================================================================

function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

// ============================================================================
// COLUMN DEFINITIONS
// ============================================================================

// Bucket a numeric balance into the facet keys we expose in the dropdown.
function balanceBucket(balance: number): 'zero' | 'low' | 'mid' | 'high' {
  if (balance <= 0) return 'zero'
  if (balance < 500) return 'low'
  if (balance < 2000) return 'mid'
  return 'high'
}

const BALANCE_OPTIONS = [
  { value: 'zero', label: 'No balance' },
  { value: 'low', label: '< 500' },
  { value: 'mid', label: '500 – 2,000' },
  { value: 'high', label: '2,000+' },
]

function buildColumns(format: (amount: number) => string, settings: ReturnType<typeof useFinanceSettings>): ColumnDef<StudentAccount, unknown>[] {
  return [
  createSelectColumn<StudentAccount>(),
  createExpandColumn<StudentAccount>(),
  {
    accessorKey: 'studentName',
    header: 'Student Name',
    size: 280,
    cell: ({ row }) => {
      const account = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-[rgb(var(--background-tertiary))]">
            <img
              src={getAvatarUrl(account.studentId)}
              alt={account.studentName || 'Student'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <span className="font-medium text-[rgb(var(--text-primary))]">
            {account.studentName || (
              <span className="text-[rgb(var(--text-tertiary))] text-xs">
                <UuidBadge value={account.studentId ?? ''} />
              </span>
            )}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'balance',
    header: 'Balance',
    meta: { align: 'right' as const },
    cell: ({ row }) => {
      const account = row.original
      return (
        <span className={account.balance > 0 ? 'text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]' : 'text-[rgb(var(--state-success-fg))] '}>
          {format(account.balance)}
        </span>
      )
    },
  },
  // Hidden column that the Balance facet filters against — derives a stable
  // bucket key from the numeric balance so the dropdown options stay finite.
  {
    id: 'balanceBucket',
    accessorFn: (row) => balanceBucket(row.balance),
    header: 'Balance bucket',
    enableHiding: true,
    enableSorting: false,
    filterFn: 'arrIncludesSome',
    cell: () => null,
    meta: {
      hideable: true,
    },
  },
  {
    accessorKey: 'totalPaid',
    header: 'Total Paid',
    meta: { align: 'right' as const },
    cell: ({ row }) => (
      <span className="text-[rgb(var(--text-secondary))]">
        {format(row.original.totalPaid)}
      </span>
    ),
  },
  {
    accessorKey: 'lastPaymentDate',
    header: 'Last Payment',
    cell: ({ row }) => (
      <span className="text-[rgb(var(--text-secondary))]">
        {row.original.lastPaymentDate ? formatDate(row.original.lastPaymentDate, settings) : 'Never'}
      </span>
    ),
  },
]
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function StudentAccountsPage() {
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const settings = useFinanceSettings()
  const { format, formatCompact } = useCurrency(settings)
  const columns = useMemo(() => buildColumns(format, settings), [format, settings])

  const { data: accounts, isLoading } = useStudentAccounts(schoolId ?? '')

  const accountList: StudentAccount[] = accounts ?? []

  const kpi = useMemo(() => {
    const totalStudents = accountList.length
    const totalOutstanding = accountList.reduce(
      (sum, a) => sum + (a.balance > 0 ? a.balance : 0),
      0,
    )
    const fullyPaidCount = accountList.filter(
      (a) => a.balance <= 0 && a.totalPaid > 0,
    ).length
    const overdueCount = accountList.filter((a) => a.balance > 0).length
    return { totalStudents, totalOutstanding, fullyPaidCount, overdueCount }
  }, [accountList])

  // Bulk action placeholders — server endpoints for bulk statements / balance
  // adjustments are follow-up work; the row-level adjust flow lives in the
  // expanded detail.
  const accountBulkActions = useMemo<BulkAction<StudentAccount>[]>(
    () => [
      {
        id: 'send-statement',
        label: 'Send statement',
        icon: <Mail className="w-4 h-4" />,
        onRun: (rows) =>
          toast.info(`Send statement to ${rows.length} account${rows.length === 1 ? '' : 's'} — coming soon`),
      },
      {
        id: 'adjust-balance',
        label: 'Adjust balance',
        icon: <Pencil className="w-4 h-4" />,
        onRun: (rows) =>
          toast.info(`Adjust balance for ${rows.length} account${rows.length === 1 ? '' : 's'} — coming soon`),
      },
    ],
    [],
  )

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        Select a school to view student accounts.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <FinancePageHeader
        title="Student Accounts"
        subtitle="View student billing accounts, invoices, payments, and ledger history."
      />

      {/* KPI Tiles */}
      <WidgetErrorBoundaryV2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Students"
            value={String(kpi.totalStudents)}
            icon={Users}
            accentColor="rgba(29, 158, 117, 0.12)"
            iconColor="#1D9E75"
            barColor="#1D9E75"
            tag={{ text: `${kpi.totalStudents} accounts`, color: '#1D9E75', bg: 'rgba(29,158,117,0.10)' }}
            loading={isLoading}
          />
          <StatCard
            label="Outstanding"
            value={formatCompact(kpi.totalOutstanding)}
            icon={Receipt}
            accentColor="rgba(239, 159, 39, 0.12)"
            iconColor="#EF9F27"
            barColor="#EF9F27"
            tag={{ text: `${kpi.overdueCount} with balance`, color: '#EF9F27', bg: 'rgba(239,159,39,0.10)' }}
            valueColor="#EF9F27"
            loading={isLoading}
          />
          <StatCard
            label="Fully Paid"
            value={String(kpi.fullyPaidCount)}
            icon={TrendingUp}
            accentColor="rgba(29, 158, 117, 0.12)"
            iconColor="#1D9E75"
            barColor="#1D9E75"
            tag={{ text: 'no balance', color: '#1D9E75', bg: 'rgba(29,158,117,0.10)' }}
            loading={isLoading}
          />
          <StatCard
            label="With Balance"
            value={String(kpi.overdueCount)}
            icon={AlertTriangle}
            accentColor="rgba(226, 75, 74, 0.12)"
            iconColor="#E24B4A"
            barColor="#E24B4A"
            tag={{ text: `${kpi.overdueCount} with balance`, color: '#E24B4A', bg: 'rgba(226,75,74,0.10)' }}
            loading={isLoading}
          />
        </div>
      </WidgetErrorBoundaryV2>

      {/* Data Table */}
      <TanstackDataTable<StudentAccount>
        columns={columns}
        data={accountList}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        tableId="finance.accounts"
        searchPlaceholder="Search by student name..."
        enableSorting={true}
        enableRowSelection
        enableExpanding={true}
        enableColumnVisibility
        pagination={{ pageSize: 20 }}
        pageSizes={[10, 20, 50]}
        defaultSort={[{ id: 'balance', desc: true }]}
        facets={[
          { columnId: 'balanceBucket', title: 'Balance', options: BALANCE_OPTIONS },
        ]}
        initialColumnVisibility={{ balanceBucket: false }}
        bulkActions={accountBulkActions}
        exportOptions={{ filename: 'student-accounts', formats: ['csv'] }}
        renderSubComponent={({ row }) => (
          <AccountDetail account={row.original} schoolId={schoolId} />
        )}
        emptyState={{
          icon: <Users className="w-10 h-10" />,
          title: 'No student accounts found',
          description: 'Student accounts are created automatically when invoices are generated.',
        }}
        maxHeight="calc(100vh - 22rem)"
        className="min-h-96"
      />
    </div>
  )
}
