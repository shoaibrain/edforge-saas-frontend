/**
 * Admin Student Accounts Page
 *
 * View student billing accounts with balances and payment history.
 * Route: /finance/billing/accounts
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Loader2,
  Users,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useAppStore } from '../../../stores/app.store'
import {
  useStudentAccounts,
  useStudentLedger,
} from '@edforge/finance-services'
import { formatNPR } from '@edforge/types'
import type { StudentAccount, StudentLedgerEntry } from '@edforge/types'
import { formatDate } from '../../../utils/format-date'

// ============================================================================
// INLINE LEDGER DETAIL (expanded row)
// ============================================================================

function AccountLedgerDetail({
  schoolId,
  accountId,
}: {
  schoolId: string
  accountId: string
}) {
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
    <div className="px-4 pb-4">
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
              <td className="px-2 py-1.5 text-xs text-[rgb(var(--text-secondary))] capitalize">
                {entry.entryType.replace('_', ' ')}
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
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function StudentAccountsPage() {
  const schoolId = useAppStore((s) => s.activeSchoolId)

  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: accounts, isLoading } = useStudentAccounts(schoolId ?? '')

  const accountList: StudentAccount[] = Array.isArray(accounts) ? accounts : []
  const filtered = searchTerm
    ? accountList.filter((a) =>
        a.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : accountList

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

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
          View student billing accounts, balances, and payment history.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        <input
          type="text"
          placeholder="Search by student name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--text-tertiary))] opacity-40" />
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">No student accounts found</p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
            Student accounts are created when invoices are generated.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-[rgb(var(--border-primary))] rounded-lg overflow-hidden"
        >
          <table className="w-full">
            <thead>
              <tr className="bg-[rgb(var(--surface-secondary))] border-b border-[rgb(var(--border-primary))]">
                <th className="w-10 px-4 py-3" />
                <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Student Name</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Balance</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Total Paid</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Last Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border-primary))]">
              {filtered.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  isExpanded={expandedId === account.id}
                  onToggle={() => toggleExpand(account.id)}
                  schoolId={schoolId}
                />
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  )
}

// ============================================================================
// ACCOUNT ROW (with inline expand)
// ============================================================================

function AccountRow({
  account,
  isExpanded,
  onToggle,
  schoolId,
}: {
  account: StudentAccount
  isExpanded: boolean
  onToggle: () => void
  schoolId: string
}) {
  return (
    <>
      <tr
        className="hover:bg-[rgb(var(--surface-secondary))] transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-center">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          )}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-[rgb(var(--text-primary))]">
          {account.studentName}
        </td>
        <td className="px-4 py-3 text-sm text-right font-medium">
          <span className={account.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
            {formatNPR(account.balance)}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-right text-[rgb(var(--text-secondary))]">
          {formatNPR(account.totalPaid)}
        </td>
        <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
          {account.lastPaymentDate
            ? formatDate(account.lastPaymentDate)
            : 'Never'}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="bg-[rgb(var(--surface-secondary))]">
            <AccountLedgerDetail schoolId={schoolId} accountId={account.id} />
          </td>
        </tr>
      )}
    </>
  )
}
