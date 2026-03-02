/**
 * Admin Payments List Page
 *
 * View all payments for a school with filtering, void, and refund actions.
 * Route: /finance/billing/payments
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@edforge/ui'
import {
  Loader2,
  CreditCard,
  Search,
  Eye,
  Ban,
  RotateCcw,
  X,
} from 'lucide-react'
import { useAppStore } from '../../../stores/app.store'
import {
  useSchoolPayments,
  useVoidPayment,
  useCreateRefund,
} from '@edforge/finance-services'
import type { Payment } from '@edforge/types'

function formatNPR(amount: number): string {
  return `NPR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function paymentStatusBadge(status: string) {
  const map: Record<string, string> = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
    refunded: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    partially_refunded: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.pending}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function PaymentsPage() {
  const schoolId = useAppStore((s) => s.activeSchoolId)

  const [statusFilter, setStatusFilter] = useState('')
  const [gatewayFilter, setGatewayFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [refundModal, setRefundModal] = useState<Payment | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')

  const { data: payments, isLoading } = useSchoolPayments(schoolId ?? '', {
    ...(statusFilter && { status: statusFilter }),
    ...(gatewayFilter && { gateway: gatewayFilter }),
  })
  const voidMutation = useVoidPayment(schoolId ?? '')
  const refundMutation = useCreateRefund(schoolId ?? '')

  const paymentList = Array.isArray(payments) ? payments : []
  const filtered = searchTerm
    ? paymentList.filter(
        (p) =>
          p.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.invoiceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : paymentList

  const handleVoid = async (payment: Payment) => {
    if (!confirm('Are you sure you want to void this payment? This will reverse the ledger entry.')) return
    try {
      await voidMutation.mutateAsync({
        paymentId: payment.id,
        data: { reason: 'Voided by admin' },
      })
      toast.success('Payment voided successfully')
    } catch {
      toast.error('Failed to void payment')
    }
  }

  const handleRefundSubmit = async () => {
    if (!refundModal) return
    const amt = parseFloat(refundAmount)
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid refund amount')
      return
    }
    if (!refundReason.trim()) {
      toast.error('Please enter a reason for the refund')
      return
    }
    try {
      await refundMutation.mutateAsync({
        paymentId: refundModal.id,
        data: { amount: amt, reason: refundReason.trim() },
      })
      toast.success('Refund initiated successfully')
      setRefundModal(null)
      setRefundAmount('')
      setRefundReason('')
    } catch {
      toast.error('Failed to create refund')
    }
  }

  const openRefundModal = (payment: Payment) => {
    setRefundModal(payment)
    setRefundAmount(String(payment.amount))
    setRefundReason('')
  }

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
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Payments</h1>
        <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5">
          View and manage all payment transactions.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder="Search by receipt # or invoice ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
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

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--text-tertiary))] opacity-40" />
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">No payments found</p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
            Payments will appear here once students start paying invoices.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-[rgb(var(--border-primary))] rounded-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[rgb(var(--surface-secondary))] border-b border-[rgb(var(--border-primary))]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Receipt #</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Invoice #</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Gateway</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border-primary))]">
                {filtered.map((payment) => (
                  <tr key={payment.id} className="hover:bg-[rgb(var(--surface-secondary))] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[rgb(var(--text-primary))]">
                      {payment.receiptNumber || payment.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
                      {payment.invoiceId ? payment.invoiceId.slice(0, 8) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-[rgb(var(--text-primary))]">
                      {formatNPR(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))] capitalize">
                      {payment.gateway.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {paymentStatusBadge(payment.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleDateString()
                        : payment.createdAt
                          ? new Date(payment.createdAt).toLocaleDateString()
                          : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
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
                            onClick={() => handleVoid(payment)}
                            disabled={voidMutation.isPending}
                            className="p-1.5 rounded-md hover:bg-red-50 text-red-500 dark:hover:bg-red-900/20 dark:text-red-400"
                            title="Void Payment"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        {/* Refund (for completed only) */}
                        {payment.status === 'completed' && (
                          <button
                            onClick={() => openRefundModal(payment)}
                            className="p-1.5 rounded-md hover:bg-orange-50 text-orange-500 dark:hover:bg-orange-900/20 dark:text-orange-400"
                            title="Refund"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[rgb(var(--surface-primary))] rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Refund Payment
              </h3>
              <button
                onClick={() => setRefundModal(null)}
                className="p-1 rounded-md hover:bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-tertiary))]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-[rgb(var(--text-secondary))]">
                  Original amount: <span className="font-medium text-[rgb(var(--text-primary))]">{formatNPR(refundModal.amount)}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                  Refund Amount (NPR) *
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  max={refundModal.amount}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                  Reason *
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  placeholder="Reason for refund..."
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setRefundModal(null)} className="flex-1">
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleRefundSubmit}
                disabled={refundMutation.isPending}
                className="flex-1 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {refundMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" />
                ) : null}
                Refund
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
