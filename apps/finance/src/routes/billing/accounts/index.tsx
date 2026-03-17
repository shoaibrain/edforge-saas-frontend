/**
 * Admin Student Accounts Page
 *
 * View student billing accounts with balances.
 * Expanded rows show tabbed detail: Ledger | Invoices | Payments.
 * Route: /finance/billing/accounts
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2,
  Users,
  FileText,
  CreditCard,
  BookOpen,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
  TanstackDataTable,
  createExpandColumn,
  type ColumnDef,
} from '@edforge/ui'
import { useAppStore } from '../../../stores/app.store'
import {
  useStudentAccounts,
  useStudentLedger,
  useInvoices,
} from '@edforge/finance-services'
import { formatNPR } from '@edforge/types'
import type { StudentAccount, StudentLedgerEntry, Invoice } from '@edforge/types'
import { StatusBadge } from '../../../components/StatusBadge'
import { formatDate, formatDateDual } from '../../../utils/format-date'

type AccountTab = 'ledger' | 'invoices' | 'payments'

// ============================================================================
// INLINE TABS
// ============================================================================

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
  count?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        active
          ? 'bg-teal-600 text-white'
          : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-primary))]'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {count !== undefined && count > 0 && (
        <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full ${
          active ? 'bg-white/20' : 'bg-[rgb(var(--surface-tertiary,220,220,220))]'
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}

// ============================================================================
// LEDGER TAB
// ============================================================================

function LedgerTab({ schoolId, accountId }: { schoolId: string; accountId: string }) {
  const { data: ledger, isLoading } = useStudentLedger(schoolId, accountId)
  const entries: StudentLedgerEntry[] = Array.isArray(ledger) ? ledger : []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
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
              {formatDate(entry.date)}
            </td>
            <td className="px-2 py-1.5">
              <StatusBadge status={entry.entryType} size="xs" />
            </td>
            <td className="px-2 py-1.5 text-xs text-[rgb(var(--text-primary))]">
              {entry.description}
            </td>
            <td className="px-2 py-1.5 text-xs text-right text-red-600 dark:text-red-400">
              {entry.debit > 0 ? formatNPR(entry.debit) : ''}
            </td>
            <td className="px-2 py-1.5 text-xs text-right text-green-600 dark:text-green-400">
              {entry.credit > 0 ? formatNPR(entry.credit) : ''}
            </td>
            <td className="px-2 py-1.5 text-xs text-right font-medium text-[rgb(var(--text-primary))]">
              {formatNPR(entry.balance)}
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
  const { data, isLoading } = useInvoices(schoolId, { studentId })
  const invoices: Invoice[] = Array.isArray(data) ? data : (data?.items ?? [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
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
            className="hover:bg-[rgb(var(--surface-primary))] cursor-pointer transition-colors"
            onClick={() => navigate({ to: `/invoices/${invoice.id}` as string })}
          >
            <td className="px-2 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400">
              {invoice.invoiceNumber}
            </td>
            <td className="px-2 py-1.5"><StatusBadge status={invoice.status} size="xs" /></td>
            <td className="px-2 py-1.5 text-xs text-right text-[rgb(var(--text-primary))]">
              {formatNPR(invoice.grandTotal)}
            </td>
            <td className="px-2 py-1.5 text-xs text-right font-medium">
              <span className={invoice.amountDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                {formatNPR(invoice.amountDue)}
              </span>
            </td>
            <td className="px-2 py-1.5 text-xs text-[rgb(var(--text-secondary))]">
              {formatDateDual(invoice.dueDate)}
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
  const { data, isLoading } = useInvoices(schoolId, { studentId })
  const invoices: Invoice[] = Array.isArray(data) ? data : (data?.items ?? [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
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
            <td className="px-2 py-1.5 text-xs text-right text-green-600 dark:text-green-400">
              {formatNPR(inv.amountPaid)}
            </td>
            <td className="px-2 py-1.5 text-xs text-right text-[rgb(var(--text-secondary))]">
              {formatNPR(inv.grandTotal)}
            </td>
            <td className="px-2 py-1.5"><StatusBadge status={inv.status} size="xs" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ============================================================================
// ACCOUNT DETAIL (expanded row content)
// ============================================================================

function AccountDetail({
  account,
  schoolId,
}: {
  account: StudentAccount
  schoolId: string
}) {
  const [activeTab, setActiveTab] = useState<AccountTab>('ledger')

  return (
    <div className="px-4 pb-4 space-y-3">
      {/* Summary Header */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[rgb(var(--surface-primary))] rounded-lg p-3 border border-[rgb(var(--border-primary))]">
          <p className="text-[10px] uppercase tracking-wider text-[rgb(var(--text-tertiary))]">Outstanding</p>
          <p className={`text-sm font-semibold mt-0.5 ${
            account.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          }`}>
            {formatNPR(account.balance)}
          </p>
        </div>
        <div className="bg-[rgb(var(--surface-primary))] rounded-lg p-3 border border-[rgb(var(--border-primary))]">
          <p className="text-[10px] uppercase tracking-wider text-[rgb(var(--text-tertiary))]">Total Paid</p>
          <p className="text-sm font-semibold mt-0.5 text-[rgb(var(--text-primary))]">
            {formatNPR(account.totalPaid)}
          </p>
        </div>
        <div className="bg-[rgb(var(--surface-primary))] rounded-lg p-3 border border-[rgb(var(--border-primary))]">
          <p className="text-[10px] uppercase tracking-wider text-[rgb(var(--text-tertiary))]">Last Payment</p>
          <p className="text-sm font-semibold mt-0.5 text-[rgb(var(--text-primary))]">
            {account.lastPaymentDate ? formatDate(account.lastPaymentDate) : 'Never'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[rgb(var(--surface-tertiary,240,240,240))] rounded-lg p-1">
        <TabButton
          active={activeTab === 'ledger'}
          onClick={() => setActiveTab('ledger')}
          icon={BookOpen}
          label="Ledger"
        />
        <TabButton
          active={activeTab === 'invoices'}
          onClick={() => setActiveTab('invoices')}
          icon={FileText}
          label="Invoices"
        />
        <TabButton
          active={activeTab === 'payments'}
          onClick={() => setActiveTab('payments')}
          icon={CreditCard}
          label="Payments"
        />
      </div>

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
// COLUMN DEFINITIONS
// ============================================================================

const columns: ColumnDef<StudentAccount, unknown>[] = [
  createExpandColumn<StudentAccount>(),
  {
    accessorKey: 'studentName',
    header: 'Student Name',
    cell: ({ row }) => {
      const account = row.original
      return (
        <span className="font-medium text-[rgb(var(--text-primary))]">
          {account.studentName || (
            <span className="text-[rgb(var(--text-tertiary))] font-mono text-xs" title={account.studentId}>
              {account.studentId?.slice(0, 8) || '-'}
            </span>
          )}
        </span>
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
        <span className={account.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
          {formatNPR(account.balance)}
        </span>
      )
    },
  },
  {
    accessorKey: 'totalPaid',
    header: 'Total Paid',
    meta: { align: 'right' as const },
    cell: ({ row }) => (
      <span className="text-[rgb(var(--text-secondary))]">
        {formatNPR(row.original.totalPaid)}
      </span>
    ),
  },
  {
    accessorKey: 'lastPaymentDate',
    header: 'Last Payment',
    cell: ({ row }) => (
      <span className="text-[rgb(var(--text-secondary))]">
        {row.original.lastPaymentDate ? formatDate(row.original.lastPaymentDate) : 'Never'}
      </span>
    ),
  },
]

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function StudentAccountsPage() {
  const schoolId = useAppStore((s) => s.activeSchoolId)

  const { data: accounts, isLoading } = useStudentAccounts(schoolId ?? '')

  const accountList: StudentAccount[] = accounts ?? []

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        Select a school to view student accounts.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Student Accounts</h1>
        <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5">
          View student billing accounts, invoices, payments, and ledger history.
        </p>
      </div>

      {/* Data Table */}
      <TanstackDataTable<StudentAccount>
        columns={columns}
        data={accountList}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        searchPlaceholder="Search by student name..."
        enableExpanding={true}
        pagination={{ pageSize: 20 }}
        renderSubComponent={({ row }) => (
          <AccountDetail account={row.original} schoolId={schoolId} />
        )}
        emptyState={{
          icon: <Users className="w-10 h-10" />,
          title: 'No student accounts found',
          description: 'Student accounts are created automatically when invoices are generated.',
        }}
      />
    </div>
  )
}
