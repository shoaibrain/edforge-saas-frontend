/**
 * Step 2: Workspace Confirm — Display auto-configured settings and require confirmation.
 * NOT skippable.
 */

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useShell } from '../../../lib/shell-context'
import { tenantService } from '../../../services/tenant.service'
import type { OnboardingStepProps } from '../onboarding.types'

const CALENDAR_LABELS: Record<string, string> = {
  gregorian: 'Gregorian',
  bikram_sambat: 'Bikram Sambat',
}

const NUMBER_FORMAT_LABELS: Record<string, string> = {
  international: 'International (1,000,000)',
  south_asian: 'South Asian (10,00,000)',
}

const COUNTRY_LABELS: Record<string, string> = {
  NPL: 'Nepal',
  IND: 'India',
  USA: 'United States',
  GBR: 'United Kingdom',
}

function SettingRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[rgb(var(--border-primary))] last:border-0">
      <span className="text-lg w-7 text-center">{icon}</span>
      <div className="flex-1">
        <span className="text-xs text-[rgb(var(--text-tertiary))]">{label}</span>
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{value}</p>
      </div>
    </div>
  )
}

export function WorkspaceConfirmStep({ onNext, onBack }: OnboardingStepProps) {
  const { user, workspaceSettings, tenant } = useShell()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tenantId = user?.tenantId ?? ''
  const country = (tenant as any)?.country || (tenant as any)?.address?.country || ''
  const countryLabel = COUNTRY_LABELS[country] || ''

  const currency = workspaceSettings?.defaultCurrency || 'USD'
  const calendar = CALENDAR_LABELS[workspaceSettings?.defaultCalendarSystem || 'gregorian'] || 'Gregorian'
  const timezone = workspaceSettings?.defaultTimezone || 'UTC'
  const numberFormat = NUMBER_FORMAT_LABELS[workspaceSettings?.defaultNumberFormat || 'international'] || 'International'

  const handleConfirm = async () => {
    setConfirming(true)
    setError(null)
    try {
      await tenantService.confirmWorkspaceSettings(tenantId)
      await queryClient.invalidateQueries({ queryKey: ['workspaceSettings', tenantId] })
      onNext()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm settings')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="bg-[rgb(var(--surface-secondary))] rounded-2xl p-9 border border-[rgb(var(--border-primary))]">
      <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-1">Workspace Settings</h2>
      <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">
        We've auto-configured your workspace based on your region. Confirm to continue.
      </p>

      {countryLabel && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Configured for {countryLabel}
          </span>
        </div>
      )}

      <div className="mb-6">
        <SettingRow icon="💱" label="Currency" value={currency} />
        <SettingRow icon="📅" label="Calendar System" value={calendar} />
        <SettingRow icon="🕐" label="Timezone" value={timezone} />
        <SettingRow icon="#" label="Number Format" value={numberFormat} />
      </div>

      <p className="text-xs text-[rgb(var(--text-tertiary))] mb-8">
        Adjustable anytime in Settings &rarr; Workspace
      </p>

      {error && (
        <p className="text-xs text-red-500 mb-4">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="px-6 py-2.5 rounded-full bg-teal-500 hover:bg-teal-600 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white font-semibold text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {confirming ? 'Confirming...' : 'Confirm & Continue'}
        </button>
      </div>
    </div>
  )
}
