/**
 * Payment Gateways Configuration Page
 *
 * Admin page for configuring payment gateways (eSewa, Khalti, etc).
 * Route: /finance/configuration/payment-gateways
 *
 * Security: Credentials are stored server-side only.
 * The API returns masked values for credential fields.
 */

import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { PaymentGateway } from '@edforge/types'
import { Loader2 } from 'lucide-react'
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

  const { data: configs, isLoading } = useGatewayConfigs(schoolId ?? '')
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

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            Payment Gateways
          </h1>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            Configure which payment gateways are available for your school.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
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
      </motion.div>
    </div>
  )
}
