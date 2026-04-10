/**
 * FeePaymentPage (v2)
 *
 * Parent-facing page for viewing invoices and making payments.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  CRITICAL: PageView state machine preserved from v1.                   │
 * │                                                                        │
 * │  view === 'list'   → NEW v2 assembly (stat strip, year progress,      │
 * │                       invoice ledger with filter tabs, payment          │
 * │                       history, category breakdown)                      │
 * │  view === 'detail' → UNCHANGED InvoiceDetail component                │
 * │  view === 'pay'    → UNCHANGED PaymentForm component                  │
 * │                                                                        │
 * │  The view/setView state management, selectedInvoice, gateway           │
 * │  integration, and all callback handlers remain exactly as-is.          │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Inline apiGet migration: Not applicable — FeePaymentPage already uses
 * useInvoices and useEnabledGateways hooks (no inline apiGet calls).
 *
 * ABAC: billing:view (Student, Parent), billing:create (Parent only).
 */

import { useState } from 'react'
import type { Invoice } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useTranslation } from '@edforge/i18n'
import { useNavigate } from '@tanstack/react-router'
import { CreditCard, ShieldX, AlertTriangle } from 'lucide-react'
import { WidgetErrorBoundaryV2, ContentSection } from '@edforge/ui'
import { useSettings } from '../../lib/shell-context'
import { useAppStore } from '../../stores/app.store'
import { useParentPortal } from './ParentPortalLayout'
import { useInvoices } from '../../hooks/usePayments'
import { useEnabledGateways } from '@edforge/finance-services'
import { NoActiveChild } from '../portal-shared/NoActiveChild'

// Existing payment flow components — UNCHANGED
import { InvoiceDetail } from '../../components/payments/InvoiceDetail'
import { PaymentForm } from '../../components/payments/PaymentForm'

// New v2 section components
import { FeeStatStrip } from './sections/FeeStatStrip'
import { YearProgressTrack } from './sections/YearProgressTrack'
import { InvoiceLedger } from './sections/InvoiceLedger'
import { PaymentHistory, type PaymentHistoryEntry } from './sections/PaymentHistory'
import { CategoryBreakdown } from './sections/CategoryBreakdown'

// ============================================================================
// PAGE VIEW STATE MACHINE — preserved exactly from v1
// ============================================================================

type PageView = 'list' | 'detail' | 'pay'

// ============================================================================
// COMPONENT
// ============================================================================

export default function FeePaymentPage() {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()
  const settings = useSettings()
  const { format } = useCurrency(settings)
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const { activeChild } = useParentPortal()

  // ---- State machine (PRESERVED from v1) ----
  const [view, setView] = useState<PageView>('list')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // ---- Data hooks ----
  // Single query for all invoices — the InvoiceLedger component handles tab filtering
  const {
    data: allInvoiceData,
    isLoading: allInvoicesLoading,
    error: invoicesError,
  } = useInvoices(schoolId ?? '', {
    studentId: activeChild?.studentId,
  })

  const { data: gateways } = useEnabledGateways(schoolId ?? '')

  const allInvoices: Invoice[] = Array.isArray(allInvoiceData)
    ? allInvoiceData
    : (allInvoiceData?.items ?? [])

  // ---- Callbacks (PRESERVED from v1) ----
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

  // ---- Payment history entries from ledger data ----
  // TODO: derive payment history via useStudentAccounts → useStudentLedger
  // lookup when billing account resolution is available. The ledger endpoint
  // expects a billing accountId (not studentId), so we need to first resolve
  // the student's billing account before fetching the transaction ledger.
  const paymentEntries: PaymentHistoryEntry[] = []

  // ---- Guard: no school ----
  if (!schoolId) {
    return (
      <div className="text-center py-16">
        <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" style={{ color: 'var(--v2-text-hint)' }} />
        <p className="text-sm" style={{ color: 'var(--v2-text-hint)' }}>
          Select a school to view fee payments.
        </p>
      </div>
    )
  }

  // ---- Guard: no active child ----
  if (!activeChild) return <NoActiveChild />

  // ---- Guard: 403 Forbidden ----
  if (invoicesError && (invoicesError as any)?.response?.status === 403) {
    return (
      <div className="text-center py-16">
        <ShieldX className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--v2-warning)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--v2-text-primary)' }}>
          You don't have permission to view billing information.
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--v2-text-hint)' }}>
          Please contact your school administrator if you believe this is an error.
        </p>
      </div>
    )
  }

  // ---- Guard: other errors ----
  if (invoicesError) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--v2-danger)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--v2-text-primary)' }}>
          {t('error.failedToLoad')}
        </p>
      </div>
    )
  }

  // ===========================================================================
  // VIEW ROUTING — the PageView state machine
  // ===========================================================================

  // DETAIL VIEW — UNCHANGED from v1
  if (view === 'detail' && selectedInvoice) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <InvoiceDetail
          invoice={selectedInvoice}
          onBack={handleBackToList}
          onPay={() => setView('pay')}
        />
      </div>
    )
  }

  // PAY VIEW — UNCHANGED from v1
  if (view === 'pay' && selectedInvoice) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PaymentForm
          invoice={selectedInvoice}
          schoolId={schoolId}
          gateways={gateways ?? []}
          onBack={handleBackToDetail}
          onComplete={handlePaymentComplete}
        />
      </div>
    )
  }

  // ===========================================================================
  // LIST VIEW — NEW v2 assembly
  // ===========================================================================

  return (
    <div className="p-6 space-y-6" data-v2>
      <ContentSection
        heading={t('title')}
        subheading={`${activeChild.firstName} — ${t('description')}`}
        staggerIndex={0}
      />

      {/* Stat strip */}
      <WidgetErrorBoundaryV2>
        <FeeStatStrip
          invoices={allInvoices}
          loading={allInvoicesLoading}
          formatCurrency={format}
        />
      </WidgetErrorBoundaryV2>

      {/* Year progress track */}
      <WidgetErrorBoundaryV2>
        <YearProgressTrack
          invoices={allInvoices}
          loading={allInvoicesLoading}
          formatCurrency={format}
          staggerIndex={2}
        />
      </WidgetErrorBoundaryV2>

      {/* Invoice ledger with filter tabs */}
      <WidgetErrorBoundaryV2>
        <InvoiceLedger
          invoices={allInvoices}
          loading={allInvoicesLoading}
          formatCurrency={format}
          onSelectInvoice={handleSelectInvoice}
          onPayInvoice={handlePayInvoice}
          staggerIndex={3}
        />
      </WidgetErrorBoundaryV2>

      {/* Payment history + Category breakdown split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WidgetErrorBoundaryV2>
          <PaymentHistory
            payments={paymentEntries}
            loading={false}
            formatCurrency={format}
            staggerIndex={4}
          />
        </WidgetErrorBoundaryV2>

        <WidgetErrorBoundaryV2>
          <CategoryBreakdown
            invoices={allInvoices}
            loading={allInvoicesLoading}
            formatCurrency={format}
            staggerIndex={5}
          />
        </WidgetErrorBoundaryV2>
      </div>
    </div>
  )
}
