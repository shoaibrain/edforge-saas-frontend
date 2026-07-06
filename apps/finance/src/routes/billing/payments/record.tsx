/**
 * Record Manual Payment Page
 *
 * Admin page for recording cash, bank transfer, or cheque payments.
 * Two-step flow: select student → pick their unpaid invoice → fill payment details.
 * Route: /finance/billing/payments/record
 */

import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@edforge/ui'
import {
  Loader2,
  Banknote,
  CheckCircle2,
  RotateCcw,
  FileText,
} from 'lucide-react'
import { useSearch } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
import { useAppStore } from '../../../stores/app.store'
import { useRecordManualPayment, useInvoices } from '@edforge/finance-services'
import { formatGatewayLabel, type Invoice } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { formatDate } from '../../../utils/format-date'
import { StudentSearchInput } from '../../../components/billing/StudentSearchInput'

type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque'

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ============================================================================
// PAYABLE STATUSES
// ============================================================================

const PAYABLE_STATUSES = ['issued', 'partially_paid', 'overdue'] as const

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'overdue':
      return 'bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))]  dark:text-[rgb(var(--state-danger-fg))]'
    case 'partially_paid':
      return 'bg-[rgb(var(--state-warning-bg)/0.18)] text-[rgb(var(--state-warning-fg))]  '
    default:
      return 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]  dark:text-[rgb(var(--state-info-fg))]'
  }
}

function statusLabel(status: string): string {
  return status === 'partially_paid' ? 'partial' : status
}

type Translate = (key: string, options?: Record<string, unknown>) => string

function formatPaymentMethod(method: string, t: Translate): string {
  const key = method === 'bank_transfer' ? 'bankTransfer' : method
  return t(`gateway.${key}`, { defaultValue: formatGatewayLabel(method) })
}

// ============================================================================
// STUDENT INVOICE LIST
// ============================================================================

function StudentInvoiceList({
  schoolId,
  studentId,
  selectedInvoiceId,
  onSelect,
}: {
  schoolId: string
  studentId: string
  selectedInvoiceId: string
  onSelect: (invoiceId: string, amountDue: number, label: string) => void
}) {
  const { t } = useTranslation('payments')
  const listSettings = useFinanceSettings()
  const { format } = useCurrency(listSettings)
  const { data: invoiceData, isLoading } = useInvoices(schoolId, { studentId })

  const payableInvoices: Invoice[] = useMemo(() => {
    if (!invoiceData) return []
    const items = Array.isArray(invoiceData)
      ? invoiceData
      : 'items' in invoiceData && Array.isArray(invoiceData.items)
        ? invoiceData.items
        : []
    return items.filter((inv) =>
      (PAYABLE_STATUSES as readonly string[]).includes(inv.status),
    )
  }, [invoiceData])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] animate-spin" />
        <span className="ms-2 text-sm text-[rgb(var(--text-tertiary))]">
          {t('recordPayment.loadingInvoices')}
        </span>
      </div>
    )
  }

  if (payableInvoices.length === 0) {
    return (
      <div className="py-6 text-center">
        <FileText className="w-6 h-6 mx-auto mb-1.5 text-[rgb(var(--text-tertiary))] opacity-40" />
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          {t('recordPayment.noUnpaidInvoices')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {payableInvoices.map((invoice) => {
        const isSelected = selectedInvoiceId === invoice.id
        return (
          <button
            key={invoice.id}
            type="button"
            onClick={() =>
              onSelect(
                invoice.id,
                invoice.amountDue,
                `${invoice.invoiceNumber} - ${invoice.studentName}`,
              )
            }
            className={`w-full text-start px-3 py-2.5 rounded-lg border transition-colors ${
              isSelected
                ? 'border-[rgb(var(--border-focus))] bg-[rgb(var(--state-info-bg)/0.18)]  border-[rgb(var(--border-focus))]'
                : 'border-[rgb(var(--border-primary))] hover:bg-[rgb(var(--background-secondary))]'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 mt-0.5 text-[rgb(var(--text-tertiary))] flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                    {invoice.invoiceNumber}
                  </span>
                  <span className="text-sm font-semibold text-[rgb(var(--action-secondary-fg))]  flex-shrink-0">
                    {format(invoice.amountDue)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs text-[rgb(var(--text-secondary))] truncate">
                    {invoice.dueDate
                      ? t('recordPayment.dueDate', {
                          date: formatDate(invoice.dueDate, listSettings),
                        })
                      : ''}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusBadgeClass(invoice.status)}`}>
                    {t(`status.${invoice.status}`, {
                      defaultValue: statusLabel(invoice.status),
                    })}
                  </span>
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function RecordPaymentPage() {
  const { t } = useTranslation('payments')
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const settings = useFinanceSettings()
  const { format: formatCurr } = useCurrency(settings)
  const searchParams = useSearch({ strict: false }) as {
    invoiceId?: string
    amount?: string
  }

  const [selectedStudent, setSelectedStudent] = useState<{
    studentId: string
    studentName: string
  } | null>(null)
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

  const handleStudentChange = useCallback(
    (value: { studentId: string; studentName: string } | null) => {
      setSelectedStudent(value)
      // Reset invoice selection when student changes
      setInvoiceId('')
      setInvoiceLabel('')
      setAmount('')
    },
    [],
  )

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
      toast.error(t('recordPayment.selectInvoiceError'))
      return
    }
    if (parsedAmount <= 0) {
      toast.error(t('recordPayment.validAmountError'))
      return
    }
    if ((paymentMethod === 'bank_transfer' || paymentMethod === 'cheque') && !referenceNumber.trim()) {
      toast.error(t('recordPayment.referenceRequired'))
      return
    }

    try {
      await recordMutation.mutateAsync({
        invoiceId: invoiceId.trim(),
        gateway: paymentMethod,
        amount: parsedAmount,
        currency: settings.currency,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        paidDate: paidDate || undefined,
      })
      toast.success(t('recordPayment.recordSuccess'))
      setSuccess(true)
    } catch {
      toast.error(t('recordPayment.recordFailed'))
    }
  }

  const handleRecordAnother = () => {
    setSelectedStudent(null)
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
        {t('recordPayment.selectSchool')}
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="text-center py-16 space-y-4">
          <CheckCircle2 className="w-16 h-16 mx-auto text-[rgb(var(--state-success-fg))]" />
          <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
            {t('recordPayment.successTitle')}
          </h2>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {t('recordPayment.successDescription')}
          </p>
          <Button onClick={handleRecordAnother}>
            <RotateCcw className="w-4 h-4 me-1.5" />
            {t('recordPayment.recordAnother')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            {t('recordPayment.title')}
          </h1>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5">
            {t('recordPayment.description')}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Step 1: Select Student */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              {t('recordPayment.studentRequired')}
            </label>
            <StudentSearchInput
              schoolId={schoolId}
              value={selectedStudent}
              onChange={handleStudentChange}
              placeholder={t('recordPayment.studentSearchPlaceholder')}
            />
          </div>

          {/* Step 2: Select Invoice */}
          {selectedStudent && (
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                {t('recordPayment.invoiceRequired')}
              </label>
              <StudentInvoiceList
                schoolId={schoolId}
                studentId={selectedStudent.studentId}
                selectedInvoiceId={invoiceId}
                onSelect={handleInvoiceSelect}
              />
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
              {t('recordPayment.paymentMethodRequired')}
            </label>
            <div className="flex gap-3">
              {([
                { value: 'cash' as const, label: t('gateway.cash') },
                { value: 'bank_transfer' as const, label: t('gateway.bankTransfer') },
                { value: 'cheque' as const, label: t('gateway.cheque') },
              ]).map((method) => (
                <label
                  key={method.value}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                    paymentMethod === method.value
                      ? 'border-[rgb(var(--border-focus))] bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]   border-[rgb(var(--border-focus))]'
                      : 'border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))]'
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
              {t('recordPayment.amountRequired', { currency: settings.currency })}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
            />
          </div>

          {/* Reference Number (for bank_transfer and cheque) */}
          {(paymentMethod === 'bank_transfer' || paymentMethod === 'cheque') && (
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                {t('recordPayment.referenceRequiredLabel')}
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder={
                  paymentMethod === 'bank_transfer'
                    ? t('recordPayment.bankReferencePlaceholder')
                    : t('recordPayment.chequeReferencePlaceholder')
                }
                className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
              />
            </div>
          )}

          {/* Date Paid */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              {t('recordPayment.datePaid')}
            </label>
            <input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              {t('invoices.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t('recordPayment.notesPlaceholder')}
              className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
            />
          </div>
        </div>

        {/* Preview */}
        {parsedAmount > 0 && (
          <div className="bg-[rgb(var(--background-secondary))] rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              {t('recordPayment.preview')}
            </h3>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                <span>{t('invoices.invoiceNumber')}</span>
                <span className="font-medium text-[rgb(var(--text-primary))] max-w-[60%] truncate text-end">
                  {invoiceLabel || invoiceId || '--'}
                </span>
              </div>
              <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                <span>{t('recordPayment.method')}</span>
                <span className="font-medium text-[rgb(var(--text-primary))]">
                  {formatPaymentMethod(paymentMethod, t)}
                </span>
              </div>
              {referenceNumber && (
                <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                  <span>{t('recordPayment.reference')}</span>
                  <span className="font-medium text-[rgb(var(--text-primary))]">
                    {referenceNumber}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                <span>{t('paymentsList.date')}</span>
                <span className="font-medium text-[rgb(var(--text-primary))]">
                  {paidDate ? formatDate(paidDate, settings) : '--'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-[rgb(var(--text-primary))] border-t border-[rgb(var(--border-primary))] pt-2 mt-2">
                <span>{t('lineItems.amount')}</span>
                <span>{formatCurr(parsedAmount)}</span>
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
            <Loader2 className="w-4 h-4 animate-spin me-1.5" />
          ) : (
            <Banknote className="w-4 h-4 me-1.5" />
          )}
          {t('recordPayment.title')}
        </Button>
      </div>
    </div>
  )
}
