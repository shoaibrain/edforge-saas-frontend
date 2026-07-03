/**
 * Finance Receipt Page (M1.5-FU.2)
 *
 * Route: /finance/payments/:paymentId/receipt
 * (resolves through Finance MFE's `basepath: '/finance'` from the
 * router-local path `/payments/$paymentId/receipt`)
 *
 * Loads the JSON receipt via `usePaymentReceipt(paymentId, schoolId)` and
 * renders the paper-document `PaymentReceipt`. When the route search
 * carries `invoiceId` (links from the invoice detail page + Record
 * Payment drawer), the back affordance targets the originating invoice;
 * otherwise it falls back to the payments list.
 */

import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
import { usePaymentReceipt } from '@edforge/finance-services'
import { Skeleton } from '@edforge/ui'
import { AlertTriangle } from 'lucide-react'
import { useAppStore } from '../../../stores/app.store'
import { PaymentReceipt } from '../../../components/billing/PaymentReceipt'

export default function FinanceReceiptPage() {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()
  const { paymentId } = useParams({ strict: false }) as { paymentId: string }
  const { invoiceId } = useSearch({ strict: false }) as { invoiceId?: string }
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)

  const { data: receipt, isLoading, isPending, error, refetch } = usePaymentReceipt(
    paymentId,
    activeSchoolId,
  )

  const goBack = () =>
    invoiceId
      ? navigate({ to: '/invoices/$invoiceId', params: { invoiceId } })
      : navigate({ to: '/payments' })

  // Loading covers BOTH in-flight fetch AND the idle pre-resolution
  // window when activeSchoolId hasn't hydrated yet (same pattern as
  // the M1.5-FU.1 CodeRabbit fix on the shell receipt page).
  if (isLoading || isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6" aria-busy="true">
        <div className="mb-5 flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-56" />
        </div>
        <Skeleton className="mx-auto h-96 w-full max-w-2xl rounded-xl" />
      </div>
    )
  }

  if (error || !receipt) {
    // M1.5-FU.7.3 — differentiate by HTTP status so operators can
    // self-diagnose without re-reading the receipt list. The backend
    // returns descriptive 400 / 403 / 404 separately:
    //   400 — payment exists but status !== 'completed' (refunded /
    //         voided / failed / pending). Receipts are issued only on
    //         completion. (Sprint M1.5-FU.7.2 already gates the View
    //         + Download row buttons on `status === 'completed'`, so
    //         this branch fires only on deep-link or stale-tab access.)
    //   403 — caller lacks billing:view on this school
    //   404 — payment id does not exist on this school
    //   else (incl. 5xx + network) — generic `failedToLoad`
    // axios-shape errors carry `response.status`; the runtime guard
    // tolerates either shape (or none) without TS pain.
    const status =
      (error as { response?: { status?: number } } | undefined)?.response?.status
    const messageKey =
      status === 400
        ? 'error.receiptNotAvailable'
        : status === 403
          ? 'error.receiptForbidden'
          : status === 404
            ? 'error.receiptNotFound'
            : 'error.failedToLoad'
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--state-danger-fg))]" />
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
          {t(messageKey)}
        </p>
        <p className="mt-2 font-mono text-xs text-[rgb(var(--text-tertiary))]">{paymentId}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => navigate({ to: '/payments' })}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-tertiary))] transition-colors"
          >
            {t('flow.returnToPayments')}
          </button>
          <button
            type="button"
            onClick={() => void refetch()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
          >
            {t('actions.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <PaymentReceipt receipt={receipt} onBack={goBack} invoiceId={invoiceId} />
    </div>
  )
}
