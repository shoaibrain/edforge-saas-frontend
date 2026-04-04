/**
 * usePaymentFlow — Finite State Machine for payment lifecycle
 *
 * Manages the complete payment UI state with clean transitions:
 *   idle → selecting_gateway → confirming → initiating → redirecting
 *     → verifying → success | failed | cancelled
 *
 * Security:
 * - Never stores gateway credentials
 * - Redirect URL comes from backend only
 * - Session ID validated on callback
 */

import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { Invoice, PaymentGateway, Receipt } from '@edforge/types'
import { initiatePayment } from '../services/payments.service'
import { useSettings } from '../lib/shell-context'

// ============================================================================
// STATE TYPES
// ============================================================================

export type PaymentFlowStatus =
  | 'idle'
  | 'selecting_gateway'
  | 'confirming'
  | 'initiating'
  | 'redirecting'
  | 'verifying'
  | 'success'
  | 'failed'
  | 'cancelled'

export interface PaymentFlowState {
  status: PaymentFlowStatus
  gateway: PaymentGateway | null
  sessionId: string | null
  receipt: Receipt | null
  error: string | null
}

const initialState: PaymentFlowState = {
  status: 'idle',
  gateway: null,
  sessionId: null,
  receipt: null,
  error: null,
}

// ============================================================================
// ACTIONS
// ============================================================================

type PaymentFlowAction =
  | { type: 'START' }
  | { type: 'SELECT_GATEWAY'; gateway: PaymentGateway }
  | { type: 'CONFIRM' }
  | { type: 'INITIATE_START' }
  | { type: 'INITIATE_SUCCESS'; sessionId: string }
  | { type: 'VERIFY_START'; sessionId: string }
  | { type: 'VERIFY_SUCCESS'; receipt: Receipt }
  | { type: 'VERIFY_FAILED'; error: string }
  | { type: 'CANCELLED' }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' }

// ============================================================================
// REDUCER
// ============================================================================

function paymentFlowReducer(
  state: PaymentFlowState,
  action: PaymentFlowAction
): PaymentFlowState {
  switch (action.type) {
    case 'START':
      return { ...initialState, status: 'selecting_gateway' }

    case 'SELECT_GATEWAY':
      return { ...state, status: 'confirming', gateway: action.gateway }

    case 'CONFIRM':
      return { ...state, status: 'initiating' }

    case 'INITIATE_START':
      return { ...state, status: 'initiating', error: null }

    case 'INITIATE_SUCCESS':
      return { ...state, status: 'redirecting', sessionId: action.sessionId }

    case 'VERIFY_START':
      return { ...state, status: 'verifying', sessionId: action.sessionId }

    case 'VERIFY_SUCCESS':
      return { ...state, status: 'success', receipt: action.receipt }

    case 'VERIFY_FAILED':
      return { ...state, status: 'failed', error: action.error }

    case 'CANCELLED':
      return { ...state, status: 'cancelled' }

    case 'ERROR':
      return { ...state, status: 'failed', error: action.error }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

// ============================================================================
// HOOK
// ============================================================================

/** Max time to wait for gateway redirect before timing out (default 30 min) */
const PAYMENT_TIMEOUT_MS = 30 * 60 * 1000

export function usePaymentFlow(invoice: Invoice, schoolId: string) {
  const settings = useSettings()
  const [state, dispatch] = useReducer(paymentFlowReducer, initialState)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-timeout when stuck in 'redirecting' state (user abandoned gateway page)
  useEffect(() => {
    if (state.status === 'redirecting') {
      timeoutRef.current = setTimeout(() => {
        dispatch({ type: 'ERROR', error: 'Payment session expired. Please try again.' })
      }, PAYMENT_TIMEOUT_MS)
    } else if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [state.status])

  const start = useCallback(() => {
    dispatch({ type: 'START' })
  }, [])

  const selectGateway = useCallback((gateway: PaymentGateway) => {
    dispatch({ type: 'SELECT_GATEWAY', gateway })
  }, [])

  const goBackToGatewaySelection = useCallback(() => {
    dispatch({ type: 'START' })
  }, [])

  /**
   * Initiate payment and redirect to gateway.
   * The backend returns a redirect URL — we set window.location.href.
   */
  const confirmAndPay = useCallback(async () => {
    if (!state.gateway) return

    dispatch({ type: 'INITIATE_START' })

    try {
      const response = await initiatePayment(schoolId, {
        invoiceId: invoice.id,
        gateway: state.gateway,
        amount: invoice.amountDue,
        currency: settings.currency,
        returnUrl: `${window.location.origin}/payments/callback`,
        cancelUrl: `${window.location.origin}/parent-portal/fees`,
      })

      dispatch({ type: 'INITIATE_SUCCESS', sessionId: response.paymentSessionId })

      // Handle gateway redirect — open in new tab to keep app on current page
      if (response.method === 'form_post' && response.formData) {
        // eSewa requires hidden form POST — create and auto-submit in new tab
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = response.redirectUrl
        form.target = '_blank'
        form.style.display = 'none'

        for (const [key, value] of Object.entries(response.formData as Record<string, string>)) {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = value
          form.appendChild(input)
        }

        document.body.appendChild(form)
        form.submit()
        setTimeout(() => { form.remove() }, 100)
      } else {
        // Khalti and others — open in new tab
        window.open(response.redirectUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Failed to initiate payment'
      // Sanitize: strip HTML tags and truncate to prevent XSS via error display
      const message = raw.replace(/<[^>]*>/g, '').substring(0, 200)
      dispatch({ type: 'ERROR', error: message })
    }
  }, [state.gateway, schoolId, invoice.id, invoice.amountDue])

  /**
   * Verify payment on callback page.
   * Called with session ID from URL params after gateway redirect.
   */
  const verifyOnReturn = useCallback((sessionId: string) => {
    dispatch({ type: 'VERIFY_START', sessionId })
  }, [])

  const markVerified = useCallback((receipt: Receipt) => {
    dispatch({ type: 'VERIFY_SUCCESS', receipt })
  }, [])

  const markFailed = useCallback((error: string) => {
    dispatch({ type: 'VERIFY_FAILED', error })
  }, [])

  const markCancelled = useCallback(() => {
    dispatch({ type: 'CANCELLED' })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  return {
    state,
    start,
    selectGateway,
    goBackToGatewaySelection,
    confirmAndPay,
    verifyOnReturn,
    markVerified,
    markFailed,
    markCancelled,
    reset,
  }
}
