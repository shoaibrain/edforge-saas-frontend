/**
 * PaymentHistory — Chronological list of completed payments
 *
 * Derives from useStudentLedger which returns the transaction ledger
 * for a student's finance account.
 */

import { useTranslation } from '@edforge/i18n'
import { ContentSection, DashedDivider } from '@edforge/ui'

export interface PaymentHistoryEntry {
  id: string
  date: string
  description: string
  amount: number
  method?: string
  paymentId?: string
}

export interface PaymentHistoryProps {
  payments?: PaymentHistoryEntry[]
  loading?: boolean
  formatCurrency: (amount: number) => string
  staggerIndex?: number
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function PaymentHistory({
  payments,
  loading,
  formatCurrency,
  staggerIndex = 4,
}: PaymentHistoryProps) {
  const { t } = useTranslation('portal')

  if (loading) {
    return (
      <ContentSection heading={t('fees.paymentHistory')} staggerIndex={staggerIndex}>
        <div className="space-y-2 mt-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded v2-skeleton-pulse" style={{ background: 'rgb(var(--background-tertiary))' }} />
          ))}
        </div>
      </ContentSection>
    )
  }

  if (!payments || payments.length === 0) {
    return (
      <ContentSection heading={t('fees.paymentHistory')} staggerIndex={staggerIndex}>
        <p className="text-sm py-4" style={{ color: 'rgb(var(--text-tertiary))' }}>
          {t('fees.noPayments')}
        </p>
      </ContentSection>
    )
  }

  const sorted = [...payments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <ContentSection heading={t('fees.paymentHistory')} staggerIndex={staggerIndex}>
      <div
        className="rounded-xl border mt-3 overflow-hidden"
        style={{
          background: 'rgb(var(--background-secondary))',
          borderColor: 'rgb(var(--border-primary) / 0.35)',
        }}
      >
        {sorted.map((payment, i) => (
          <div key={payment.id}>
            {i > 0 && <DashedDivider className="mx-4 my-0" />}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Date */}
              <span
                className="text-xs font-mono tabular-nums w-24 shrink-0"
                style={{ color: 'rgb(var(--text-tertiary))' }}
              >
                {formatDate(payment.date)}
              </span>

              {/* Description */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs truncate"
                  style={{ color: 'rgb(var(--text-secondary))' }}
                >
                  {payment.description}
                </p>
                {payment.method && (
                  <p
                    className="text-xs"
                    style={{ color: 'rgb(var(--text-tertiary))' }}
                  >
                    via {payment.method}
                  </p>
                )}
              </div>

              {/* Amount */}
              <span
                className="text-xs font-semibold font-mono tabular-nums shrink-0"
                style={{ color: '#1D9E75' }}
              >
                {formatCurrency(payment.amount)}
              </span>

              {/* Receipt link */}
              {payment.paymentId && (
                <a
                  href={`/payments/${payment.paymentId}/receipt`}
                  className="text-xs font-medium shrink-0"
                  style={{ color: 'rgb(var(--state-info-fg))' }}
                >
                  {t('fees.receipt')}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </ContentSection>
  )
}
