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
            <div key={i} className="h-12 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
          ))}
        </div>
      </ContentSection>
    )
  }

  if (!payments || payments.length === 0) {
    return (
      <ContentSection heading={t('fees.paymentHistory')} staggerIndex={staggerIndex}>
        <p className="text-sm py-4" style={{ color: 'var(--v2-text-muted)' }}>
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
          background: 'var(--v2-bg-surface)',
          borderColor: 'var(--v2-border-default)',
        }}
      >
        {sorted.map((payment, i) => (
          <div key={payment.id}>
            {i > 0 && <DashedDivider className="mx-4 my-0" />}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Date */}
              <span
                className="text-[11px] font-mono tabular-nums w-24 shrink-0"
                style={{ color: 'var(--v2-text-muted)' }}
              >
                {formatDate(payment.date)}
              </span>

              {/* Description */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[12px] truncate"
                  style={{ color: 'var(--v2-text-secondary)' }}
                >
                  {payment.description}
                </p>
                {payment.method && (
                  <p
                    className="text-[10px]"
                    style={{ color: 'var(--v2-text-hint)' }}
                  >
                    via {payment.method}
                  </p>
                )}
              </div>

              {/* Amount */}
              <span
                className="text-[12px] font-semibold font-mono tabular-nums shrink-0"
                style={{ color: 'var(--v2-brand-primary)' }}
              >
                {formatCurrency(payment.amount)}
              </span>

              {/* Receipt link */}
              {payment.paymentId && (
                <a
                  href={`/payments/${payment.paymentId}/receipt`}
                  className="text-[10px] font-medium shrink-0"
                  style={{ color: 'var(--v2-info)' }}
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
