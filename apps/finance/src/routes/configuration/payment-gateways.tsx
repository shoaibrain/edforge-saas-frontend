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
import { Loader2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { ContextBar } from '@edforge/ui'
import { usePermission } from '@edforge/abac'
import { useAppStore } from '../../stores/app.store'
import { useGatewayConfigs, useSaveGatewayConfig } from '@edforge/finance-services'
import { GatewayConfigCard } from '../../components/configuration/GatewayConfigCard'

// Gateways to show in the admin UI (in display order)
const GATEWAYS: PaymentGateway[] = [
  'esewa',
  'khalti',
  'fonepay',
  'connectips',
  'stripe',
]

export default function PaymentGatewaysPage() {
  const schoolId = useAppStore((s) => s.activeSchoolId)

  // Saving/editing gateway credentials maps to the backend `billing:manage`
  // ABAC action. The API 403s users without it; hiding the editable cards
  // keeps the UI honest.
  const canManageBilling = usePermission('manage', 'billing')

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
      toast.success('Gateway configuration saved')
    } catch {
      toast.error('Failed to save gateway configuration')
    }
  }

  if (!schoolId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 text-center text-[rgb(var(--text-tertiary))]">
        Select a school to manage payment gateways.
      </div>
    )
  }

  if (!canManageBilling) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex flex-col items-center text-center gap-3 rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] p-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[rgb(var(--state-warning-bg)/0.18)]">
            <ShieldAlert className="w-6 h-6 text-[rgb(var(--state-warning-fg))]" />
          </div>
          <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
            You don&apos;t have access to payment gateway settings
          </h2>
          <p className="text-sm text-[rgb(var(--text-secondary))] max-w-sm">
            Configuring payment gateway credentials is managed by your principal
            or school admin.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="space-y-6">
        <h1 className="sr-only">Payment Gateways</h1>
        <ContextBar
          meta={
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          }
          description={
            <span>Configure which payment gateways are available for your school.</span>
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[rgb(var(--action-secondary-fg))] animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--state-danger-fg))] opacity-60" />
            <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Failed to load gateway configurations</p>
            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
              Please check your connection and try again.
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
