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
import { PaymentReceipt } from '../../components/payments/PaymentReceipt'

interface ReceiptPageProps {
  paymentId: string
}

export default function ReceiptPage({ paymentId }: ReceiptPageProps) {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()

  const { data: receipt, isLoading, error } = usePaymentReceipt(paymentId)

  if (isLoading) {
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
