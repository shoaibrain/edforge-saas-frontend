/**
 * GatewayConfigCard
 *
 * Admin card for configuring a single payment gateway.
 * Credentials are masked after save — server returns `****`.
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { PaymentGateway, PaymentGatewayConfig } from '@edforge/types'
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

const GATEWAY_LABELS: Record<string, string> = {
  esewa: 'eSewa',
  khalti: 'Khalti',
  fonepay: 'Fonepay',
  connectips: 'ConnectIPS',
  stripe: 'Stripe',
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
}

const GATEWAY_DESCRIPTIONS: Record<string, string> = {
  esewa: 'Nepal\'s leading digital wallet for online payments',
  khalti: 'Digital wallet and payment gateway for Nepal',
  fonepay: 'QR-based interbank payment network',
  connectips: 'Internet banking payment system by NCHL',
  stripe: 'Global payment processing for cards and wallets',
  cash: 'Manual cash payments',
  bank_transfer: 'Direct bank transfer payments',
  cheque: 'Payment by cheque',
}

// Credential fields per gateway (what the admin needs to enter)
const GATEWAY_CREDENTIAL_FIELDS: Record<PaymentGateway, Array<{ key: string; label: string; sensitive: boolean }>> = {
  esewa: [
    { key: 'merchantCode', label: 'Merchant Code', sensitive: false },
    { key: 'secretKey', label: 'Secret Key', sensitive: true },
  ],
  khalti: [
    { key: 'publicKey', label: 'Public Key', sensitive: false },
    { key: 'secretKey', label: 'Secret Key', sensitive: true },
  ],
  fonepay: [
    { key: 'merchantCode', label: 'Merchant Code', sensitive: false },
    { key: 'secretKey', label: 'Secret Key', sensitive: true },
  ],
  connectips: [
    { key: 'merchantCode', label: 'Merchant Code', sensitive: false },
    { key: 'apiKey', label: 'API Key', sensitive: true },
    { key: 'secretKey', label: 'Secret Key', sensitive: true },
  ],
  stripe: [
    { key: 'publicKey', label: 'Public Key', sensitive: false },
    { key: 'secretKey', label: 'Secret Key', sensitive: true },
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

  return (
    <div className="border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => credFields.length > 0 && setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
      >
        <div className={`p-2 rounded-lg ${isEnabled ? 'bg-teal-100 dark:bg-teal-500/20' : 'bg-[rgb(var(--bg-tertiary))]'}`}>
          <Icon className={`w-5 h-5 ${isEnabled ? 'text-teal-700 dark:text-teal-400' : 'text-[rgb(var(--text-tertiary))]'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
            {GATEWAY_LABELS[gateway] ?? gateway}
          </p>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            {GATEWAY_DESCRIPTIONS[gateway] ?? ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEnabled && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400">
              <CheckCircle2 className="w-3 h-3" />
              {isTestMode ? 'Test Mode' : 'Production'}
            </span>
          )}
          {credFields.length > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              isConfigured
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400'
            }`}>
              {isConfigured ? 'Configured' : 'Not Configured'}
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
                className="w-4 h-4 rounded border-[rgb(var(--border-primary))] text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-[rgb(var(--text-primary))]">Enable</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isTestMode')}
                className="w-4 h-4 rounded border-[rgb(var(--border-primary))] text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-[rgb(var(--text-primary))]">Test Mode</span>
            </label>
          </div>

          {/* Credential fields */}
          {credFields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                {field.label}
              </label>
              <div className="relative">
                <input
                  {...register(field.key)}
                  type={field.sensitive && !showSecrets[field.key] ? 'password' : 'text'}
                  autoComplete="off"
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-[rgb(var(--border-primary))]
                    bg-[rgb(var(--bg-primary))] text-sm text-[rgb(var(--text-primary))]
                    focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
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
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/5">
            <Shield className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Credentials are encrypted and stored securely. After saving, values will be masked.
            </p>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
