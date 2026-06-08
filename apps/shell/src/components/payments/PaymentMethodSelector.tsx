/**
 * PaymentMethodSelector
 *
 * Displays available payment gateways as selectable cards.
 * Only shows gateways enabled for the school.
 * Accessible: keyboard navigable, aria-labels.
 */

import type { PaymentGateway, PaymentGatewayPublicConfig } from '@edforge/types'
import { useTranslation } from '@edforge/i18n'
import { CheckCircle2, Wallet, CreditCard, Landmark, Building2, Banknote, QrCode } from 'lucide-react'

// Gateway → icon mapping
const GATEWAY_ICONS: Record<PaymentGateway, React.ComponentType<{ className?: string }>> = {
  esewa: Wallet,
  khalti: Wallet,
  fonepay: QrCode,
  connectips: Building2,
  stripe: CreditCard,
  cash: Banknote,
  bank_transfer: Landmark,
  cheque: Landmark,
}

// Gateway → i18n description key mapping
const GATEWAY_I18N_KEY: Record<PaymentGateway, string> = {
  esewa: 'esewa',
  khalti: 'khalti',
  fonepay: 'fonepay',
  connectips: 'connectips',
  stripe: 'stripe',
  cash: 'cash',
  bank_transfer: 'bankTransfer',
  cheque: 'cheque',
}

interface PaymentMethodSelectorProps {
  gateways: PaymentGatewayPublicConfig[]
  selected: PaymentGateway | null
  onSelect: (gateway: PaymentGateway) => void
}

export function PaymentMethodSelector({
  gateways,
  selected,
  onSelect,
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation('payments')

  if (gateways.length === 0) {
    return (
      <div className="text-center py-8 text-[rgb(var(--text-tertiary))]">
        <Wallet className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>{t('gateway.selectMethod')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
          {t('gateway.selectMethod')}
        </h3>
        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
          {t('gateway.selectMethodDescription')}
        </p>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        role="radiogroup"
        aria-label={t('gateway.selectMethod')}
      >
        {gateways
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((gw) => {
            const isSelected = selected === gw.gateway
            const Icon = GATEWAY_ICONS[gw.gateway] ?? Wallet
            const i18nKey = GATEWAY_I18N_KEY[gw.gateway]

            return (
              <button
                key={gw.gateway}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(gw.gateway)}
                className={`
                  relative flex items-start gap-3 p-4 rounded-xl border-2
                  text-left transition-all duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--border-focus))] focus-visible:ring-offset-2
                  ${
                    isSelected
                      ? 'border-[rgb(var(--border-focus))] bg-[rgb(var(--state-info-bg)/0.18)]  shadow-sm'
                      : 'border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-secondary))] hover:bg-[rgb(var(--bg-tertiary))]'
                  }
                `}
              >
                <div
                  className={`p-2 rounded-lg ${
                    isSelected
                      ? 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]  '
                      : 'bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text-secondary))]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    {gw.displayName || t(`gateway.${i18nKey}`)}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                    {t(`gateway.${i18nKey}Description`)}
                  </p>
                  {gw.isTestMode && (
                    <span className="inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                      {t('gateway.testMode')}
                    </span>
                  )}
                </div>

                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-[rgb(var(--action-secondary-fg))]  shrink-0 mt-0.5" />
                )}
              </button>
            )
          })}
      </div>
    </div>
  )
}
