/**
 * Record Manual Payment Page
 *
 * Admin page for recording cash, bank transfer, or cheque payments.
 * Includes invoice search/autocomplete by invoice number or student name.
 * Route: /finance/billing/payments/record
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@edforge/ui'
import {
  Loader2,
  Banknote,
  CheckCircle2,
  RotateCcw,
  Search,
  FileText,
  X,
} from 'lucide-react'
import { useSearch } from '@tanstack/react-router'
import { useAppStore } from '../../../stores/app.store'
import { useRecordManualPayment, useInvoices } from '@edforge/finance-services'
import { formatNPR } from '@edforge/types'
import type { Invoice } from '@edforge/types'
import { formatDate } from '../../../utils/format-date'

type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque'

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ============================================================================
// INVOICE SEARCH / AUTOCOMPLETE
// ============================================================================

/**
 * InvoiceSearchInput
 *
 * Debounced search input that queries invoices by number or student name.
 * Shows a dropdown of matching results, and on selection auto-fills
 * the invoice ID and amount.
 */
function InvoiceSearchInput({
  schoolId,
  value,
  onSelect,
  initialInvoiceId,
}: {
  schoolId: string
  value: string
  onSelect: (invoiceId: string, amountDue: number, displayLabel: string) => void
  initialInvoiceId?: string
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [displayValue, setDisplayValue] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch all payable invoices (issued, partially_paid, overdue)
  const { data: invoiceData, isLoading } = useInvoices(schoolId, {
    status: ['issued', 'partially_paid', 'overdue'],
  })

  const invoices: Invoice[] = useMemo(() => {
    if (!invoiceData) return []
    // Handle both paginated and array responses
    if (Array.isArray(invoiceData)) return invoiceData
    if ('items' in invoiceData && Array.isArray(invoiceData.items)) return invoiceData.items
    return []
  }, [invoiceData])

  // Debounce: update debouncedTerm after 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Filter invoices by debounced search term
  const filteredInvoices = useMemo(() => {
    if (!debouncedTerm.trim()) return invoices.slice(0, 10) // Show first 10 when empty
    const term = debouncedTerm.toLowerCase()
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(term) ||
        inv.studentName?.toLowerCase().includes(term) ||
        inv.id?.toLowerCase().includes(term)
    ).slice(0, 10)
  }, [invoices, debouncedTerm])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // If we already have an initialInvoiceId, set displayValue
  useEffect(() => {
    if (initialInvoiceId && invoices.length > 0) {
      const match = invoices.find((inv) => inv.id === initialInvoiceId)
      if (match) {
        setDisplayValue(`${match.invoiceNumber} - ${match.studentName}`)
      }
    }
  }, [initialInvoiceId, invoices])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setDisplayValue(val)
    setSearchTerm(val)
    setIsOpen(true)
  }

  const handleSelect = useCallback(
    (invoice: Invoice) => {
      const label = `${invoice.invoiceNumber} - ${invoice.studentName}`
      setDisplayValue(label)
      setSearchTerm('')
      setIsOpen(false)
      onSelect(invoice.id, invoice.amountDue, label)
    },
    [onSelect],
  )

  const handleClear = () => {
    setDisplayValue('')
    setSearchTerm('')
    setDebouncedTerm('')
    onSelect('', 0, '')
    inputRef.current?.focus()
  }

  const handleFocus = () => {
    setIsOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
        Invoice *
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search by invoice number or student name..."
          className="w-full pl-9 pr-8 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          autoComplete="off"
        />
        {displayValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-tertiary))]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
              <span className="ml-2 text-sm text-[rgb(var(--text-tertiary))]">Loading invoices...</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-4 text-center text-sm text-[rgb(var(--text-tertiary))]">
              {debouncedTerm.trim()
                ? 'No matching invoices found'
                : 'No unpaid invoices available'}
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <button
                key={invoice.id}
                type="button"
                onClick={() => handleSelect(invoice)}
                className="w-full text-left px-3 py-2.5 hover:bg-[rgb(var(--surface-secondary))] transition-colors border-b border-[rgb(var(--border-primary))] last:border-b-0"
              >
                <div className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 mt-0.5 text-[rgb(var(--text-tertiary))] flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                        {invoice.invoiceNumber}
                      </span>
                      <span className="text-sm font-semibold text-teal-600 dark:text-teal-400 flex-shrink-0">
                        {formatNPR(invoice.amountDue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-xs text-[rgb(var(--text-secondary))] truncate">
                        {invoice.studentName}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        invoice.status === 'overdue'
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          : invoice.status === 'partially_paid'
                            ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {invoice.status === 'partially_paid' ? 'partial' : invoice.status}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function RecordPaymentPage() {
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const searchParams = useSearch({ strict: false }) as {
    invoiceId?: string
    amount?: string
  }

  const [invoiceId, setInvoiceId] = useState(searchParams.invoiceId ?? '')
  const [invoiceLabel, setInvoiceLabel] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [amount, setAmount] = useState(searchParams.amount ?? '')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [paidDate, setPaidDate] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [success, setSuccess] = useState(false)

  const recordMutation = useRecordManualPayment(schoolId ?? '')

  const parsedAmount = parseFloat(amount) || 0

  const handleInvoiceSelect = useCallback(
    (id: string, amountDue: number, label: string) => {
      setInvoiceId(id)
      setInvoiceLabel(label)
      if (amountDue > 0) {
        setAmount(String(amountDue))
      }
    },
    [],
  )

  const handleSubmit = async () => {
    if (!invoiceId.trim()) {
      toast.error('Please select an invoice')
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
    setInvoiceLabel('')
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
          {/* Invoice Search / Autocomplete */}
          <InvoiceSearchInput
            schoolId={schoolId}
            value={invoiceLabel || invoiceId}
            onSelect={handleInvoiceSelect}
            initialInvoiceId={searchParams.invoiceId}
          />

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
                <span className="font-medium text-[rgb(var(--text-primary))] max-w-[60%] truncate text-right">
                  {invoiceLabel || invoiceId || '--'}
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
                  {paidDate ? formatDate(paidDate) : '--'}
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
