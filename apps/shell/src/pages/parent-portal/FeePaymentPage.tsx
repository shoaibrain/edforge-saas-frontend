/**
 * FeePaymentPage
 *
 * Parent-facing page for viewing invoices and making payments.
 * Replaces the ComingSoon placeholder at /parent-portal/fees.
 *
 * Flow: Invoice List → Invoice Detail → Payment Form → (gateway redirect)
 */

import { useState } from 'react'
import type { Invoice } from '@edforge/types'
import { useTranslation } from '@edforge/i18n'
import { useNavigate } from '@tanstack/react-router'
import { CreditCard, Loader2, AlertTriangle } from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import { useInvoices } from '../../hooks/usePayments'
import { useEnabledGateways } from '../../hooks/usePaymentGateways'
import { InvoiceList } from '../../components/payments/InvoiceList'
import { InvoiceDetail } from '../../components/payments/InvoiceDetail'
import { PaymentForm } from '../../components/payments/PaymentForm'

type PageView = 'list' | 'detail' | 'pay'

export default function FeePaymentPage() {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()
  const schoolId = useAppStore((s) => s.activeSchoolId)

  const [view, setView] = useState<PageView>('list')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const {
    data: invoiceData,
    isLoading: invoicesLoading,
    error: invoicesError,
  } = useInvoices(schoolId ?? '')

  const {
    data: gateways,
  } = useEnabledGateways(schoolId ?? '')

  const invoices = Array.isArray(invoiceData) ? invoiceData : (invoiceData?.items ?? [])

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setView('detail')
  }

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setView('pay')
  }

  const handleBackToList = () => {
    setSelectedInvoice(null)
    setView('list')
  }

  const handleBackToDetail = () => {
    setView('detail')
  }

  const handlePaymentComplete = (paymentId: string) => {
    navigate({ to: `/payments/${paymentId}/receipt` as string })
  }

  // No school selected
  if (!schoolId) {
    return (
      <div className="text-center py-16">
        <CreditCard className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--text-tertiary))] opacity-40" />
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          Select a school to view fee payments.
        </p>
      </div>
    )
  }

  // Error
  if (invoicesError) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-400" />
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
          {t('error.failedToLoad')}
        </p>
        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
          {t('error.tryAgain')}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header — only show on list view */}
      {view === 'list' && (
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[rgb(var(--text-primary))]">
            {t('title')}
          </h1>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-0.5">
            {t('description')}
          </p>
        </div>
      )}

      {/* Loading */}
      {invoicesLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        </div>
      ) : view === 'list' ? (
        <InvoiceList
          invoices={invoices}
          onSelectInvoice={handleSelectInvoice}
          onPayInvoice={handlePayInvoice}
        />
      ) : view === 'detail' && selectedInvoice ? (
        <InvoiceDetail
          invoice={selectedInvoice}
          onBack={handleBackToList}
          onPay={() => setView('pay')}
        />
      ) : view === 'pay' && selectedInvoice ? (
        <PaymentForm
          invoice={selectedInvoice}
          schoolId={schoolId}
          gateways={gateways ?? []}
          onBack={handleBackToDetail}
          onComplete={handlePaymentComplete}
        />
      ) : null}
    </div>
  )
}
