/**
 * Admin Payments List Page
 *
 * View all payments for a school with filtering, void, and refund actions.
 * Route: /finance/billing/payments
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Button,
  TanstackDataTable,
  createActionsColumn,
  StatCard,
  WidgetErrorBoundaryV2,
  Select,
} from '@edforge/ui'
import type { ColumnDef } from '@edforge/ui'
import { EntityIdDisplay } from '@edforge/archetype'
import {
  Loader2,
  CreditCard,
  Eye,
  Ban,
  RotateCcw,
  X,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Receipt,
  Download,
} from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import { useAppStore } from '../../../stores/app.store'
import {
  useSchoolPayments,
  useVoidPayment,
  useCreateRefund,
  useExportPaymentsCsv,
  useDownloadReceiptPdf,
} from '@edforge/finance-services'
import { formatGatewayLabel } from '@edforge/types'
import type { Payment } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { formatDate, formatDateDual } from '../../../utils/format-date'
import {
  FinancePageHeader,
  FinanceStatusChip,
  ExportCsvButton,
} from '../../../components/shared'

// ============================================================================
// STYLED DIALOG COMPONENTS
// ============================================================================

/**
 * VoidPaymentDialog
 *
 * Confirms void action with payment details and required reason.
 * Closes on Escape key or backdrop click.
 */
function VoidPaymentDialog({
  payment,
  isPending,
  onConfirm,
  onCancel,
}: {
  payment: Payment
  isPending: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const voidSettings = useFinanceSettings()
  const { format: formatAmount } = useCurrency(voidSettings)
  const [reason, setReason] = useState('')
  const backdropRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onCancel()
    },
    [onCancel, isPending],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current && !isPending) onCancel()
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.40)]"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[rgb(var(--background-primary))] rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[rgb(var(--state-danger-bg)/0.18)] ">
              <AlertTriangle className="w-5 h-5 text-[rgb(var(--state-danger-fg))]" />
            </div>
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              Void Payment
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="p-1 rounded-md hover:bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))] disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Payment details */}
        <div className="bg-[rgb(var(--background-secondary))] rounded-lg p-3 mb-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-[rgb(var(--text-secondary))]">Amount</span>
            <span className="font-medium text-[rgb(var(--text-primary))]">
              {formatAmount(payment.amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[rgb(var(--text-secondary))]">Gateway</span>
            <span className="font-medium text-[rgb(var(--text-primary))] capitalize">
              {payment.gateway.replace('_', ' ')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[rgb(var(--text-secondary))]">Date</span>
            <span className="font-medium text-[rgb(var(--text-primary))]">
              {payment.paidAt
                ? formatDate(payment.paidAt, voidSettings)
                : payment.createdAt
                  ? formatDate(payment.createdAt, voidSettings)
                  : '-'}
            </span>
          </div>
          {payment.receiptNumber && (
            <div className="flex justify-between text-sm">
              <span className="text-[rgb(var(--text-secondary))]">Receipt #</span>
              <span className="font-medium text-[rgb(var(--text-primary))]">
                {payment.receiptNumber}
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
          This will reverse the ledger entry and restore the amount due on the invoice.
          This action cannot be undone.
        </p>

        {/* Reason input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
            Reason for voiding *
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Duplicate payment, data entry error"
            className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            disabled={isPending || !reason.trim()}
            className="flex-1 py-2 rounded-xl bg-[rgb(var(--action-danger-bg))] text-[rgb(var(--action-primary-fg))] text-sm font-semibold hover:brightness-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" />
            ) : (
              <Ban className="w-4 h-4 inline mr-1.5" />
            )}
            Void Payment
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/**
 * RefundPaymentDialog
 *
 * Supports full or partial refund with client-side amount validation
 * and inline error display. Closes on Escape key or backdrop click.
 */
function RefundPaymentDialog({
  payment,
  isPending,
  onConfirm,
  onCancel,
}: {
  payment: Payment
  isPending: boolean
  onConfirm: (amount: number, reason: string) => void
  onCancel: () => void
}) {
  const refundSettings = useFinanceSettings()
  const { format: formatAmount } = useCurrency(refundSettings)
  const [amount, setAmount] = useState(String(payment.amount))
  const [reason, setReason] = useState('')
  const [amountError, setAmountError] = useState('')
  const backdropRef = useRef<HTMLDivElement>(null)

  // Compute the maximum refundable amount (original minus already refunded)
  const totalRefunded = (payment.refunds ?? [])
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0)
  const maxRefundable = payment.amount - totalRefunded

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onCancel()
    },
    [onCancel, isPending],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current && !isPending) onCancel()
  }

  // Validate amount on change
  const handleAmountChange = (value: string) => {
    setAmount(value)
    const parsed = parseFloat(value)
    if (!value.trim() || isNaN(parsed)) {
      setAmountError('')
      return
    }
    if (parsed <= 0) {
      setAmountError('Amount must be greater than 0')
    } else if (parsed > maxRefundable) {
      setAmountError(
        `Exceeds refundable amount (${formatAmount(maxRefundable)})`,
      )
    } else {
      setAmountError('')
    }
  }

  const parsedAmount = parseFloat(amount) || 0
  const isValid =
    parsedAmount > 0 &&
    parsedAmount <= maxRefundable &&
    reason.trim().length > 0

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.40)]"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[rgb(var(--background-primary))] rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            Refund Payment
          </h3>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="p-1 rounded-md hover:bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))] disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Payment details */}
        <div className="bg-[rgb(var(--background-secondary))] rounded-lg p-3 mb-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-[rgb(var(--text-secondary))]">Original amount</span>
            <span className="font-medium text-[rgb(var(--text-primary))]">
              {formatAmount(payment.amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[rgb(var(--text-secondary))]">Gateway</span>
            <span className="font-medium text-[rgb(var(--text-primary))] capitalize">
              {payment.gateway.replace('_', ' ')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[rgb(var(--text-secondary))]">Date</span>
            <span className="font-medium text-[rgb(var(--text-primary))]">
              {payment.paidAt
                ? formatDate(payment.paidAt, refundSettings)
                : payment.createdAt
                  ? formatDate(payment.createdAt, refundSettings)
                  : '-'}
            </span>
          </div>
          {totalRefunded > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[rgb(var(--text-secondary))]">Already refunded</span>
              <span className="font-medium text-[rgb(var(--state-warning-fg))] ">
                {formatAmount(totalRefunded)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t border-[rgb(var(--border-primary))] pt-1.5 mt-1.5">
            <span className="text-[rgb(var(--text-secondary))]">Max refundable</span>
            <span className="font-semibold text-[rgb(var(--text-primary))]">
              {formatAmount(maxRefundable)}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Amount input */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Refund Amount ({refundSettings.currency}) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              max={maxRefundable}
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 ${
                amountError
                  ? 'border-[rgb(var(--state-danger-border))] focus:ring-[rgb(var(--border-focus)/0.35)]'
                  : 'border-[rgb(var(--border-primary))] focus:ring-[rgb(var(--border-focus)/0.35)]'
              }`}
              autoFocus
            />
            {amountError && (
              <p className="mt-1 text-xs text-[rgb(var(--state-danger-fg))]">{amountError}</p>
            )}
          </div>

          {/* Reason input */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Reason for refund..."
              className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={() => onConfirm(parsedAmount, reason.trim())}
            disabled={isPending || !isValid}
            className="flex-1 py-2 rounded-xl bg-[rgb(var(--state-warning-fg))] text-[rgb(var(--action-primary-fg))] text-sm font-semibold hover:brightness-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" />
            ) : null}
            Refund{parsedAmount > 0 && parsedAmount < payment.amount ? ' (Partial)' : ''}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// PER-ROW DOWNLOAD BUTTON (M1.5-FU.4)
// ============================================================================

/**
 * Per-row Download PDF icon button for the Payments list (M1.5-FU.4).
 *
 * Lives as its own component (not inline JSX) so each row gets its OWN
 * `useDownloadReceiptPdf` hook instance — `mutation.isPending` is then
 * naturally scoped per-row. Inline JSX with a single hoisted mutation
 * would make clicking row N's button disable EVERY row's button.
 *
 * Symmetric to `InvoiceDownloadIconButton` on the Invoice list (M1.6).
 * Style mirrors the surrounding View/Void/Refund icon buttons so the
 * actions column reads as a coherent group.
 *
 * Only rendered when `payment.receiptNumber` is set (i.e., the payment
 * is completed and has a receipt to download). Draft/cancelled rows
 * skip this button — see the actions-column cell below.
 */
function ReceiptDownloadIconButton({
  schoolId,
  paymentId,
  receiptNumber,
}: {
  schoolId: string
  paymentId: string
  receiptNumber?: string | null
}) {
  const downloadReceipt = useDownloadReceiptPdf()
  const { t } = useTranslation('payments')
  const label = t('actions.downloadPdf')
  return (
    <button
      type="button"
      onClick={() =>
        downloadReceipt.mutate({
          schoolId,
          paymentId,
          receiptNumber: receiptNumber ?? undefined,
        })
      }
      disabled={downloadReceipt.isPending}
      className="p-1.5 rounded-md hover:bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))] disabled:opacity-50 disabled:cursor-not-allowed"
      // Sprint M1.5-FU.7.5 — `title=` removed; the browser-native tooltip
      // it produced orphaned in the top-left of the page when this row
      // unmounted mid-hover (Issue #22 Hypothesis 2). `aria-label` keeps
      // the accessible name for screen readers. If we ever want a
      // sighted-user tooltip back, mount a Radix Tooltip primitive whose
      // lifecycle is scoped to this row.
      aria-label={label}
    >
      {downloadReceipt.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" data-testid={`receipt-download-spinner-${paymentId}`} />
      ) : (
        <Download className="w-4 h-4" data-testid={`receipt-download-icon-${paymentId}`} />
      )}
    </button>
  )
}

// ============================================================================
// COLUMN DEFINITIONS
// ============================================================================

function usePaymentColumns(
  handleVoidClick: (payment: Payment) => void,
  handleRefundClick: (payment: Payment) => void,
  voidIsPending: boolean,
  formatAmount: (amount: number, opts?: { decimals?: number }) => string,
): ColumnDef<Payment, unknown>[] {
  const colSettings = useFinanceSettings()
  // M1.5-FU.3 — used by the View Receipt eye-icon cell below to
  // navigate in-MFE to /finance/payments/$paymentId/receipt instead
  // of the prior cross-MFE viewDocument shim.
  const navigate = useNavigate()
  // M1.5-FU.4 — used by the per-row Download PDF button. Reading
  // here (not via a prop) keeps the column hook's signature
  // small + symmetric to `navigate` above. The cell renders the
  // button only when schoolId is set, mirroring the rest of the
  // Payments page (queries are gated on schoolId too).
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  return useMemo(
    () => [
      {
        accessorKey: 'receiptNumber',
        header: 'Receipt #',
        cell: ({ row }) => (
          <span className="font-medium text-[rgb(var(--text-primary))]">
            <EntityIdDisplay entity="payment" data={row.original} variant="inline" />
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'studentName',
        header: 'Student',
        cell: ({ row }) => (
          <span className="text-[rgb(var(--text-primary))]">
            {row.original.studentName || '-'}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice #',
        cell: ({ row }) => (
          <span className="text-[rgb(var(--text-secondary))]">
            <EntityIdDisplay
              entity="invoice"
              data={{ invoiceNumber: row.original.invoiceNumber, id: row.original.invoiceId }}
              variant="inline"
            />
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <span className="font-medium text-[rgb(var(--text-primary))]">
            {formatAmount(row.original.amount)}
          </span>
        ),
        meta: { align: 'right' as const },
        enableSorting: true,
      },
      {
        accessorKey: 'gateway',
        header: 'Gateway',
        cell: ({ row }) => (
          <span className="text-[rgb(var(--text-secondary))]">
            {formatGatewayLabel(row.original.gateway)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <FinanceStatusChip status={row.original.status} />,
        meta: { align: 'center' as const },
        enableSorting: false,
      },
      {
        id: 'date',
        header: 'Date',
        accessorFn: (row) => row.paidAt ?? row.createdAt,
        cell: ({ row }) => (
          <span className="text-[rgb(var(--text-secondary))]">
            {row.original.paidAt
              ? formatDateDual(row.original.paidAt, colSettings)
              : row.original.createdAt
                ? formatDateDual(row.original.createdAt, colSettings)
                : '-'}
          </span>
        ),
        enableSorting: true,
      },
      createActionsColumn<Payment>({
        cell: ({ row }) => {
          const payment = row.original
          return (
            <div className="flex items-center justify-end gap-1">
              {/* View receipt + Download PDF — Sprint M1.5-FU.7.2:
                  BOTH buttons require status === 'completed' (not just
                  receiptNumber). Refunded / voided / failed payments
                  may carry a stale receiptNumber from when they were
                  briefly completed, but the backend rejects
                  /payments/:id/receipt + /payments/:id/receipt/pdf
                  with 400 BAD_REQUEST 'Receipt is only available for
                  completed payments'. Hiding the buttons prevents the
                  operator from ever seeing a 400 — a refunded payment
                  has no operator-actionable receipt path anyway.
                  Symmetric for both the View eye-icon (M1.5-FU.3
                  origin) and the Download action (M1.5-FU.4 origin).
                  User-reported "Its not consistently working for all
                  the payments" resolves on the spot (Issue #19). */}
              {payment.status === 'completed' && payment.receiptNumber && (
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      to: '/payments/$paymentId/receipt',
                      params: { paymentId: payment.id },
                    })
                  }
                  className="p-1.5 rounded-md hover:bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))]"
                  // Sprint M1.5-FU.7.5 — `title=` removed for the same
                  // reason as ReceiptDownloadIconButton; aria-label
                  // preserves the accessible name.
                  aria-label="View receipt"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              {activeSchoolId &&
                payment.status === 'completed' &&
                payment.receiptNumber && (
                  <ReceiptDownloadIconButton
                    schoolId={activeSchoolId}
                    paymentId={payment.id}
                    receiptNumber={payment.receiptNumber}
                  />
                )}
              {/* Void (for completed only) */}
              {payment.status === 'completed' && (
                <button
                  onClick={() => handleVoidClick(payment)}
                  disabled={voidIsPending}
                  className="p-1.5 rounded-md hover:bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)] dark:text-[rgb(var(--state-danger-fg))]"
                  title="Void Payment"
                >
                  <Ban className="w-4 h-4" />
                </button>
              )}
              {/* Refund (for completed or partially_refunded) */}
              {(payment.status === 'completed' ||
                payment.status === 'partially_refunded') && (
                <button
                  onClick={() => handleRefundClick(payment)}
                  className="p-1.5 rounded-md hover:bg-[rgb(var(--state-warning-bg)/0.18)] text-[rgb(var(--state-warning-fg))] dark:hover:bg-[rgb(var(--state-warning-bg)/0.18)] "
                  title="Refund"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        },
      }),
    ],
    [handleVoidClick, handleRefundClick, voidIsPending, formatAmount, colSettings, navigate, activeSchoolId],
  )
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Pending', value: 'pending' },
]

const GATEWAY_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Cash', value: 'cash' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'eSewa', value: 'esewa' },
  { label: 'Khalti', value: 'khalti' },
  { label: 'FonePay', value: 'fonepay' },
]

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function PaymentsPage() {
  const navigate = useNavigate()
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const settings = useFinanceSettings()
  const { format, formatCompact } = useCurrency(settings)

  const [statusFilter, setStatusFilter] = useState('')
  const [gatewayFilter, setGatewayFilter] = useState('')

  // Dialog state: which payment is being voided or refunded
  const [voidTarget, setVoidTarget] = useState<Payment | null>(null)
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null)

  const { data: payments, isLoading } = useSchoolPayments(schoolId ?? '', {
    ...(statusFilter && { status: statusFilter }),
    ...(gatewayFilter && { gateway: gatewayFilter }),
  })
  const voidMutation = useVoidPayment(schoolId ?? '')
  const refundMutation = useCreateRefund(schoolId ?? '')
  const exportCsvMutation = useExportPaymentsCsv()

  const paymentList = Array.isArray(payments) ? payments : []

  // KPI computation
  const kpi = useMemo(() => {
    const totalCollected = paymentList
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
    const completedCount = paymentList.filter((p) => p.status === 'completed').length
    const partialRefundCount = paymentList.filter((p) => p.status === 'partially_refunded').length
    const cancelledCount = paymentList.filter((p) => p.status === 'cancelled').length
    return { totalCollected, completedCount, partialRefundCount, cancelledCount }
  }, [paymentList])

  // Void handler: opens dialog instead of window.confirm()
  const handleVoidClick = useCallback((payment: Payment) => {
    setVoidTarget(payment)
  }, [])

  const handleVoidConfirm = async (reason: string) => {
    if (!voidTarget) return
    try {
      await voidMutation.mutateAsync({
        paymentId: voidTarget.id,
        data: { reason },
      })
      toast.success('Payment voided successfully')
      setVoidTarget(null)
    } catch {
      toast.error('Failed to void payment')
    }
  }

  // Refund handler: opens dialog
  const handleRefundClick = useCallback((payment: Payment) => {
    setRefundTarget(payment)
  }, [])

  const handleRefundConfirm = async (amount: number, reason: string) => {
    if (!refundTarget) return
    try {
      await refundMutation.mutateAsync({
        paymentId: refundTarget.id,
        data: { amount, reason },
      })
      toast.success('Refund initiated successfully')
      setRefundTarget(null)
    } catch {
      toast.error('Failed to create refund')
    }
  }

  const columns = usePaymentColumns(
    handleVoidClick,
    handleRefundClick,
    voidMutation.isPending,
    format,
  )

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        Select a school to view payments.
      </div>
    )
  }

  return (
    <div data-v2 className="p-6 space-y-5">
      {/* Header */}
      <FinancePageHeader
        icon={CreditCard}
        title="Payments"
        subtitle="View and manage all payment transactions."
        accentColor="rgba(29, 158, 117, 0.12)"
        iconColor="#1D9E75"
        actions={
          <button
            type="button"
            onClick={() => navigate({ to: '/payments/record' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[7px] transition-colors hover:opacity-90"
            style={{
              background: '#1D9E75',
              color: '#fff',
            }}
          >
            Record Payment
          </button>
        }
      />

      {/* KPI Tiles */}
      <WidgetErrorBoundaryV2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Collected"
            value={formatCompact(kpi.totalCollected)}
            icon={DollarSign}
            accentColor="rgba(29, 158, 117, 0.12)"
            iconColor="#1D9E75"
            barColor="#1D9E75"
            tag={{ text: `${paymentList.length} payments`, color: '#1D9E75', bg: 'rgba(29,158,117,0.10)' }}
            loading={isLoading}
            valueColor="#1D9E75"
          />
          <StatCard
            label="Completed"
            value={String(kpi.completedCount)}
            icon={TrendingUp}
            accentColor="rgba(55, 138, 221, 0.12)"
            iconColor="#378ADD"
            barColor="#378ADD"
            tag={{ text: 'processed', color: '#378ADD', bg: 'rgba(55,138,221,0.10)' }}
            loading={isLoading}
          />
          <StatCard
            label="Partial Refunds"
            value={String(kpi.partialRefundCount)}
            icon={Receipt}
            accentColor="rgba(239, 159, 39, 0.12)"
            iconColor="#EF9F27"
            barColor="#EF9F27"
            tag={{ text: 'pending', color: '#EF9F27', bg: 'rgba(239,159,39,0.10)' }}
            loading={isLoading}
          />
          <StatCard
            label="Cancelled"
            value={String(kpi.cancelledCount)}
            icon={AlertTriangle}
            accentColor="rgba(128, 128, 128, 0.12)"
            iconColor="rgb(var(--text-tertiary))"
            barColor="rgb(var(--text-tertiary))"
            loading={isLoading}
          />
        </div>
      </WidgetErrorBoundaryV2>

      {/* Filter Strip */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            size="sm"
            className="w-40"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v ?? '')}
            options={STATUS_OPTIONS}
          />
          <Select
            size="sm"
            className="w-44"
            value={gatewayFilter}
            onChange={(v) => setGatewayFilter(v ?? '')}
            options={GATEWAY_OPTIONS}
          />
        </div>
        <ExportCsvButton
          onClick={() => {
            if (!schoolId) return
            exportCsvMutation.mutate(schoolId, {
              onSuccess: () => toast.success('Payments CSV exported'),
              onError: () => toast.error('Failed to export payments CSV'),
            })
          }}
          isExporting={exportCsvMutation.isPending}
        />
      </div>

      {/* Data Table */}
      <TanstackDataTable<Payment>
        className="min-h-96"
        columns={columns}
        data={paymentList}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        enableSorting
        pagination={{ pageSize: 20 }}
        searchPlaceholder="Search by receipt #, invoice #, or student..."
        emptyState={{
          icon: <CreditCard className="w-10 h-10" />,
          title: 'No payments found',
          description: 'Payments will appear here once students start paying invoices.',
          action: {
            label: 'Record Manual Payment',
            onClick: () => navigate({ to: '/payments/record' }),
          },
        }}
        maxHeight="calc(100vh - 24rem)"
      />

      {/* Void Payment Dialog */}
      <AnimatePresence>
        {voidTarget && (
          <VoidPaymentDialog
            payment={voidTarget}
            isPending={voidMutation.isPending}
            onConfirm={handleVoidConfirm}
            onCancel={() => setVoidTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Refund Payment Dialog */}
      <AnimatePresence>
        {refundTarget && (
          <RefundPaymentDialog
            payment={refundTarget}
            isPending={refundMutation.isPending}
            onConfirm={handleRefundConfirm}
            onCancel={() => setRefundTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
