/**
 * PaymentForm
 *
 * Gateway selection + payment confirmation flow.
 * Uses the usePaymentFlow state machine for clean transitions.
 */

import type { Invoice, PaymentGatewayPublicConfig } from '@edforge/types'
import { formatNPR } from '@edforge/types'
import { useTranslation } from '@edforge/i18n'
import { ArrowLeft, Loader2, ExternalLink, AlertTriangle, XCircle } from 'lucide-react'
import { usePaymentFlow } from '../../hooks/usePaymentFlow'
import { PaymentMethodSelector } from './PaymentMethodSelector'
import { PaymentSummary } from './PaymentSummary'

interface PaymentFormProps {
  invoice: Invoice
  schoolId: string
  gateways: PaymentGatewayPublicConfig[]
  onBack: () => void
  onComplete: (paymentId: string) => void
}

export function PaymentForm({
  invoice,
  schoolId,
  gateways,
  onBack,
  onComplete,
}: PaymentFormProps) {
  const { t, i18n } = useTranslation('payments')
  const locale = (i18n.language === 'ne' ? 'ne' : 'en') as 'en' | 'ne'

  const {
    state,
    start,
    selectGateway,
    goBackToGatewaySelection,
    confirmAndPay,
    reset,
  } = usePaymentFlow(invoice, schoolId)

  // Auto-start if idle
  if (state.status === 'idle') {
    start()
    return null
  }

  // Gateway selection step
  if (state.status === 'selecting_gateway') {
    return (
      <div className="space-y-6">
        <Header onBack={onBack} title={t('gateway.selectMethod')} t={t} />
        <PaymentSummary invoice={invoice} compact />
        <PaymentMethodSelector
          gateways={gateways}
          selected={state.gateway}
          onSelect={selectGateway}
        />
      </div>
    )
  }

  // Confirmation step
  if (state.status === 'confirming' && state.gateway) {
    const gatewayLabel = gateways.find((g) => g.gateway === state.gateway)?.displayName
      || t(`gateway.${state.gateway}`)

    return (
      <div className="space-y-6">
        <Header onBack={goBackToGatewaySelection} title={t('flow.confirmPayment')} t={t} />

        <div className="p-4 rounded-xl bg-[rgb(var(--bg-secondary))] space-y-3">
          <PaymentSummary invoice={invoice} />
        </div>

        <div className="p-4 rounded-xl border-2 border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-500/5">
          <p className="text-sm text-[rgb(var(--text-primary))]">
            {t('flow.confirmDescription', {
              amount: formatNPR(invoice.amountDue, { locale }),
              gateway: gatewayLabel,
            })}
          </p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-2 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            {t('flow.redirectDescription', { gateway: gatewayLabel })}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={goBackToGatewaySelection}
            className="flex-1 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] text-sm font-medium
              text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
          >
            {t('actions.back')}
          </button>
          <button
            type="button"
            onClick={confirmAndPay}
            className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold
              hover:bg-teal-700 transition-colors"
          >
            {t('flow.confirmPayment')}
          </button>
        </div>
      </div>
    )
  }

  // Initiating / redirecting
  if (state.status === 'initiating' || state.status === 'redirecting') {
    const gatewayLabel = t(`gateway.${state.gateway}`)
    return (
      <div className="text-center py-16">
        <Loader2 className="w-10 h-10 mx-auto mb-4 text-teal-500 animate-spin" />
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
          {state.status === 'initiating'
            ? t('flow.processingPayment')
            : t('flow.redirecting', { gateway: gatewayLabel })}
        </p>
        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
          {t('flow.redirectDescription', { gateway: gatewayLabel })}
        </p>
      </div>
    )
  }

  // Error / failed
  if (state.status === 'failed') {
    return (
      <div className="text-center py-16">
        <div className="p-4 rounded-full bg-red-100 dark:bg-red-500/10 inline-flex mb-4">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">
          {t('flow.paymentFailed')}
        </p>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-2 max-w-sm mx-auto">
          {state.error || t('flow.failedDescription')}
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 rounded-xl border border-[rgb(var(--border-primary))] text-sm font-medium
              text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
          >
            {t('flow.returnToInvoices')}
          </button>
          <button
            type="button"
            onClick={() => { reset(); start() }}
            className="px-6 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold
              hover:bg-teal-700 transition-colors"
          >
            {t('flow.tryAgain')}
          </button>
        </div>
      </div>
    )
  }

  // Cancelled
  if (state.status === 'cancelled') {
    return (
      <div className="text-center py-16">
        <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-500/10 inline-flex mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">
          {t('flow.paymentCancelled')}
        </p>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-2">
          {t('flow.cancelledDescription')}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 px-6 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold
            hover:bg-teal-700 transition-colors"
        >
          {t('flow.returnToInvoices')}
        </button>
      </div>
    )
  }

  // Success — redirect to receipt
  if (state.status === 'success' && state.receipt) {
    onComplete(state.receipt.paymentId)
    return null
  }

  return null
}

function Header({
  onBack,
  title,
  t,
}: {
  onBack: () => void
  title: string
  t: (key: string) => string
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="p-1.5 rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
        aria-label={t('actions.back')}
      >
        <ArrowLeft className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
      </button>
      <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
        {title}
      </h2>
    </div>
  )
}
