/**
 * Finance Receipt Page (M1.5-FU.2)
 *
 * Route: /finance/payments/:paymentId/receipt
 * (resolves through Finance MFE's `basepath: '/finance'` from the
 * router-local path `/payments/$paymentId/receipt`)
 *
 * Admin-facing receipt detail page. Loads the JSON receipt via
 * `usePaymentReceipt(paymentId, schoolId)` (M1.5-FU.1) and renders
 * the finance copy of `PaymentReceipt`. The eye-icon on
 * `apps/finance/src/routes/billing/payments/index.tsx` navigates
 * here in-MFE (no more cross-MFE full-page reload).
 *
 * `onBack` and the error-state "Return" button route to
 * `/payments` (Finance's payments list) — NOT to
 * `/parent-portal/fees` which was the original parent-flow
 * destination on the shell version of this page.
 */

import { useNavigate, useParams } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
import { usePaymentReceipt } from '@edforge/finance-services'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useAppStore } from '../../../stores/app.store'
import { PaymentReceipt } from '../../../components/billing/PaymentReceipt'

export default function FinanceReceiptPage() {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()
  const { paymentId } = useParams({ strict: false }) as { paymentId: string }
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  const { data: receipt, isLoading, isPending, error } = usePaymentReceipt(
    paymentId,
    activeSchoolId,
  )

  // Loading covers BOTH in-flight fetch AND the idle pre-resolution
  // window when activeSchoolId hasn't hydrated yet (same pattern as
  // the M1.5-FU.1 CodeRabbit fix on the shell receipt page).
  if (isLoading || isPending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-400" />
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
          {t('error.failedToLoad')}
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: '/payments' as string })}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors"
        >
          {t('flow.returnToInvoices')}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <PaymentReceipt
        receipt={receipt}
        onBack={() => navigate({ to: '/payments' as string })}
      />
    </div>
  )
}
