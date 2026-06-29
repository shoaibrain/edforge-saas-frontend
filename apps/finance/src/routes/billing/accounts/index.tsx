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
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
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
import { BulkSendStatementsDrawer } from '../../../components/billing/BulkSendStatementsDrawer'
import { BulkAdjustBalanceDrawer } from '../../../components/billing/BulkAdjustBalanceDrawer'
import type { RowSelectionState } from '@tanstack/react-table'

type AccountTab = 'ledger' | 'invoices' | 'payments'
type Translate = (key: string, options?: Record<string, unknown>) => string

const ACCOUNT_TABS = [
  { key: 'ledger', labelKey: 'studentAccount.tabs.ledger' },
  { key: 'invoices', labelKey: 'studentAccount.tabs.invoices' },
  { key: 'payments', labelKey: 'studentAccount.tabs.payments' },
] satisfies { key: AccountTab; labelKey: string }[]

// ============================================================================
// LEDGER TAB
// ============================================================================

function LedgerTab({ schoolId, accountId }: { schoolId: string; accountId: string }) {
  const { t } = useTranslation('payments')
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
          {t('studentAccount.error.ledgerLoadFailed')}
        </p>
        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
          {(error as Error)?.message ?? t('studentAccount.error.unknown')}
        </p>
        <button
          type="button"
          onClick={() => { void refetch() }}
          className="mt-2 text-xs px-2 py-1 rounded border border-[rgb(var(--border-primary))] hover:bg-[rgb(var(--background-secondary))]"
        >
          {t('actions.retry')}
        </button>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-[rgb(var(--text-tertiary))]">{t('studentAccount.empty.noLedger')}</p>
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-[rgb(var(--border-primary))]">
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">{t('studentAccount.columns.date')}</th>
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">{t('studentAccount.columns.type')}</th>
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">{t('studentAccount.columns.description')}</th>
          <th className="text-right px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">{t('studentAccount.columns.debit')}</th>
          <th className="text-right px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">{t('studentAccount.columns.credit')}</th>
          <th className="text-right px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">{t('studentAccount.columns.balance')}</th>
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
  const { t } = useTranslation('payments')
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
        <p className="text-xs text-[rgb(var(--text-tertiary))]">{t('studentAccount.empty.noInvoices')}</p>
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-[rgb(var(--border-primary))]">
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">{t('studentAccount.columns.invoiceNumber')}</th>
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">{t('studentAccount.columns.status')}</th>
          <th className="text-right px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">{t('studentAccount.columns.total')}</th>
          <th className="text-right px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">{t('studentAccount.columns.due')}</th>
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">{t('studentAccount.columns.dueDate')}</th>
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
  const { t } = useTranslation('payments')
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
        <p className="text-xs text-[rgb(var(--text-tertiary))]">{t('studentAccount.empty.noPayments')}</p>
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-[rgb(var(--border-primary))]">
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">{t('studentAccount.columns.invoiceNumber')}</th>
          <th className="text-right px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">{t('studentAccount.columns.amountPaid')}</th>
          <th className="text-right px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">{t('studentAccount.columns.grandTotal')}</th>
          <th className="text-left px-2 py-1.5 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">{t('studentAccount.columns.status')}</th>
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
  const { t } = useTranslation('payments')
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
          {t('studentAccount.openingBalance.title')}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">{t('studentAccount.openingBalance.amount')}</p>
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            {format(amount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">{t('studentAccount.openingBalance.asOf')}</p>
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            {account.openingBalanceAsOf
              ? formatDate(account.openingBalanceAsOf, settings)
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">{t('studentAccount.openingBalance.remaining')}</p>
          <p className={`text-sm font-semibold ${
            remaining > 0
              ? 'text-[rgb(var(--state-warning-fg))]'
              : 'text-[rgb(var(--state-success-fg))]'
          }`}>
            {format(remaining)}
            {settled > 0 && (
              <span className="ml-2 text-xs font-normal text-[rgb(var(--text-tertiary))]">
                ({t('studentAccount.openingBalance.settled', { amount: format(settled) })})
              </span>
            )}
          </p>
        </div>
      </div>
      {note && (
        <div className="mt-2 pt-2 border-t border-[rgb(var(--border-primary))]">
          <p className="text-xs text-[rgb(var(--text-tertiary))]">{t('studentAccount.openingBalance.note')}</p>
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
              {expanded ? t('studentAccount.openingBalance.showLess') : t('studentAccount.openingBalance.showMore')}
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
  const { t } = useTranslation('payments')
  const detailSettings = useFinanceSettings()
  const { format } = useCurrency(detailSettings)
  const [activeTab, setActiveTab] = useState<AccountTab>('ledger')
  const tabs = ACCOUNT_TABS.map((tab) => ({ key: tab.key, label: t(tab.labelKey) }))

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
          <p className="text-xs uppercase tracking-wider text-[rgb(var(--text-tertiary))]">{t('studentAccount.balance')}</p>
          <p className={`text-sm font-semibold mt-0.5 ${
            account.balance > 0 ? 'text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]' : 'text-[rgb(var(--state-success-fg))] '
          }`}>
            {format(account.balance)}
          </p>
        </div>
        <div className="bg-[rgb(var(--background-primary))] rounded-lg p-3 border border-[rgb(var(--border-primary))]">
          <p className="text-xs uppercase tracking-wider text-[rgb(var(--text-tertiary))]">{t('studentAccount.totalPaid')}</p>
          <p className="text-sm font-semibold mt-0.5 text-[rgb(var(--text-primary))]">
            {format(account.totalPaid)}
          </p>
        </div>
        <div className="bg-[rgb(var(--background-primary))] rounded-lg p-3 border border-[rgb(var(--border-primary))]">
          <p className="text-xs uppercase tracking-wider text-[rgb(var(--text-tertiary))]">{t('studentAccount.lastPayment')}</p>
          <p className="text-sm font-semibold mt-0.5 text-[rgb(var(--text-primary))]">
            {account.lastPaymentDate ? formatDate(account.lastPaymentDate, detailSettings) : t('studentAccount.never')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <FilterTabs
        tabs={tabs}
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

const BALANCE_OPTIONS: Array<{ value: string; label?: string; labelKey?: string }> = [
  { value: 'zero', labelKey: 'studentAccount.balanceBuckets.noBalance' },
  { value: 'low', label: '< 500' },
  { value: 'mid', label: '500-2,000' },
  { value: 'high', label: '2,000+' },
]

function buildColumns(
  format: (amount: number) => string,
  settings: ReturnType<typeof useFinanceSettings>,
  t: Translate,
): ColumnDef<StudentAccount, unknown>[] {
  return [
  createSelectColumn<StudentAccount>(),
  createExpandColumn<StudentAccount>(),
  {
    accessorKey: 'studentName',
    header: t('studentAccount.columns.studentName'),
    size: 280,
    cell: ({ row }) => {
      const account = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-[rgb(var(--background-tertiary))]">
            <img
              src={getAvatarUrl(account.studentId)}
              alt={account.studentName || t('studentAccount.columns.student')}
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
    header: t('studentAccount.columns.balance'),
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
    header: t('studentAccount.columns.balanceBucket'),
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
    header: t('studentAccount.totalPaid'),
    meta: { align: 'right' as const },
    cell: ({ row }) => (
      <span className="text-[rgb(var(--text-secondary))]">
        {format(row.original.totalPaid)}
      </span>
    ),
  },
  {
    accessorKey: 'lastPaymentDate',
    header: t('studentAccount.lastPayment'),
    cell: ({ row }) => (
      <span className="text-[rgb(var(--text-secondary))]">
        {row.original.lastPaymentDate ? formatDate(row.original.lastPaymentDate, settings) : t('studentAccount.never')}
      </span>
    ),
  },
]
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function StudentAccountsPage() {
  const { t } = useTranslation('payments')
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const settings = useFinanceSettings()
  const { format, formatCompact } = useCurrency(settings)
  const columns = useMemo(() => buildColumns(format, settings, t), [format, settings, t])

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

  // Both bulk actions now drive real drawers backed by the D1–D4 finance
  // async-job framework (PR #339): D3 send-statement (#231) and D4
  // adjust-balance (#232).
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [bulkStatementsTarget, setBulkStatementsTarget] = useState<StudentAccount[] | null>(null)
  const [bulkAdjustTarget, setBulkAdjustTarget] = useState<StudentAccount[] | null>(null)

  const accountBulkActions = useMemo<BulkAction<StudentAccount>[]>(
    () => [
      {
        id: 'send-statement',
        label: t('studentAccount.actions.sendStatement'),
        icon: <Mail className="w-4 h-4" />,
        onRun: (rows) => setBulkStatementsTarget(rows),
      },
      {
        id: 'adjust-balance',
        label: t('studentAccount.actions.adjustBalance'),
        icon: <Pencil className="w-4 h-4" />,
        onRun: (rows) => setBulkAdjustTarget(rows),
      },
    ],
    [t],
  )

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        {t('studentAccount.selectSchool')}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <FinancePageHeader
        title={t('studentAccount.pageTitle')}
        subtitle={t('studentAccount.description')}
      />

      {/* KPI Tiles */}
      <WidgetErrorBoundaryV2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t('studentAccount.summary.totalStudents')}
            value={String(kpi.totalStudents)}
            icon={Users}
            accentColor="rgba(29, 158, 117, 0.12)"
            iconColor="#1D9E75"
            barColor="#1D9E75"
            tag={{ text: t('studentAccount.summary.accounts', { count: kpi.totalStudents }), color: '#1D9E75', bg: 'rgba(29,158,117,0.10)' }}
            loading={isLoading}
          />
          <StatCard
            label={t('studentAccount.summary.outstanding')}
            value={formatCompact(kpi.totalOutstanding)}
            icon={Receipt}
            accentColor="rgba(239, 159, 39, 0.12)"
            iconColor="#EF9F27"
            barColor="#EF9F27"
            tag={{ text: t('studentAccount.summary.withBalanceCount', { count: kpi.overdueCount }), color: '#EF9F27', bg: 'rgba(239,159,39,0.10)' }}
            valueColor="#EF9F27"
            loading={isLoading}
          />
          <StatCard
            label={t('studentAccount.summary.fullyPaid')}
            value={String(kpi.fullyPaidCount)}
            icon={TrendingUp}
            accentColor="rgba(29, 158, 117, 0.12)"
            iconColor="#1D9E75"
            barColor="#1D9E75"
            tag={{ text: t('studentAccount.summary.noBalance'), color: '#1D9E75', bg: 'rgba(29,158,117,0.10)' }}
            loading={isLoading}
          />
          <StatCard
            label={t('studentAccount.summary.withBalance')}
            value={String(kpi.overdueCount)}
            icon={AlertTriangle}
            accentColor="rgba(226, 75, 74, 0.12)"
            iconColor="#E24B4A"
            barColor="#E24B4A"
            tag={{ text: t('studentAccount.summary.withBalanceCount', { count: kpi.overdueCount }), color: '#E24B4A', bg: 'rgba(226,75,74,0.10)' }}
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
        searchPlaceholder={t('studentAccount.searchPlaceholder')}
        enableSorting={true}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        enableExpanding={true}
        enableColumnVisibility
        pagination={{ pageSize: 20 }}
        pageSizes={[10, 20, 50]}
        defaultSort={[{ id: 'balance', desc: true }]}
        facets={[
          {
            columnId: 'balanceBucket',
            title: t('studentAccount.columns.balance'),
            options: BALANCE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.labelKey ? t(option.labelKey) : option.label ?? option.value,
            })),
          },
        ]}
        initialColumnVisibility={{ balanceBucket: false }}
        bulkActions={accountBulkActions}
        exportOptions={{ filename: 'student-accounts', formats: ['csv'] }}
        renderSubComponent={({ row }) => (
          <AccountDetail account={row.original} schoolId={schoolId} />
        )}
        emptyState={{
          icon: <Users className="w-10 h-10" />,
          title: t('studentAccount.empty.noAccounts'),
          description: t('studentAccount.empty.noAccountsDescription'),
        }}
        maxHeight="calc(100vh - 22rem)"
        className="min-h-96"
      />

      {/* Bulk Send Statements Drawer (#231 — D3) */}
      <BulkSendStatementsDrawer
        open={!!bulkStatementsTarget}
        accounts={bulkStatementsTarget ?? []}
        schoolId={schoolId ?? ''}
        onClose={() => setBulkStatementsTarget(null)}
        onComplete={() => setRowSelection({})}
      />

      {/* Bulk Adjust Balance Drawer (#232 — D4) */}
      <BulkAdjustBalanceDrawer
        open={!!bulkAdjustTarget}
        accounts={bulkAdjustTarget ?? []}
        schoolId={schoolId ?? ''}
        onClose={() => setBulkAdjustTarget(null)}
        onComplete={() => setRowSelection({})}
      />
    </div>
  )
}
