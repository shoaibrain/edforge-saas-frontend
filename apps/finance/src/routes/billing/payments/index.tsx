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
import { Button, TanstackDataTable, createActionsColumn } from '@edforge/ui'
import type { ColumnDef } from '@edforge/ui'
import {
  Loader2,
  CreditCard,
  Eye,
  Ban,
  RotateCcw,
  X,
  AlertTriangle,
  Download,
  MoreVertical,
  Banknote,
} from 'lucide-react'
import { useAppStore } from '../../../stores/app.store'
import {
  useSchoolPayments,
  useVoidPayment,
  useCreateRefund,
  useExportPaymentsCsv,
} from '@edforge/finance-services'
import { formatNPR } from '@edforge/types'
import type { Payment } from '@edforge/types'
import { formatDate } from '../../../utils/format-date'
import { StatusBadge } from '../../../components/StatusBadge'

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
              {formatNPR(payment.amount)}
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
                ? formatDate(payment.paidAt)
                : payment.createdAt
                  ? formatDate(payment.createdAt)
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
        `Exceeds refundable amount (${formatNPR(maxRefundable)})`,
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
              {formatNPR(payment.amount)}
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
                ? formatDate(payment.paidAt)
                : payment.createdAt
                  ? formatDate(payment.createdAt)
                  : '-'}
            </span>
          </div>
          {totalRefunded > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[rgb(var(--text-secondary))]">Already refunded</span>
              <span className="font-medium text-orange-600 dark:text-orange-400">
                {formatNPR(totalRefunded)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t border-[rgb(var(--border-primary))] pt-1.5 mt-1.5">
            <span className="text-[rgb(var(--text-secondary))]">Max refundable</span>
            <span className="font-semibold text-[rgb(var(--text-primary))]">
              {formatNPR(maxRefundable)}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Amount input */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Refund Amount (NPR) *
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
): ColumnDef<Payment, unknown>[] {
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
            {formatNPR(row.original.amount)}
          </span>
        ),
        meta: { align: 'right' as const },
        enableSorting: true,
      },
      {
        accessorKey: 'gateway',
        header: 'Gateway',
        cell: ({ row }) => (
          <span className="text-[rgb(var(--text-secondary))] capitalize">
            {row.original.gateway.replace('_', ' ')}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
              ? formatDate(row.original.paidAt)
              : row.original.createdAt
                ? formatDate(row.original.createdAt)
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
                <a
                  href={`/api/finance/payments/${payment.id}/receipt`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md hover:bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))]"
                  title="View Receipt"
                >
                  <Eye className="w-4 h-4" />
                </a>
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
    [handleVoidClick, handleRefundClick, voidIsPending],
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function PaymentsPage() {
  const navigate = useNavigate()
  const schoolId = useAppStore((s) => s.activeSchoolId)

  const [statusFilter, setStatusFilter] = useState('')
  const [gatewayFilter, setGatewayFilter] = useState('')
  const [actionsOpen, setActionsOpen] = useState(false)

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
  )

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        Select a school to view payments.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Payments</h1>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5">
            View and manage all payment transactions.
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setActionsOpen(!actionsOpen)}
            className="p-2 rounded-lg border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-secondary))] transition-colors"
            aria-label="Actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {actionsOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setActionsOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] shadow-lg py-1">
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false)
                    navigate({ to: '/payments/record' as string })
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-secondary))] transition-colors"
                >
                  <Banknote className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionsOpen(false)
                    if (!schoolId) return
                    exportCsvMutation.mutate(schoolId, {
                      onSuccess: () => toast.success('Payments CSV exported'),
                      onError: () => toast.error('Failed to export payments CSV'),
                    })
                  }}
                  disabled={exportCsvMutation.isPending}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-secondary))] transition-colors disabled:opacity-50"
                >
                  {exportCsvMutation.isPending ? (
                    <Loader2 className="w-4 h-4 text-[rgb(var(--text-tertiary))] animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                  )}
                  Export Data
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Data Table */}
      <TanstackDataTable<Payment>
        columns={columns}
        data={paymentList}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        enableSorting
        pagination={{ pageSize: 20 }}
        searchPlaceholder="Search by receipt #, invoice #, or student..."
        toolbarExtra={
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))]"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))]"
            >
              <option value="">All Gateways</option>
              <option value="esewa">eSewa</option>
              <option value="khalti">Khalti</option>
              <option value="fonepay">FonePay</option>
              <option value="connectips">ConnectIPS</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        }
        emptyState={{
          icon: <CreditCard className="w-10 h-10" />,
          title: 'No payments found',
          description: 'Payments will appear here once students start paying invoices.',
          action: {
            label: 'Record Manual Payment',
            onClick: () => navigate({ to: '/payments/record' as string }),
          },
        }}
        maxHeight="calc(100vh - 15rem)"
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
