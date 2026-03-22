/**
 * FeePaymentPage
 *
 * Parent-facing page for viewing invoices and making payments.
 * Replaces the ComingSoon placeholder at /parent-portal/fees.
 *
 * Flow: Invoice List → Invoice Detail → Payment Form → (gateway redirect)
 *
 * Student-scoped: Filters invoices to the active child from ParentPortalContext.
 * Only shows issued/partially_paid invoices (payable statuses).
 */

import { useState, useMemo } from 'react'
import type { Invoice } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useTranslation } from '@edforge/i18n'
import { useNavigate } from '@tanstack/react-router'
import { CreditCard, Loader2, AlertTriangle, ShieldX, CheckCircle2 } from 'lucide-react'
import { useSettings } from '../../lib/shell-context'
import { useAppStore } from '../../stores/app.store'
import { useParentPortal } from './ParentPortalLayout'
import { useInvoices } from '../../hooks/usePayments'
import { useEnabledGateways } from '@edforge/finance-services'
import { InvoiceList } from '../../components/payments/InvoiceList'
import { InvoiceDetail } from '../../components/payments/InvoiceDetail'
import { PaymentForm } from '../../components/payments/PaymentForm'

type PageView = 'list' | 'detail' | 'pay'

export default function FeePaymentPage() {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()
  const settings = useSettings()
  const { format } = useCurrency(settings)
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const { activeChild } = useParentPortal()

  const [view, setView] = useState<PageView>('list')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const {
    data: invoiceData,
    isLoading: invoicesLoading,
    error: invoicesError,
  } = useInvoices(schoolId ?? '', {
    studentId: activeChild?.studentId,
    status: ['issued', 'partially_paid'] as any,
  })

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

  // No active child selected
  if (!activeChild) {
    return (
      <div className="p-6">
        <p className="text-sm text-[rgb(var(--text-secondary))]">Please select a child to view fees.</p>
      </div>
    )
  }

  // 403 Forbidden — permission denied
  if (invoicesError && (invoicesError as any)?.response?.status === 403) {
    return (
      <div className="text-center py-16">
        <ShieldX className="w-10 h-10 mx-auto mb-3 text-amber-400" />
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
          You don't have permission to view billing information.
        </p>
        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
          Please contact your school administrator if you believe this is an error.
        </p>
      </div>
    )
  }

  // Other errors
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

  // Fee summary calculations from the fetched invoice data
  const feeSummary = useMemo(() => {
    const safeInvoices: Invoice[] = Array.isArray(invoices) ? invoices : []
    const totalFees = safeInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
    const totalPaid = safeInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0)
    const totalRemaining = safeInvoices.reduce((sum, inv) => sum + (inv.amountDue || 0), 0)
    const hasOverdue = safeInvoices.some((inv) => inv.status === 'overdue')
    return { totalFees, totalPaid, totalRemaining, hasOverdue }
  }, [invoices])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header — only show on list view */}
      {view === 'list' && (
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[rgb(var(--text-primary))]">
            {activeChild.firstName}'s Fees
          </h1>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-0.5">
            {t('description')}
          </p>
        </div>
      )}

      {/* Fee Summary Cards — only show on list view when there are invoices */}
      {view === 'list' && !invoicesLoading && invoices.length > 0 && (
        <div className="mb-6">
          {feeSummary.totalRemaining === 0 ? (
            /* All fees paid — success state */
            <div className="flex items-center gap-3 p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  All fees are paid
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                  Total paid: {format(feeSummary.totalPaid)}
                </p>
              </div>
            </div>
          ) : (
            /* Summary cards grid */
            <div className="grid grid-cols-3 gap-3">
              {/* Total Fees */}
              <div className="p-3 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--bg-primary))]">
                <p className="text-[10px] font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-1">
                  Total Fees
                </p>
                <p className="text-lg font-bold text-[rgb(var(--text-primary))]">
                  {format(feeSummary.totalFees)}
                </p>
              </div>

              {/* Paid */}
              <div className="p-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
                <p className="text-[10px] font-medium text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">
                  Paid
                </p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                  {format(feeSummary.totalPaid)}
                </p>
              </div>

              {/* Remaining */}
              <div className={`p-3 rounded-xl border ${
                feeSummary.hasOverdue
                  ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                  : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10'
              }`}>
                <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${
                  feeSummary.hasOverdue
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  Remaining
                </p>
                <p className={`text-lg font-bold ${
                  feeSummary.hasOverdue
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-amber-700 dark:text-amber-300'
                }`}>
                  {format(feeSummary.totalRemaining)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {invoicesLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        </div>
      ) : invoices.length === 0 && view === 'list' ? (
        <div className="text-center py-16">
          <CreditCard className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--text-tertiary))] opacity-40" />
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
            No pending fees for {activeChild.firstName}
          </p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
            All fees are up to date.
          </p>
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
