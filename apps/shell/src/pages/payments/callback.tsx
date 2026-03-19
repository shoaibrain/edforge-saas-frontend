/**
 * Payment Callback Page
 *
 * Handles redirect back from payment gateway after payment attempt.
 * Route: /payments/callback?sessionId=xxx&status=success|failed|cancelled
 *
 * Security:
 * - Session ID is verified server-side (no client trust)
 * - Direct navigation without session ID redirects to parent portal
 */

import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { useVerifyPayment } from '../../hooks/usePayments'

const CALLBACK_CACHE_PREFIX = 'payment_verified_'

export default function PaymentCallbackPage() {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()
  const verifiedOnce = useRef(false)

  // Parse URL params — capture ALL query params for gateway callback forwarding
  const { sessionId, callbackParams } = useMemo(() => {
    const search = new URLSearchParams(window.location.search)
    const sid = search.get('sessionId')

    // Build a record of all params except sessionId/status (those are ours, rest are gateway-specific)
    const gatewayParams: Record<string, string> = {}
    search.forEach((value, key) => {
      if (key !== 'sessionId' && key !== 'status') {
        gatewayParams[key] = value
      }
    })

    return {
      sessionId: sid,
      status: search.get('status'),
      callbackParams: Object.keys(gatewayParams).length > 0 ? gatewayParams : undefined,
    }
  }, [])

  // Check if this session was already verified (page refresh handling)
  const cachedResult = useMemo(() => {
    if (!sessionId) return null
    try {
      const cached = sessionStorage.getItem(`${CALLBACK_CACHE_PREFIX}${sessionId}`)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  }, [sessionId])

  // Redirect if no session ID (direct navigation)
  useEffect(() => {
    if (!sessionId) {
      navigate({ to: '/parent-portal/fees' })
    }
  }, [sessionId, navigate])

  // Only verify if not already verified (prevents duplicate calls on re-render/refresh)
  const shouldVerify = !!sessionId && !cachedResult && !verifiedOnce.current

  // Verify payment with backend — forward all gateway callback params
  const { data, isLoading, error } = useVerifyPayment(
    shouldVerify ? sessionId : null,
    callbackParams,
  )

  // Use cached result if available, otherwise use live data
  const resolvedData = cachedResult || data

  // Cache successful verification result in sessionStorage
  useEffect(() => {
    if (data && !verifiedOnce.current && sessionId) {
      verifiedOnce.current = true
      try {
        sessionStorage.setItem(
          `${CALLBACK_CACHE_PREFIX}${sessionId}`,
          JSON.stringify(data),
        )
      } catch { /* sessionStorage full or unavailable — safe to ignore */ }
    }
  }, [data, sessionId])

  // Redirect to receipt on success
  useEffect(() => {
    if (resolvedData?.status === 'completed' && resolvedData.payment?.id) {
      const timer = setTimeout(() => {
        navigate({ to: `/payments/${resolvedData.payment.id}/receipt` as string })
      }, 2000) // Brief delay to show success state
      return () => clearTimeout(timer)
    }
  }, [resolvedData, navigate])

  if (!sessionId) {
    return null // Redirecting
  }

  // Loading state — verifying with backend
  if (isLoading && !resolvedData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 mx-auto mb-4 text-teal-500 animate-spin" />
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
            {t('flow.verifying')}
          </p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
            {t('flow.verifyDescription', { gateway: t('flow.gateway') })}
          </p>
        </div>
      </div>
    )
  }

  // Verification error (network/server failure)
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="p-4 rounded-full bg-red-100 dark:bg-red-500/10 inline-flex mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            {t('error.failedToVerify')}
          </p>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-2">
            {t('error.networkError')}
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <button
              type="button"
              onClick={() => navigate({ to: '/parent-portal/fees' })}
              className="px-6 py-2 rounded-xl border border-[rgb(var(--border-primary))] text-sm font-medium
                text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
            >
              {t('flow.returnToInvoices')}
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold
                hover:bg-teal-700 transition-colors"
            >
              {t('actions.retry')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Payment completed successfully
  if (resolvedData?.status === 'completed') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-500/10 inline-flex mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            {t('flow.paymentSuccessful')}
          </p>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-2">
            {t('receipt.thankYou')}
          </p>
          <Loader2 className="w-4 h-4 mx-auto mt-4 text-[rgb(var(--text-tertiary))] animate-spin" />
        </div>
      </div>
    )
  }

  // Payment failed
  if (resolvedData?.status === 'failed') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="p-4 rounded-full bg-red-100 dark:bg-red-500/10 inline-flex mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
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
              onClick={() => navigate({ to: '/parent-portal/fees' })}
              className="px-6 py-2 rounded-xl border border-[rgb(var(--border-primary))] text-sm font-medium
                text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
            >
              {t('flow.returnToInvoices')}
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: '/parent-portal/fees' })}
              className="px-6 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold
                hover:bg-teal-700 transition-colors"
            >
              {t('flow.tryAgain')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Payment cancelled
  if (resolvedData?.status === 'cancelled') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-sm">
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
            onClick={() => navigate({ to: '/parent-portal/fees' })}
            className="mt-6 px-6 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold
              hover:bg-teal-700 transition-colors"
          >
            {t('flow.returnToInvoices')}
          </button>
        </div>
      </div>
    )
  }

  return null
}
