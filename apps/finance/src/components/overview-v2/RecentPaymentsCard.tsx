/**
 * RecentPaymentsCard — V2
 *
 * Feed list of the most recent 5 payments with gateway icons and amounts.
 */

import { Banknote, FileText, Building2, Smartphone, CreditCard, type LucideIcon } from 'lucide-react'
import { formatGatewayLabel, formatRelativeDate } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { EntityIdDisplay } from '@edforge/archetype'
import { useFinanceSettings } from '../../layouts/FinanceLayout'

const GATEWAY_ICONS: Record<string, LucideIcon> = {
  cash: Banknote,
  cheque: FileText,
  bank_transfer: Building2,
  esewa: Smartphone,
  khalti: Smartphone,
  fonepay: Smartphone,
  connectips: Smartphone,
  stripe: CreditCard,
}

const GATEWAY_ICON_COLORS: Record<string, string> = {
  cash: '#1D9E75',
  cheque: '#7F77DD',
  bank_transfer: '#378ADD',
  esewa: '#60C06E',
  khalti: '#5C2D91',
  fonepay: '#2196F3',
  connectips: '#00BCD4',
  stripe: '#6772E5',
}

interface RecentPayment {
  id: string
  amount: number
  gateway: string
  status: string
  receiptNumber?: string
  paidAt?: string
  createdAt: string
}

interface RecentPaymentsCardProps {
  payments: RecentPayment[]
  isLoading: boolean
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-24 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
            <div className="h-2.5 w-16 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
          </div>
          <div className="h-3 w-16 rounded v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
        </div>
      ))}
    </div>
  )
}

export function RecentPaymentsCard({ payments, isLoading }: RecentPaymentsCardProps) {
  const settings = useFinanceSettings()
  const { format } = useCurrency(settings)
  const top5 = payments.slice(0, 5)

  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        padding: 18,
      }}
    >
      <h3 className="text-[13px] font-medium mb-3" style={{ color: 'var(--v2-text-secondary)' }}>
        Recent payments
      </h3>

      {isLoading ? (
        <FeedSkeleton />
      ) : top5.length === 0 ? (
        <p className="text-[11px] py-4" style={{ color: 'var(--v2-text-hint)' }}>No payments yet.</p>
      ) : (
        <div className="space-y-1">
          {top5.map((payment) => {
            const color = GATEWAY_ICON_COLORS[payment.gateway] || '#888780'
            const dateStr = payment.paidAt || payment.createdAt
            return (
              <div
                key={payment.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
                style={{ cursor: 'default' }}
              >
                {/* Gateway icon */}
                {(() => {
                  const Icon = GATEWAY_ICONS[payment.gateway]
                  return (
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}18`, color }}
                    >
                      {Icon ? <Icon className="w-3.5 h-3.5" /> : (
                        <span className="text-[10px] font-bold">
                          {formatGatewayLabel(payment.gateway).slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )
                })()}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium truncate" style={{ color: 'var(--v2-text-secondary)' }}>
                    <EntityIdDisplay entity="payment" data={payment} variant="inline" />
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--v2-text-faint)' }}>
                    {formatGatewayLabel(payment.gateway)} · {formatRelativeDate(dateStr)}
                  </div>
                </div>

                {/* Amount */}
                <span
                  className="text-[11px] font-semibold flex-shrink-0"
                  style={{ color: 'var(--v2-brand-primary)' }}
                >
                  {format(payment.amount, { decimals: 0 })}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
