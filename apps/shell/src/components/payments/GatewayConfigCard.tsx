/**
 * GatewayConfigCard
 *
 * Admin card for configuring a single payment gateway.
 * Credentials are masked after save — server returns `****`.
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { PaymentGateway, PaymentGatewayConfig } from '@edforge/types'
import { useTranslation } from '@edforge/i18n'
import { Button } from '@edforge/ui'
import {
  Wallet, CreditCard, Landmark, Building2, QrCode, Banknote,
  Eye, EyeOff, Shield, CheckCircle2,
} from 'lucide-react'

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

// Credential fields per gateway (what the admin needs to enter)
const GATEWAY_CREDENTIAL_FIELDS: Record<PaymentGateway, Array<{ key: string; labelKey: string; sensitive: boolean }>> = {
  esewa: [
    { key: 'merchantCode', labelKey: 'merchantCode', sensitive: false },
    { key: 'secretKey', labelKey: 'secretKey', sensitive: true },
  ],
  khalti: [
    { key: 'publicKey', labelKey: 'publicKey', sensitive: false },
    { key: 'secretKey', labelKey: 'secretKey', sensitive: true },
  ],
  fonepay: [
    { key: 'merchantCode', labelKey: 'merchantCode', sensitive: false },
    { key: 'secretKey', labelKey: 'secretKey', sensitive: true },
  ],
  connectips: [
    { key: 'merchantCode', labelKey: 'merchantCode', sensitive: false },
    { key: 'apiKey', labelKey: 'apiKey', sensitive: true },
    { key: 'secretKey', labelKey: 'secretKey', sensitive: true },
  ],
  stripe: [
    { key: 'publicKey', labelKey: 'publicKey', sensitive: false },
    { key: 'secretKey', labelKey: 'secretKey', sensitive: true },
  ],
  cash: [],
  bank_transfer: [],
  cheque: [],
}

interface GatewayConfigCardProps {
  gateway: PaymentGateway
  config?: PaymentGatewayConfig | null
  onSave: (gateway: PaymentGateway, data: { isEnabled: boolean; isTestMode: boolean; credentials: Record<string, string> }) => void
  isSaving?: boolean
}

export function GatewayConfigCard({ gateway, config, onSave, isSaving }: GatewayConfigCardProps) {
  const { t } = useTranslation('payments')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const Icon = GATEWAY_ICONS[gateway]
  const credFields = GATEWAY_CREDENTIAL_FIELDS[gateway]
  const isEnabled = config?.isEnabled ?? false
  const isTestMode = config?.isTestMode ?? true
  const isConfigured = config && credFields.length > 0

  const { register, handleSubmit } = useForm<Record<string, string | boolean>>({
    defaultValues: {
      isEnabled: isEnabled,
      isTestMode: isTestMode,
      ...credFields.reduce(
        (acc, f) => ({ ...acc, [f.key]: config?.credentials?.[f.key] ?? '' }),
        {} as Record<string, string>
      ),
    },
  })

  const onSubmit = handleSubmit((data) => {
    const credentials: Record<string, string> = {}
    const formData = data as Record<string, unknown>
    for (const field of credFields) {
      if (formData[field.key]) {
        credentials[field.key] = String(formData[field.key])
      }
    }
    onSave(gateway, {
      isEnabled: !!data.isEnabled,
      isTestMode: !!data.isTestMode,
      credentials,
    })
  })

  const GATEWAY_I18N: Record<string, string> = {
    esewa: 'esewa', khalti: 'khalti', fonepay: 'fonepay',
    connectips: 'connectips', stripe: 'stripe', cash: 'cash',
    bank_transfer: 'bankTransfer', cheque: 'cheque',
  }
  const i18nKey = GATEWAY_I18N[gateway] ?? gateway

  return (
    <div className="border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => credFields.length > 0 && setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 text-start hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
      >
        <div className={`p-2 rounded-lg ${isEnabled ? 'bg-[rgb(var(--state-info-bg)/0.18)] ' : 'bg-[rgb(var(--bg-tertiary))]'}`}>
          <Icon className={`w-5 h-5 ${isEnabled ? 'text-[rgb(var(--state-info-fg))] ' : 'text-[rgb(var(--text-tertiary))]'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
            {t(`gateway.${i18nKey}`)}
          </p>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            {t(`gateway.${i18nKey}Description`)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEnabled && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]  ">
              <CheckCircle2 className="w-3 h-3" />
              {isTestMode ? t('gateway.testMode') : t('gateway.productionMode')}
            </span>
          )}
          {credFields.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isConfigured
                ? 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))]  '
                : 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]  '
            }`}>
              {isConfigured ? t('gateway.configured') : t('gateway.notConfigured')}
            </span>
          )}
        </div>
      </button>

      {/* Expanded configuration */}
      {isExpanded && credFields.length > 0 && (
        <form onSubmit={onSubmit} className="px-4 pb-4 pt-2 border-t border-[rgb(var(--border-primary))] space-y-4">
          {/* Enable/Test toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isEnabled')}
                className="w-4 h-4 rounded border-[rgb(var(--border-primary))] text-[rgb(var(--action-secondary-fg))] focus:ring-[rgb(var(--border-focus))]"
              />
              <span className="text-sm text-[rgb(var(--text-primary))]">{t('gatewayConfig.enable')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isTestMode')}
                className="w-4 h-4 rounded border-[rgb(var(--border-primary))] text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-[rgb(var(--text-primary))]">{t('gateway.testMode')}</span>
            </label>
          </div>

          {/* Credential fields */}
          {credFields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                {t(`gatewayConfig.${field.labelKey}`)}
              </label>
              <div className="relative">
                <input
                  {...register(field.key)}
                  type={field.sensitive && !showSecrets[field.key] ? 'password' : 'text'}
                  autoComplete="off"
                  className="w-full px-3 py-2 pe-10 rounded-lg border border-[rgb(var(--border-primary))]
                    bg-[rgb(var(--bg-primary))] text-sm text-[rgb(var(--text-primary))]
                    focus:outline-none focus:border-[rgb(var(--border-focus))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]/20"
                  placeholder={field.sensitive ? '••••••••' : ''}
                />
                {field.sensitive && (
                  <button
                    type="button"
                    onClick={() => setShowSecrets((s) => ({ ...s, [field.key]: !s[field.key] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[rgb(var(--text-tertiary))]"
                  >
                    {showSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Security note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)] dark:bg-[rgb(var(--state-info-bg)/0.18)]0/5">
            <Shield className="w-4 h-4 text-[rgb(var(--state-info-fg))] mt-0.5 shrink-0" />
            <p className="text-xs text-[rgb(var(--state-info-fg))] ">
              {t('gatewayConfig.credentialsMasked')}
            </p>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('actions.saving') : t('gatewayConfig.saveConfig')}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
