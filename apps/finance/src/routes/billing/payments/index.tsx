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
  createSelectColumn,
  IdentityCell,
  PageHeader,
  StatBand,
  type StatMetric,
  Select,
  DataTableMoreFilters,
} from '@edforge/ui'
import type { BulkAction, ColumnDef } from '@edforge/ui'
import type { RowSelectionState } from '@tanstack/react-table'
import { EntityIdDisplay } from '@edforge/archetype'
import {
  Loader2,
  CreditCard,
  Eye,
  Ban,
  RotateCcw,
  X,
  AlertTriangle,
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
import { useSchoolGradeOptions } from '../../../hooks/useSchoolGradeOptions'
import { formatGatewayLabel } from '@edforge/types'
import type { Payment } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { formatDate, formatDateDual } from '../../../utils/format-date'
import { FinanceStatusChip, ExportCsvButton } from '../../../components/shared'
import { BulkVoidPaymentsDrawer } from '../../../components/billing/BulkVoidPaymentsDrawer'
import { BulkSendReceiptsDrawer } from '../../../components/billing/BulkSendReceiptsDrawer'
import { BulkReceiptPdfExportDrawer } from '../../../components/billing/BulkReceiptPdfExportDrawer'

type Translate = (key: string, options?: Record<string, unknown>) => string

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
  const { t } = useTranslation('payments')
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="void-payment-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[rgb(var(--state-danger-bg)/0.18)] ">
              <AlertTriangle className="w-5 h-5 text-[rgb(var(--state-danger-fg))]" />
            </div>
            <h3 id="void-payment-title" className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              {t('paymentsList.voidPayment')}
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="p-1 rounded-md hover:bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))] disabled:opacity-50"
            aria-label={t('actions.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Payment details */}
        <div className="bg-[rgb(var(--background-secondary))] rounded-lg p-3 mb-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-[rgb(var(--text-secondary))]">{t('lineItems.amount')}</span>
            <span className="font-medium text-[rgb(var(--text-primary))]">
              {formatAmount(payment.amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[rgb(var(--text-secondary))]">{t('paymentsList.gateway')}</span>
            <span className="font-medium text-[rgb(var(--text-primary))] capitalize">
              {formatGatewayForLocale(payment.gateway, t)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[rgb(var(--text-secondary))]">{t('paymentsList.date')}</span>
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
              <span className="text-[rgb(var(--text-secondary))]">{t('receipt.receiptNumber')}</span>
              <span className="font-medium text-[rgb(var(--text-primary))]">
                {payment.receiptNumber}
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
          {t('paymentsList.voidDescription')}
        </p>

        {/* Reason input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
            {t('paymentsList.voidReason')}
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('paymentsList.voidReasonPlaceholder')}
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
            {t('actions.cancel')}
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
            {t('paymentsList.voidPayment')}
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
  const { t } = useTranslation('payments')
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
      setAmountError(t('paymentsList.amountGreaterThanZero'))
    } else if (parsed > maxRefundable) {
      setAmountError(
        t('paymentsList.exceedsRefundable', {
          amount: formatAmount(maxRefundable),
        }),
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="refund-payment-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 id="refund-payment-title" className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            {t('paymentsList.refundPayment')}
          </h3>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="p-1 rounded-md hover:bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))] disabled:opacity-50"
            aria-label={t('actions.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Payment details */}
        <div className="bg-[rgb(var(--background-secondary))] rounded-lg p-3 mb-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-[rgb(var(--text-secondary))]">{t('paymentsList.originalAmount')}</span>
            <span className="font-medium text-[rgb(var(--text-primary))]">
              {formatAmount(payment.amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[rgb(var(--text-secondary))]">{t('paymentsList.gateway')}</span>
            <span className="font-medium text-[rgb(var(--text-primary))] capitalize">
              {formatGatewayForLocale(payment.gateway, t)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[rgb(var(--text-secondary))]">{t('paymentsList.date')}</span>
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
              <span className="text-[rgb(var(--text-secondary))]">{t('paymentsList.alreadyRefunded')}</span>
              <span className="font-medium text-[rgb(var(--state-warning-fg))] ">
                {formatAmount(totalRefunded)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t border-[rgb(var(--border-primary))] pt-1.5 mt-1.5">
            <span className="text-[rgb(var(--text-secondary))]">{t('paymentsList.maxRefundable')}</span>
            <span className="font-semibold text-[rgb(var(--text-primary))]">
              {formatAmount(maxRefundable)}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Amount input */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              {t('paymentsList.refundAmount', { currency: refundSettings.currency })}
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
              {t('paymentsList.reasonRequired')}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t('paymentsList.refundReasonPlaceholder')}
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
            {t('actions.cancel')}
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
            {parsedAmount > 0 && parsedAmount < payment.amount
              ? t('paymentsList.refundPartial')
              : t('paymentsList.refundPayment')}
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
  const { t } = useTranslation('payments')
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
      // Sprint G.1 — row selection on payments table. Enables future
      // bulk-receipt-pdf-export (Sprint G.3/G.4) and any bulk-void /
      // bulk-export flows downstream.
      createSelectColumn<Payment>(),
      {
        accessorKey: 'receiptNumber',
        header: t('receipt.receiptNumber'),
        cell: ({ row }) => (
          <span className="font-medium text-[rgb(var(--text-primary))]">
            <EntityIdDisplay entity="payment" data={row.original} variant="inline" />
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'studentName',
        header: t('receipt.studentName'),
        cell: ({ row }) => {
          const name = row.original.studentName
          if (!name) return <span className="text-[rgb(var(--text-tertiary))]">—</span>
          return <IdentityCell name={name} avatarSrc={getStudentAvatarUrl(name)} />
        },
        enableSorting: true,
      },
      {
        accessorKey: 'invoiceNumber',
        header: t('invoices.invoiceNumber'),
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
        header: t('lineItems.amount'),
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
        header: t('paymentsList.gateway'),
        cell: ({ row }) => (
          <span className="text-[rgb(var(--text-secondary))]">
            {formatGatewayForLocale(row.original.gateway, t)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'status',
        header: t('invoices.status'),
        cell: ({ row }) => <FinanceStatusChip status={row.original.status} />,
        meta: { align: 'center' as const },
        enableSorting: false,
      },
      {
        id: 'date',
        header: t('paymentsList.date'),
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
                  aria-label={t('paymentsList.viewReceipt')}
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
                  title={t('paymentsList.voidPayment')}
                  aria-label={t('paymentsList.voidPayment')}
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
                  title={t('paymentsList.refundPayment')}
                  aria-label={t('paymentsList.refundPayment')}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        },
      }),
    ],
    [handleVoidClick, handleRefundClick, voidIsPending, formatAmount, colSettings, navigate, activeSchoolId, t],
  )
}

// Sprint Payments UX cleanup — operator-visible avatar in the student
// column (matches the Billing Accounts page pattern). DiceBear adventurer
// seeded by studentName; deterministic.
function getStudentAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

function formatGatewayForLocale(gateway: string, t: Translate): string {
  const gatewayKey = gateway === 'bank_transfer'
    ? 'bankTransfer'
    : gateway === 'connect_ips'
      ? 'connectips'
      : gateway
  return t(`gateway.${gatewayKey}`, {
    defaultValue: formatGatewayLabel(gateway),
  })
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function PaymentsPage() {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const settings = useFinanceSettings()
  const { format, formatCompact } = useCurrency(settings)

  const [statusFilter, setStatusFilter] = useState('')
  const [gatewayFilter, setGatewayFilter] = useState('')
  // Sprint B.5 — grade filter routes the backend through GSI14 (sparse;
  // unresolved-snapshot rows do NOT appear on this filter).
  const [gradeFilter, setGradeFilter] = useState('')

  // Sprint G.1 — row selection state (controlled by DataTable). Foundation
  // for future bulk-receipt-pdf-export (Sprint G.3/G.4); the empty bulk-
  // actions slot below renders only when at least one row is selected.
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Dialog state: which payment is being voided or refunded
  const [voidTarget, setVoidTarget] = useState<Payment | null>(null)
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null)

  // Sprint B-tail: list page opts into the Unknown-grade chip so operators
  // can audit rows the A.5 backfill flagged `gradeLevelResolutionStatus:
  // 'unresolved'` (absent from GSI14; invisible to regular grade chips).
  const { options: gradeOptions } = useSchoolGradeOptions(schoolId ?? null, {
    includeUnknownOption: true,
  })

  const { data: payments, isLoading } = useSchoolPayments(schoolId ?? '', {
    ...(statusFilter && { status: statusFilter }),
    ...(gatewayFilter && { gateway: gatewayFilter }),
    ...(gradeFilter && { gradeLevel: gradeFilter }),
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
      toast.success(t('paymentsList.voidSuccess'))
      setVoidTarget(null)
    } catch {
      toast.error(t('paymentsList.voidFailed'))
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
      toast.success(t('paymentsList.refundSuccess'))
      setRefundTarget(null)
    } catch {
      toast.error(t('paymentsList.refundFailed'))
    }
  }

  const columns = usePaymentColumns(
    handleVoidClick,
    handleRefundClick,
    voidMutation.isPending,
    format,
  )

  // Bulk actions on the Payments list:
  //   - Void (#229, cheap-path fan-out)
  //   - Send receipt (#230, D1 of the async-job framework, PR #339)
  //   - Download PDF (ZIP) — Sprint G.4, wires G.2 backend worker via
  //     the shared BulkReceiptPdfExportDrawer
  const [bulkVoidTarget, setBulkVoidTarget] = useState<Payment[] | null>(null)
  const [bulkReceiptTarget, setBulkReceiptTarget] = useState<Payment[] | null>(null)
  // Sprint G.4 — receipt-side counterpart of the invoice-list
  // bulkPdfExportTarget state. Stored as string[] because the drawer
  // takes flat paymentIds (not full Payment objects — no client-side
  // eligibility branching; the G.2 worker's status='completed' filter
  // is the source of truth).
  const [bulkPdfExportTarget, setBulkPdfExportTarget] = useState<string[] | null>(null)

  const paymentBulkActions = useMemo<BulkAction<Payment>[]>(
    () => [
      {
        id: 'void',
        label: t('paymentsList.voidSelected'),
        icon: <Ban className="w-4 h-4" />,
        tone: 'critical',
        onRun: (rows) => setBulkVoidTarget(rows),
      },
      {
        id: 'send-receipt',
        label: t('paymentsList.sendReceipt'),
        icon: <Receipt className="w-4 h-4" />,
        onRun: (rows) => setBulkReceiptTarget(rows),
      },
      {
        // Sprint G.4 — bulk PDF (ZIP) export of RECEIPTS.
        // Symmetric to the invoice-list `pdf-export` action.
        // Selection set comes from row checkboxes; the G.2 worker
        // filters non-completed payments as `skipped` (not `failed`).
        // Backend dedupes at the schema layer; we still pass an
        // Array.from(new Set()) here to keep any per-page duplication
        // out of the initial ID array.
        id: 'pdf-export',
        label: t('paymentsList.bulkReceiptPdfExport.menuLabel'),
        icon: <Download className="w-4 h-4" />,
        onRun: (rows) =>
          setBulkPdfExportTarget(Array.from(new Set(rows.map((r) => r.id)))),
      },
    ],
    [t],
  )

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        {t('paymentsList.selectSchool')}
      </div>
    )
  }


  const STATUS_PRESETS = [
    { label: t('filters.allStatuses'), value: '' },
    { label: t('status.completed'), value: 'completed' },
    { label: t('status.failed'), value: 'failed' },
    { label: t('status.cancelled'), value: 'cancelled' },
    { label: t('status.refunded'), value: 'refunded' },
    { label: t('status.pending'), value: 'pending' },
  ]

  // ── StatBand metrics (calm; attention only via state) ────────────────────
  const metrics: StatMetric[] = [
    {
      label: t('overview.kpi.collected'),
      value: formatCompact(kpi.totalCollected),
      iconSignature: 'finance',
      state: 'normal',
      primary: true,
      sub: t('paymentsList.paymentCount', { count: paymentList.length }),
    },
    {
      label: t('status.completed'),
      value: String(kpi.completedCount),
      iconSignature: 'finance_note',
      state: 'normal',
      sub: t('paymentsList.processed'),
    },
    {
      label: t('paymentsList.partialRefunds'),
      value: String(kpi.partialRefundCount),
      iconSignature: 'finance_receipt',
      state: 'normal',
      sub: t('status.pending'),
    },
    {
      label: t('status.cancelled'),
      value: String(kpi.cancelledCount),
      iconSignature: 'atrisk',
      state: kpi.cancelledCount > 0 ? 'normal' : 'muted',
    },
  ]

  return (
    <div className="p-6 space-y-5">
      {/* Screen-reader page heading (breadcrumb names the page visually) */}
      <h1 className="sr-only">{t('paymentsList.title')}</h1>

      {/* ---- Page header (pagebar) ---- */}
      <PageHeader
        mode="pagebar"
        actions={[
          {
            label: t('overview.actions.recordPayment'),
            icon: <CreditCard className="h-3.5 w-3.5" />,
            primary: true,
            onClick: () => navigate({ to: '/payments/record' }),
          },
        ]}
      />

      {/* ---- StatBand — KPI summary (Cancelled → muted when 0) ---- */}
      <StatBand metrics={metrics} ariaLabel={t('paymentsList.kpi.region')} />

      {/* Data Table — status presets + gateway facet + grade "More filters"
          drive the server `useSchoolPayments` query (GSI14 for grade, indexed
          lookups for status / gateway) via the unified toolbar slots, NOT the
          client-side `facets` prop (which would double-filter the already-
          narrowed list). Search stays the built-in client filter; the
          full-school CSV export (useExportPaymentsCsv) lives in `toolbarExtra`. */}
      <TanstackDataTable<Payment>
        className="min-h-96"
        columns={columns}
        data={paymentList}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        tableId="finance.payments"
        enableSorting
        enableRowSelection={true}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        enableColumnVisibility
        pagination={{ pageSize: 20 }}
        pageSizes={[10, 20, 50]}
        defaultSort={[{ id: 'date', desc: true }]}
        searchPlaceholder={t('paymentsList.searchPlaceholder')}
        presets={STATUS_PRESETS}
        activePreset={statusFilter}
        onPresetChange={(v) => setStatusFilter(v)}
        primaryFilter={
          <Select
            size="sm"
            className="w-48"
            value={gatewayFilter}
            onChange={(v) => setGatewayFilter(v ?? '')}
            options={[
              { label: t('paymentsList.allGateways'), value: '' },
              { label: t('gateway.cash'), value: 'cash' },
              { label: t('gateway.bankTransfer'), value: 'bank_transfer' },
              { label: t('gateway.cheque'), value: 'cheque' },
              { label: t('gateway.esewa'), value: 'esewa' },
              { label: t('gateway.khalti'), value: 'khalti' },
              { label: t('gateway.fonepay'), value: 'fonepay' },
            ]}
            buttonClassName="border-[rgb(var(--border-primary)/0.35)]"
          />
        }
        moreFilters={
          <DataTableMoreFilters
            activeCount={gradeFilter ? 1 : 0}
            onClear={() => setGradeFilter('')}
          >
            {/* Sprint B.5 — grade filter routes through GSI14 (sparse) */}
            <Select
              size="sm"
              className="w-full"
              label={t('feeStructure.gradeLevels')}
              value={gradeFilter}
              onChange={(v) => setGradeFilter(v ?? '')}
              options={gradeOptions}
            />
          </DataTableMoreFilters>
        }
        toolbarExtra={
          <ExportCsvButton
            onClick={() => {
              if (!schoolId) return
              exportCsvMutation.mutate(schoolId, {
                onSuccess: () => toast.success(t('paymentsList.exportSuccess')),
                onError: () => toast.error(t('paymentsList.exportFailed')),
              })
            }}
            isExporting={exportCsvMutation.isPending}
          />
        }
        bulkActions={paymentBulkActions}
        emptyState={{
          icon: <CreditCard className="w-10 h-10" />,
          title: t('empty.noPayments'),
          description: t('empty.noPaymentsDescription'),
          action: {
            label: t('paymentsList.recordManualPayment'),
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

      {/* Bulk Void Drawer (#229) */}
      <BulkVoidPaymentsDrawer
        open={!!bulkVoidTarget}
        payments={bulkVoidTarget ?? []}
        schoolId={schoolId}
        onClose={() => setBulkVoidTarget(null)}
        onComplete={() => setRowSelection({})}
      />

      {/* Bulk Send Receipts Drawer (#230 — D1) */}
      <BulkSendReceiptsDrawer
        open={!!bulkReceiptTarget}
        payments={bulkReceiptTarget ?? []}
        schoolId={schoolId}
        onClose={() => setBulkReceiptTarget(null)}
        onComplete={() => setRowSelection({})}
      />

      {/* Sprint G.4 — Bulk Receipt PDF Export Drawer (mirror of the
          invoice-side drawer from PR #266). Conditionally mounted so the
          exit animation runs; onClose only clears the target, onComplete
          clears row selection per sibling-drawer convention. */}
      {bulkPdfExportTarget && (
        <BulkReceiptPdfExportDrawer
          open={!!bulkPdfExportTarget}
          onClose={() => setBulkPdfExportTarget(null)}
          onComplete={() => setRowSelection({})}
          schoolId={schoolId}
          paymentIds={bulkPdfExportTarget}
        />
      )}
    </div>
  )
}
