/**
 * Admin Invoice Detail Page
 *
 * Shows full invoice breakdown with actions (issue, cancel).
 * Route: /finance/billing/invoices/:invoiceId
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@edforge/ui'
import { UuidBadge } from '@edforge/archetype'
import { ArrowLeft, Check, X, Loader2, Download, AlertTriangle } from 'lucide-react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
import { useAppStore } from '../../../stores/app.store'
import {
  useInvoice,
  useIssueInvoice,
  useCancelInvoice,
  useInvoicePayments,
  useDownloadInvoicePdf,
} from '@edforge/finance-services'
import { formatGatewayLabel } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { formatDate, formatDateTime, formatDateDual } from '../../../utils/format-date'
import { StatusBadge } from '../../../components/StatusBadge'

type Translate = (key: string, options?: Record<string, unknown>) => string

function formatPaymentGateway(gateway: string | undefined, t: Translate): string {
  if (!gateway) return t('invoiceDetail.paymentHistory.payment')
  const normalized = gateway.toLowerCase().replace(/[-\s]+/g, '_')
  const key = normalized === 'bank_transfer'
    ? 'bankTransfer'
    : normalized === 'connect_ips'
      ? 'connectips'
      : normalized
  return t(`gateway.${key}`, { defaultValue: formatGatewayLabel(gateway) })
}

export default function InvoiceDetailPage() {
  const navigate = useNavigate()
  const { invoiceId } = useParams({ strict: false }) as { invoiceId: string }
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const settings = useFinanceSettings()
  const { format } = useCurrency(settings)

  const { data: invoice, isLoading } = useInvoice(schoolId ?? '', invoiceId)
  const { data: payments } = useInvoicePayments(schoolId ?? '', invoiceId)
  const issueMutation = useIssueInvoice(schoolId ?? '')
  const cancelMutation = useCancelInvoice(schoolId ?? '')
  const downloadInvoice = useDownloadInvoicePdf()
  const { t } = useTranslation('payments')

  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const handleIssue = async () => {
    try {
      await issueMutation.mutateAsync(invoiceId)
      toast.success(t('invoices.issueSuccess'))
    } catch {
      toast.error(t('invoices.issueFailed'))
    }
  }

  const handleConfirmCancel = async (reason: string) => {
    try {
      await cancelMutation.mutateAsync({ invoiceId, reason })
      toast.success(t('invoices.cancelSuccess'))
      setShowCancelDialog(false)
    } catch {
      toast.error(t('invoices.cancelFailed'))
    }
  }

  if (isLoading || !invoice) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-[rgb(var(--action-secondary-fg))] animate-spin" />
      </div>
    )
  }

  const lineItems = invoice.lineItems ?? []
  const paymentsList = Array.isArray(payments) ? payments : (payments as any)?.items ?? []

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Back nav */}
      <button
        onClick={() => navigate({ to: '/invoices' })}
        className="flex items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors print:hidden"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('invoiceDetail.backToInvoices')}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
              {invoice.invoiceNumber || (
                <>
                  {t('invoiceDetail.invoice')} <UuidBadge value={invoice.id} />
                </>
              )}
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
            {invoice.studentName && t('invoiceDetail.student', { name: invoice.studentName })}
            {invoice.studentName && invoice.dueDate && ' · '}
            {invoice.dueDate && t('invoiceDetail.due', { date: formatDateDual(invoice.dueDate, settings) })}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 print:hidden">
          {/*
            M1.5 — Download PDF button. Uses the M1.4 hook which:
              - fires `pdf_download_started/succeeded/failed` telemetry (M1.10)
              - dispatches a localized error toast on failure (M1.11)
            So this call site doesn't need its own error handling — the
            hook owns the full UX. invoiceNumber is passed so the
            download filename matches the on-screen invoice number
            (falls back to `invoice-<8chars>.pdf` per the M1.4 followup).
          */}
          <Button
            variant="outline"
            onClick={() =>
              schoolId &&
              downloadInvoice.mutate({
                schoolId,
                invoiceId,
                invoiceNumber: invoice.invoiceNumber,
              })
            }
            disabled={downloadInvoice.isPending || !schoolId}
            aria-label={t('actions.downloadPdf')}
          >
            {downloadInvoice.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Download className="w-4 h-4 mr-1.5" />
            )}
            {t('actions.downloadPdf')}
          </Button>
          {invoice.status === 'draft' && (
            <>
              <Button onClick={handleIssue} disabled={issueMutation.isPending}>
                {issueMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Check className="w-4 h-4 mr-1.5" />
                )}
                {t('invoiceDetail.actions.issueInvoice')}
              </Button>
              <Button variant="outline" onClick={() => setShowCancelDialog(true)} disabled={cancelMutation.isPending}>
                <X className="w-4 h-4 mr-1.5" />
                {t('actions.cancel')}
              </Button>
            </>
          )}
          {(invoice.status === 'issued' || invoice.status === 'overdue') && (
            <Button variant="outline" onClick={() => setShowCancelDialog(true)} disabled={cancelMutation.isPending}>
              <X className="w-4 h-4 mr-1.5" />
              {t('invoices.cancelInvoice')}
            </Button>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="border border-[rgb(var(--border-primary))] rounded-lg overflow-hidden">
        <div className="bg-[rgb(var(--background-secondary))] px-4 py-2.5 border-b border-[rgb(var(--border-primary))]">
          <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{t('invoiceDetail.sections.lineItems')}</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgb(var(--border-primary))]">
              <th className="text-left px-4 py-2 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">{t('lineItems.description')}</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">{t('lineItems.amount')}</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">{t('lineItems.tax')}</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">{t('lineItems.discount')}</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">{t('lineItems.total')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border-primary))]">
            {lineItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
                  {t('invoiceDetail.empty.noLineItems')}
                </td>
              </tr>
            ) : (
              lineItems.map((item: any, idx: number) => (
                <tr key={item.id || idx}>
                  <td className="px-4 py-2.5 text-sm text-[rgb(var(--text-primary))]">{item.description}</td>
                  <td className="px-4 py-2.5 text-sm text-right text-[rgb(var(--text-secondary))]">{format(item.amount)}</td>
                  <td className="px-4 py-2.5 text-sm text-right text-[rgb(var(--text-secondary))]">{format(item.taxAmount || 0)}</td>
                  <td className="px-4 py-2.5 text-sm text-right text-[rgb(var(--text-secondary))]">{format(item.discount || 0)}</td>
                  <td className="px-4 py-2.5 text-sm text-right font-medium text-[rgb(var(--text-primary))]">{format(item.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="bg-[rgb(var(--background-secondary))] rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
          <span>{t('summary.subtotal')}</span>
          <span>{format(invoice.subtotal ?? 0)}</span>
        </div>
        {(invoice.discountTotal ?? 0) > 0 && (
          <div className="flex justify-between text-sm text-[rgb(var(--state-success-fg))] ">
            <span>{t('summary.discountTotal')}</span>
            <span>-{format(invoice.discountTotal)}</span>
          </div>
        )}
        {(invoice.taxTotal ?? 0) > 0 && (
          <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
            <span>{t('summary.taxTotal')}</span>
            <span>{format(invoice.taxTotal)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold text-[rgb(var(--text-primary))] border-t border-[rgb(var(--border-primary))] pt-2">
          <span>{t('summary.grandTotal')}</span>
          <span>{format(invoice.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
          <span>{t('summary.amountPaid')}</span>
          <span>{format(invoice.amountPaid ?? 0)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold text-amber-600 dark:text-amber-400">
          <span>{t('summary.amountDue')}</span>
          <span>{format(invoice.amountDue ?? invoice.grandTotal)}</span>
        </div>
      </div>

      {/* Payment History */}
      {paymentsList.length > 0 && (
        <div className="border border-[rgb(var(--border-primary))] rounded-lg overflow-hidden">
          <div className="bg-[rgb(var(--background-secondary))] px-4 py-2.5 border-b border-[rgb(var(--border-primary))]">
            <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{t('invoiceDetail.sections.paymentHistory')}</h2>
          </div>
          <div className="divide-y divide-[rgb(var(--border-primary))]">
            {paymentsList.map((payment: any) => (
              <div key={payment.paymentId || payment.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    {payment.receiptNumber || formatPaymentGateway(payment.gateway, t)}
                    {payment.receiptNumber && payment.gateway && (
                      <span className="text-[rgb(var(--text-tertiary))] font-normal ml-1.5 text-xs">
                        {t('invoiceDetail.paymentHistory.via', {
                          gateway: formatPaymentGateway(payment.gateway, t),
                        })}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-secondary))]">
                    {payment.paidAt ? formatDate(payment.paidAt, settings) : payment.createdAt ? formatDate(payment.createdAt, settings) : ''}
                  </p>
                </div>
                <span className="text-sm font-medium text-[rgb(var(--state-success-fg))] ">
                  +{format(payment.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-[rgb(var(--text-tertiary))] space-y-0.5">
        {invoice.createdAt && <p>{t('invoiceDetail.metadata.created', { date: formatDateTime(invoice.createdAt, settings) })}</p>}
        {invoice.issuedDate && <p>{t('invoiceDetail.metadata.issued', { date: formatDateDual(invoice.issuedDate, settings) })}</p>}
        {invoice.notes && <p>{t('invoiceDetail.metadata.notes', { notes: invoice.notes })}</p>}
      </div>

      {/* Cancel Invoice Dialog */}
      <AnimatePresence>
        {showCancelDialog && (
          <CancelInvoiceDialog
            // eslint-disable-next-line edforge/no-id-slice-in-jsx -- dialog prop needs a plain string label; rare no-number fallback, not a rendered UUID
            invoiceNumber={invoice.invoiceNumber || `Invoice ${invoice.id.slice(0, 8)}`}
            isPending={cancelMutation.isPending}
            onConfirm={handleConfirmCancel}
            onClose={() => setShowCancelDialog(false)}
          />
        )}
      </AnimatePresence>

      {/* Print-friendly styles */}
      <style>{`
        @media print {
          /* Hide shell chrome: sidebar, header, navigation */
          nav, header, aside,
          [data-sidebar], [data-topbar], [data-shell-header] {
            display: none !important;
          }

          /* Hide interactive elements */
          .print\\:hidden {
            display: none !important;
          }

          /* Clean black-on-white layout */
          body {
            background: white !important;
            color: black !important;
            font-size: 12pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Remove decorative styling */
          * {
            box-shadow: none !important;
          }

          /* Fill the page */
          main, [data-content], .p-6 {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }

          /* Table borders for line items */
          table {
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #d1d5db !important;
            padding: 6px 10px !important;
          }

          /* Ensure all text is black */
          h1, h2, h3, p, span, td, th {
            color: black !important;
          }

          /* Light background for totals section */
          .bg-\\[rgb\\(var\\(--background-secondary\\)\\)\\] {
            background: #f9fafb !important;
          }

          /* Status badge print readability */
          .rounded-full {
            border: 1px solid #9ca3af !important;
          }

          @page {
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// CANCEL INVOICE DIALOG
// ============================================================================

function CancelInvoiceDialog({
  invoiceNumber,
  isPending,
  onConfirm,
  onClose,
}: {
  invoiceNumber: string
  isPending: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation('payments')
  const [reason, setReason] = useState('')

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose()
    },
    [isPending, onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.40)] print:hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[rgb(var(--background-primary))] rounded-xl shadow-xl w-full max-w-sm p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-invoice-title"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)] ">
            <AlertTriangle className="w-5 h-5 text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]" />
          </div>
          <div>
            <h3 id="cancel-invoice-title" className="text-base font-semibold text-[rgb(var(--text-primary))]">
              {t('invoices.cancelTitle', { invoiceNumber })}
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
              {t('invoices.cancelDescriptionPrefix')}{' '}
              <span className="font-semibold text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]">
                {t('invoices.irreversible')}
              </span>
              . {t('invoices.cancelDescriptionSuffix')}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
            {t('invoices.cancelReason')}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('invoices.cancelReasonPlaceholder')}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t('invoices.keepInvoice')}
          </Button>
          <Button
            onClick={() => onConfirm(reason.trim())}
            disabled={isPending || !reason.trim()}
            className="bg-[rgb(var(--action-danger-bg))] hover:brightness-95 text-[rgb(var(--action-primary-fg))]"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <X className="w-4 h-4 mr-1.5" />
            )}
            {t('invoices.cancelInvoice')}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
