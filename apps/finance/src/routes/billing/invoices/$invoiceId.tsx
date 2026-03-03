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
import { ArrowLeft, Check, X, Loader2, Printer, AlertTriangle } from 'lucide-react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useAppStore } from '../../../stores/app.store'
import {
  useInvoice,
  useIssueInvoice,
  useCancelInvoice,
  useInvoicePayments,
} from '@edforge/finance-services'
import { formatNPR } from '@edforge/types'
import { formatDate, formatDateTime } from '../../../utils/format-date'

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    issued: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    partially_paid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  }
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${map[status] || map.draft}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function InvoiceDetailPage() {
  const navigate = useNavigate()
  const { invoiceId } = useParams({ strict: false }) as { invoiceId: string }
  const schoolId = useAppStore((s) => s.activeSchoolId)

  const { data: invoice, isLoading } = useInvoice(schoolId ?? '', invoiceId)
  const { data: payments } = useInvoicePayments(schoolId ?? '', invoiceId)
  const issueMutation = useIssueInvoice(schoolId ?? '')
  const cancelMutation = useCancelInvoice(schoolId ?? '')

  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const handleIssue = async () => {
    try {
      await issueMutation.mutateAsync(invoiceId)
      toast.success('Invoice issued successfully')
    } catch {
      toast.error('Failed to issue invoice')
    }
  }

  const handleConfirmCancel = async (reason: string) => {
    try {
      await cancelMutation.mutateAsync({ invoiceId, reason })
      toast.success('Invoice cancelled')
      setShowCancelDialog(false)
    } catch {
      toast.error('Failed to cancel invoice')
    }
  }

  if (isLoading || !invoice) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    )
  }

  const lineItems = invoice.lineItems ?? []
  const paymentsList = Array.isArray(payments) ? payments : (payments as any)?.items ?? []

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Back nav */}
      <button
        onClick={() => navigate({ to: '/finance/billing/invoices' as string })}
        className="flex items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors print:hidden"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Invoices
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
              {invoice.invoiceNumber || `Invoice ${invoice.id.slice(0, 8)}`}
            </h1>
            {statusBadge(invoice.status)}
          </div>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
            {invoice.studentName && `Student: ${invoice.studentName}`}
            {invoice.dueDate && ` · Due: ${formatDate(invoice.dueDate)}`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" />
            Print
          </Button>
          {invoice.status === 'draft' && (
            <>
              <Button onClick={handleIssue} disabled={issueMutation.isPending}>
                {issueMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Check className="w-4 h-4 mr-1.5" />
                )}
                Issue Invoice
              </Button>
              <Button variant="outline" onClick={() => setShowCancelDialog(true)} disabled={cancelMutation.isPending}>
                <X className="w-4 h-4 mr-1.5" />
                Cancel
              </Button>
            </>
          )}
          {(invoice.status === 'issued' || invoice.status === 'overdue') && (
            <Button variant="outline" onClick={() => setShowCancelDialog(true)} disabled={cancelMutation.isPending}>
              <X className="w-4 h-4 mr-1.5" />
              Cancel Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="border border-[rgb(var(--border-primary))] rounded-lg overflow-hidden">
        <div className="bg-[rgb(var(--surface-secondary))] px-4 py-2.5 border-b border-[rgb(var(--border-primary))]">
          <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Line Items</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgb(var(--border-primary))]">
              <th className="text-left px-4 py-2 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Description</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Amount</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Tax</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Discount</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border-primary))]">
            {lineItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
                  No line items
                </td>
              </tr>
            ) : (
              lineItems.map((item: any, idx: number) => (
                <tr key={item.id || idx}>
                  <td className="px-4 py-2.5 text-sm text-[rgb(var(--text-primary))]">{item.description}</td>
                  <td className="px-4 py-2.5 text-sm text-right text-[rgb(var(--text-secondary))]">{formatNPR(item.amount)}</td>
                  <td className="px-4 py-2.5 text-sm text-right text-[rgb(var(--text-secondary))]">{formatNPR(item.taxAmount || 0)}</td>
                  <td className="px-4 py-2.5 text-sm text-right text-[rgb(var(--text-secondary))]">{formatNPR(item.discount || 0)}</td>
                  <td className="px-4 py-2.5 text-sm text-right font-medium text-[rgb(var(--text-primary))]">{formatNPR(item.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="bg-[rgb(var(--surface-secondary))] rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
          <span>Subtotal</span>
          <span>{formatNPR(invoice.subtotal ?? 0)}</span>
        </div>
        {(invoice.discountTotal ?? 0) > 0 && (
          <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
            <span>Discount</span>
            <span>-{formatNPR(invoice.discountTotal)}</span>
          </div>
        )}
        {(invoice.taxTotal ?? 0) > 0 && (
          <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
            <span>Tax</span>
            <span>{formatNPR(invoice.taxTotal)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold text-[rgb(var(--text-primary))] border-t border-[rgb(var(--border-primary))] pt-2">
          <span>Grand Total</span>
          <span>{formatNPR(invoice.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
          <span>Amount Paid</span>
          <span>{formatNPR(invoice.amountPaid ?? 0)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold text-amber-600 dark:text-amber-400">
          <span>Amount Due</span>
          <span>{formatNPR(invoice.amountDue ?? invoice.grandTotal)}</span>
        </div>
      </div>

      {/* Payment History */}
      {paymentsList.length > 0 && (
        <div className="border border-[rgb(var(--border-primary))] rounded-lg overflow-hidden">
          <div className="bg-[rgb(var(--surface-secondary))] px-4 py-2.5 border-b border-[rgb(var(--border-primary))]">
            <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Payment History</h2>
          </div>
          <div className="divide-y divide-[rgb(var(--border-primary))]">
            {paymentsList.map((payment: any) => (
              <div key={payment.paymentId || payment.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    {payment.gateway || payment.paymentMethod || 'Payment'}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-secondary))]">
                    {payment.createdAt ? formatDate(payment.createdAt) : ''}
                  </p>
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  +{formatNPR(payment.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-[rgb(var(--text-tertiary))] space-y-0.5">
        {invoice.createdAt && <p>Created: {formatDateTime(invoice.createdAt)}</p>}
        {invoice.issuedDate && <p>Issued: {formatDateTime(invoice.issuedDate)}</p>}
        {invoice.notes && <p>Notes: {invoice.notes}</p>}
      </div>

      {/* Cancel Invoice Dialog */}
      <AnimatePresence>
        {showCancelDialog && (
          <CancelInvoiceDialog
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
          .bg-\\[rgb\\(var\\(--surface-secondary\\)\\)\\] {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[rgb(var(--surface-primary))] rounded-xl shadow-xl w-full max-w-sm p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">
              Cancel Invoice {invoiceNumber}?
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
              This action is <span className="font-semibold text-red-600 dark:text-red-400">irreversible</span>.
              The invoice will be permanently cancelled and cannot be re-issued.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
            Reason for cancellation *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for cancelling this invoice..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Keep Invoice
          </Button>
          <Button
            onClick={() => onConfirm(reason.trim())}
            disabled={isPending || !reason.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <X className="w-4 h-4 mr-1.5" />
            )}
            Cancel Invoice
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
