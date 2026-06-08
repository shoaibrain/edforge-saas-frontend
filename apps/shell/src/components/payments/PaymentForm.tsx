/**
 * PaymentForm
 *
 * Gateway selection + payment confirmation flow.
 * Uses the usePaymentFlow state machine for clean transitions.
 */

import { useEffect, useState } from 'react'
import type { Invoice, PaymentGatewayPublicConfig } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useTranslation } from '@edforge/i18n'
import { ArrowLeft, Loader2, ExternalLink, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import { useSettings } from '../../lib/shell-context'
import { usePaymentFlow } from '../../hooks/usePaymentFlow'
import { useVerifyPayment } from '../../hooks/usePayments'
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
  const { t } = useTranslation('payments')
  const settings = useSettings()
  const { format } = useCurrency(settings)

  const {
    state,
    start,
    selectGateway,
    goBackToGatewaySelection,
    confirmAndPay,
    reset,
  } = usePaymentFlow(invoice, schoolId)

  // Verification state — enabled when user clicks "Check Status"
  const [verifySessionId, setVerifySessionId] = useState<string | null>(null)
  const { data: verifyResult, isLoading: isVerifying, error: verifyError } = useVerifyPayment(verifySessionId)

  // Handle verification result
  useEffect(() => {
    if (verifyResult?.status === 'completed' && verifyResult.payment?.id) {
      onComplete(verifyResult.payment.id)
    }
  }, [verifyResult, onComplete])

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

        <div className="p-4 rounded-xl border-2 border-[rgb(var(--state-info-border)/0.35)]  bg-[rgb(var(--state-info-bg)/0.18)]/50 dark:bg-[rgb(var(--state-info-bg)/0.18)]0/5">
          <p className="text-sm text-[rgb(var(--text-primary))]">
            {t('flow.confirmDescription', {
              amount: format(invoice.amountDue),
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
            className="flex-1 py-2.5 rounded-xl bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] text-sm font-semibold
              hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
          >
            {t('flow.confirmPayment')}
          </button>
        </div>
      </div>
    )
  }

  // Initiating — spinner while API call is in progress
  if (state.status === 'initiating') {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-10 h-10 mx-auto mb-4 text-[rgb(var(--action-secondary-fg))] animate-spin" />
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
          {t('flow.processingPayment')}
        </p>
      </div>
    )
  }

  // Redirecting — payment in progress in another tab
  if (state.status === 'redirecting') {
    const gatewayLabel = t(`gateway.${state.gateway}`)

    // Verification completed with a failed/cancelled result
    if (verifyResult && verifyResult.status !== 'completed') {
      return (
        <div className="text-center py-16">
          <div className="p-4 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 inline-flex mb-4">
            <XCircle className="w-8 h-8 text-[rgb(var(--state-danger-fg))]" />
          </div>
          <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            {t('flow.paymentFailed')}
          </p>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-2">
            {t('flow.failedDescription')}
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
              onClick={() => { setVerifySessionId(null); reset(); start() }}
              className="px-6 py-2 rounded-xl bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] text-sm font-semibold
                hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
            >
              {t('flow.tryAgain')}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="text-center py-16">
        <div className="p-4 rounded-full bg-[rgb(var(--state-info-bg)/0.18)]  inline-flex mb-4">
          <ExternalLink className="w-8 h-8 text-[rgb(var(--action-secondary-fg))] " />
        </div>
        <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">
          {t('flow.paymentInProgress')}
        </p>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-2 max-w-sm mx-auto">
          {t('flow.paymentInProgressDescription', { gateway: gatewayLabel })}
        </p>

        {verifyError && (
          <p className="text-sm text-[rgb(var(--state-danger-fg))] mt-3">
            {t('error.failedToVerify')}
          </p>
        )}

        <div className="flex gap-3 justify-center mt-6">
          <button
            type="button"
            onClick={() => { setVerifySessionId(null); reset(); onBack() }}
            className="px-6 py-2 rounded-xl border border-[rgb(var(--border-primary))] text-sm font-medium
              text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
          >
            {t('actions.cancel')}
          </button>
          <button
            type="button"
            disabled={isVerifying}
            onClick={() => setVerifySessionId(state.sessionId)}
            className="px-6 py-2 rounded-xl bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] text-sm font-semibold
              hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('flow.verifying')}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {t('flow.checkStatus')}
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Error / failed
  if (state.status === 'failed') {
    return (
      <div className="text-center py-16">
        <div className="p-4 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 inline-flex mb-4">
          <XCircle className="w-8 h-8 text-[rgb(var(--state-danger-fg))]" />
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
            className="px-6 py-2 rounded-xl bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] text-sm font-semibold
              hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
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
          className="mt-6 px-6 py-2 rounded-xl bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] text-sm font-semibold
            hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
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
