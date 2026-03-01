/**
 * Admin Invoice Detail Page
 *
 * Shows full invoice breakdown with actions (issue, cancel).
 * Route: /settings/invoices/:invoiceId
 */

import { toast } from 'sonner'
import { Button } from '@edforge/ui'
import { ArrowLeft, Check, X, Loader2, FileText } from 'lucide-react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useAppStore } from '../../stores/app.store'
import {
  useInvoice,
  useIssueInvoice,
  useCancelInvoice,
  useInvoicePayments,
} from '../../hooks/usePayments'

function formatNPR(amount: number): string {
  return `NPR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

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

  const handleIssue = async () => {
    try {
      await issueMutation.mutateAsync(invoiceId)
      toast.success('Invoice issued successfully')
    } catch {
      toast.error('Failed to issue invoice')
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this invoice? This cannot be undone.')) return
    try {
      await cancelMutation.mutateAsync({ invoiceId })
      toast.success('Invoice cancelled')
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
        onClick={() => navigate({ to: '/settings/invoices' as string })}
        className="flex items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
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
            {invoice.dueDate && ` · Due: ${new Date(invoice.dueDate).toLocaleDateString()}`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
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
              <Button variant="outline" onClick={handleCancel} disabled={cancelMutation.isPending}>
                <X className="w-4 h-4 mr-1.5" />
                Cancel
              </Button>
            </>
          )}
          {(invoice.status === 'issued' || invoice.status === 'overdue') && (
            <Button variant="outline" onClick={handleCancel} disabled={cancelMutation.isPending}>
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
        {(invoice.totalDiscount ?? 0) > 0 && (
          <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
            <span>Discount</span>
            <span>-{formatNPR(invoice.totalDiscount)}</span>
          </div>
        )}
        {(invoice.totalTax ?? 0) > 0 && (
          <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
            <span>Tax</span>
            <span>{formatNPR(invoice.totalTax)}</span>
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
                    {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : ''}
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
        {invoice.createdAt && <p>Created: {new Date(invoice.createdAt).toLocaleString()}</p>}
        {invoice.issuedAt && <p>Issued: {new Date(invoice.issuedAt).toLocaleString()}</p>}
        {invoice.notes && <p>Notes: {invoice.notes}</p>}
      </div>
    </div>
  )
}
