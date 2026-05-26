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
} from '@edforge/ui'
import type { ColumnDef } from '@edforge/ui'
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
} from 'lucide-react'
import { useAppStore } from '../../../stores/app.store'
import {
  useSchoolPayments,
  useVoidPayment,
  useCreateRefund,
  useExportPaymentsCsv,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[rgb(var(--surface-primary))] rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              Void Payment
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="p-1 rounded-md hover:bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-tertiary))] disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Payment details */}
        <div className="bg-[rgb(var(--surface-secondary))] rounded-lg p-3 mb-4 space-y-1.5">
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
            className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-red-500/30"
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
            className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[rgb(var(--surface-primary))] rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            Refund Payment
          </h3>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="p-1 rounded-md hover:bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-tertiary))] disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Payment details */}
        <div className="bg-[rgb(var(--surface-secondary))] rounded-lg p-3 mb-4 space-y-1.5">
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
              <span className="font-medium text-orange-600 dark:text-orange-400">
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
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 ${
                amountError
                  ? 'border-red-400 focus:ring-red-500/30'
                  : 'border-[rgb(var(--border-primary))] focus:ring-teal-500/30'
              }`}
              autoFocus
            />
            {amountError && (
              <p className="mt-1 text-xs text-red-500">{amountError}</p>
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
              className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
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
            className="flex-1 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  return useMemo(
    () => [
      {
        accessorKey: 'receiptNumber',
        header: 'Receipt #',
        cell: ({ row }) => (
          <span className="font-medium text-[rgb(var(--text-primary))]">
            {row.original.receiptNumber || row.original.id.slice(0, 8)}
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
            {row.original.invoiceNumber ||
              (row.original.invoiceId
                ? row.original.invoiceId.slice(0, 8)
                : '-')}
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
              {/* View receipt */}
              {payment.receiptNumber && (
                // M1.5-FU.3 — in-MFE navigate now that the receipt page
                // lives at `/payments/$paymentId/receipt` inside Finance
                // MFE (M1.5-FU.2). Resolves through Finance's
                // `basepath: '/finance'` to
                // `/finance/payments/<id>/receipt` — no full-page reload,
                // no cross-MFE shim. Previously used
                // `viewDocument(receiptHref(...))` to jump to a shell-
                // owned route; that shim retires in M1.5-FU.6.
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      to: '/payments/$paymentId/receipt' as string,
                      params: { paymentId: payment.id },
                    })
                  }
                  className="p-1.5 rounded-md hover:bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))]"
                  title="View Receipt"
                  aria-label="View receipt"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              {/* Void (for completed only) */}
              {payment.status === 'completed' && (
                <button
                  onClick={() => handleVoidClick(payment)}
                  disabled={voidIsPending}
                  className="p-1.5 rounded-md hover:bg-red-50 text-red-500 dark:hover:bg-red-900/20 dark:text-red-400"
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
                  className="p-1.5 rounded-md hover:bg-orange-50 text-orange-500 dark:hover:bg-orange-900/20 dark:text-orange-400"
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
    [handleVoidClick, handleRefundClick, voidIsPending, formatAmount, colSettings, navigate],
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
            onClick={() => navigate({ to: '/payments/record' as string })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-[7px] transition-colors hover:opacity-90"
            style={{
              background: 'var(--v2-brand-primary)',
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
            iconColor="var(--v2-text-hint)"
            barColor="var(--v2-text-hint)"
            loading={isLoading}
          />
        </div>
      </WidgetErrorBoundaryV2>

      {/* Filter Strip */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select value={gatewayFilter} onChange={(e) => setGatewayFilter(e.target.value)}>
            {GATEWAY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
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
        className="min-h-[400px]"
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
            onClick: () => navigate({ to: '/payments/record' as string }),
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
