/**
 * Payment Receipt Page
 *
 * Route: /payments/:paymentId/receipt
 * Displays the full receipt for a completed payment.
 */

import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
import { Loader2, AlertTriangle } from 'lucide-react'
import { usePaymentReceipt } from '../../hooks/usePayments'
import { useActiveSchool } from '../../lib/shell-context'
import { PaymentReceipt } from '../../components/payments/PaymentReceipt'

interface ReceiptPageProps {
  paymentId: string
}

export default function ReceiptPage({ paymentId }: ReceiptPageProps) {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()
  // M1.5-FU.1 — the backend's GET /payments/:id/receipt requires a
  // `?schoolId=` query param to construct the DDB key
  // `PAYMENT#{schoolId}#{paymentId}`. Without it, the lookup builds
  // `PAYMENT#undefined#<id>` and 404s on every fetch. M1.5-FU.2+ will
  // move this page into Finance MFE where the school context is
  // structural; this hotpatch keeps it working in shell in the meantime.
  const { activeSchoolId } = useActiveSchool()

  const { data: receipt, isLoading, isPending, error } = usePaymentReceipt(
    paymentId,
    activeSchoolId,
  )

  // `isLoading` is only true while a fetch is in-flight. The query
  // stays `enabled: false` until activeSchoolId resolves from shell
  // context (rare cold-mount path), in which case TanStack Query v5
  // reports `isLoading: false` + `isPending: true` + `error: undefined`
  // + `data: undefined`. Without the `isPending` branch below, the
  // user would see the "Failed to load" UI for that pre-resolution
  // window even though nothing has failed.
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
          onClick={() => navigate({ to: '/parent-portal/fees' })}
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
        onBack={() => navigate({ to: '/parent-portal/fees' })}
      />
    </div>
  )
}
