/**
 * Record Manual Payment Page
 *
 * Admin page for recording cash, bank transfer, or cheque payments.
 * Route: /settings/record-payment
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@edforge/ui'
import {
  Loader2,
  Banknote,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react'
import { useSearch } from '@tanstack/react-router'
import { useAppStore } from '../../stores/app.store'
import { useRecordManualPayment } from '../../hooks/usePayments'

type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque'

function formatNPR(amount: number): string {
  return `NPR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export default function RecordPaymentPage() {
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const searchParams = useSearch({ strict: false }) as {
    invoiceId?: string
    amount?: string
  }

  const [invoiceId, setInvoiceId] = useState(searchParams.invoiceId ?? '')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [amount, setAmount] = useState(searchParams.amount ?? '')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [paidDate, setPaidDate] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [success, setSuccess] = useState(false)

  const recordMutation = useRecordManualPayment(schoolId ?? '')

  const parsedAmount = parseFloat(amount) || 0

  const handleSubmit = async () => {
    if (!invoiceId.trim()) {
      toast.error('Please enter an invoice ID or student name')
      return
    }
    if (parsedAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    if ((paymentMethod === 'bank_transfer' || paymentMethod === 'cheque') && !referenceNumber.trim()) {
      toast.error('Reference number is required for bank transfer / cheque')
      return
    }

    try {
      await recordMutation.mutateAsync({
        invoiceId: invoiceId.trim(),
        gateway: paymentMethod,
        amount: parsedAmount,
        currency: 'NPR',
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        paidDate: paidDate || undefined,
      })
      toast.success('Payment recorded successfully')
      setSuccess(true)
    } catch {
      toast.error('Failed to record payment')
    }
  }

  const handleRecordAnother = () => {
    setInvoiceId('')
    setPaymentMethod('cash')
    setAmount('')
    setReferenceNumber('')
    setPaidDate(todayISO())
    setNotes('')
    setSuccess(false)
  }

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        Select a school to record payments.
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 space-y-4"
        >
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
          <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
            Payment Recorded
          </h2>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            The manual payment has been recorded and the student account has been updated.
          </p>
          <Button onClick={handleRecordAnother}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Record Another Payment
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            Record Payment
          </h1>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5">
            Manually record a cash, bank transfer, or cheque payment.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Invoice ID / Student Name */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Invoice ID or Student Name *
            </label>
            <input
              type="text"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="Enter invoice ID or student name"
              className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
              Payment Method *
            </label>
            <div className="flex gap-3">
              {([
                { value: 'cash' as const, label: 'Cash' },
                { value: 'bank_transfer' as const, label: 'Bank Transfer' },
                { value: 'cheque' as const, label: 'Cheque' },
              ]).map((method) => (
                <label
                  key={method.value}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                    paymentMethod === method.value
                      ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-600'
                      : 'border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-secondary))]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                    className="sr-only"
                  />
                  {method.label}
                </label>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Amount (NPR) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          {/* Reference Number (for bank_transfer and cheque) */}
          {(paymentMethod === 'bank_transfer' || paymentMethod === 'cheque') && (
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                Reference # *
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder={paymentMethod === 'bank_transfer' ? 'Bank reference number' : 'Cheque number'}
                className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          )}

          {/* Date Paid */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Date Paid
            </label>
            <input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes about this payment..."
              className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
        </div>

        {/* Preview */}
        {parsedAmount > 0 && (
          <div className="bg-[rgb(var(--surface-secondary))] rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Preview</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                <span>Invoice</span>
                <span className="font-medium text-[rgb(var(--text-primary))]">
                  {invoiceId || '--'}
                </span>
              </div>
              <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                <span>Method</span>
                <span className="font-medium text-[rgb(var(--text-primary))]">
                  {paymentMethod.replace('_', ' ')}
                </span>
              </div>
              {referenceNumber && (
                <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                  <span>Reference #</span>
                  <span className="font-medium text-[rgb(var(--text-primary))]">
                    {referenceNumber}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                <span>Date</span>
                <span className="font-medium text-[rgb(var(--text-primary))]">
                  {paidDate ? new Date(paidDate).toLocaleDateString() : '--'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-[rgb(var(--text-primary))] border-t border-[rgb(var(--border-primary))] pt-2 mt-2">
                <span>Amount</span>
                <span>{formatNPR(parsedAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={recordMutation.isPending || !invoiceId.trim() || parsedAmount <= 0}
          className="w-full"
        >
          {recordMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
          ) : (
            <Banknote className="w-4 h-4 mr-1.5" />
          )}
          Record Payment
        </Button>
      </motion.div>
    </div>
  )
}
