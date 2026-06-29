/**
 * Payment Gateways Configuration Page
 *
 * Admin page for configuring payment gateways (eSewa, Khalti, etc).
 * Route: /finance/configuration/payment-gateways
 *
 * Security: Credentials are stored server-side only.
 * The API returns masked values for credential fields.
 */

import { toast } from 'sonner'
import type { PaymentGateway } from '@edforge/types'
import { Loader2, AlertTriangle } from 'lucide-react'
import { ContextBar } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { useAppStore } from '../../stores/app.store'
import { useGatewayConfigs, useSaveGatewayConfig } from '@edforge/finance-services'
import { GatewayConfigCard } from '../../components/configuration/GatewayConfigCard'
import { useFinanceSettings } from '../../layouts/FinanceLayout'
import { formatDate } from '../../utils/format-date'

// Gateways to show in the admin UI (in display order)
const GATEWAYS: PaymentGateway[] = [
  'esewa',
  'khalti',
  'fonepay',
  'connectips',
  'stripe',
]

export default function PaymentGatewaysPage() {
  const { t } = useTranslation('payments')
  const settings = useFinanceSettings()
  const schoolId = useAppStore((s) => s.activeSchoolId)

  const { data: configs, isLoading, isError } = useGatewayConfigs(schoolId ?? '')
  const saveMutation = useSaveGatewayConfig(schoolId ?? '')

  const handleSave = async (
    gateway: PaymentGateway,
    data: { isEnabled: boolean; isTestMode: boolean; credentials: Record<string, string> }
  ) => {
    try {
      await saveMutation.mutateAsync({
        gateway,
        config: {
          isEnabled: data.isEnabled,
          isTestMode: data.isTestMode,
          credentials: data.credentials,
        },
      })
      toast.success(t('paymentGateways.saved'))
    } catch {
      toast.error(t('paymentGateways.saveFailed'))
    }
  }

  if (!schoolId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 text-center text-[rgb(var(--text-tertiary))]">
        {t('paymentGateways.selectSchool')}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="space-y-6">
        <h1 className="sr-only">{t('paymentGateways.title')}</h1>
        <ContextBar
          meta={
            <span>
              {formatDate(new Date().toISOString(), settings)}
            </span>
          }
          description={
            <span>{t('paymentGateways.description')}</span>
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[rgb(var(--action-secondary-fg))] animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--state-danger-fg))] opacity-60" />
            <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{t('paymentGateways.loadFailed')}</p>
            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
              {t('error.tryAgain')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {GATEWAYS.map((gateway) => (
              <GatewayConfigCard
                key={gateway}
                gateway={gateway}
                config={configs?.find((c) => c.gateway === gateway) ?? null}
                onSave={handleSave}
                isSaving={saveMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
