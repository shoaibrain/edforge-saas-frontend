/**
 * @deprecated Replaced by onboarding flow at /onboarding (Sprint 1).
 * Kept for rollback safety — do not use in new code.
 *
 * WorkspaceSetupGate — Non-dismissible workspace settings confirmation gate.
 *
 * Rendered INSTEAD of the main content (not as a fixed overlay).
 * Shows auto-configured settings for the tenant and requires confirmation
 * before the admin can use the platform.
 */

import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useShell } from '../../lib/shell-context'
import { apiPatch } from '../../lib/api'
import { useQueryClient } from '@tanstack/react-query'

const CONFIRMED_KEY_PREFIX = 'edforge-workspace-confirmed-'

interface WorkspaceSetupGateProps {
  onComplete: () => void
}

const CALENDAR_LABELS: Record<string, string> = {
  gregorian: 'Gregorian',
  bikram_sambat: 'Bikram Sambat',
}

const NUMBER_FORMAT_LABELS: Record<string, string> = {
  international: 'International (1,000,000)',
  south_asian: 'South Asian (10,00,000)',
}

export function WorkspaceSetupGate({ onComplete }: WorkspaceSetupGateProps) {
  const { user, workspaceSettings, tenantName } = useShell()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isConfirming, setIsConfirming] = useState(false)

  const tenantId = user?.tenantId

  const handleConfirm = async () => {
    if (!tenantId || isConfirming) return

    setIsConfirming(true)
    try {
      const result = await apiPatch<{ confirmed: true; workspaceConfirmedAt: string }>(
        `/tenants/${tenantId}/settings/confirm`,
        {},
      )

      // Cache in localStorage
      try {
        localStorage.setItem(
          `${CONFIRMED_KEY_PREFIX}${tenantId}`,
          result.workspaceConfirmedAt,
        )
      } catch {
        // ignore
      }

      // Invalidate workspace settings query so shell gets fresh data
      await queryClient.invalidateQueries({ queryKey: ['workspaceSettings', tenantId] })

      onComplete()
    } catch (err) {
      console.error('Failed to confirm workspace settings:', err)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleEditSettings = () => {
    navigate({ to: '/settings/workspace' })
  }

  const settings = workspaceSettings

  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <div className="max-w-lg w-full p-8 rounded-xl border bg-[rgb(var(--background-primary))] border-[rgb(var(--border-primary))] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <h2 className="m-0 mb-1 text-2xl font-semibold text-[rgb(var(--text-primary))]">
          Welcome{tenantName ? `, ${tenantName}` : ''}
        </h2>
        <p className="mt-0 mb-6 text-sm text-[rgb(var(--text-secondary))]">
          Before you start, confirm your workspace settings.
        </p>

        <div className="flex flex-col gap-3 mb-6">
          <SettingRow label="Currency" value={settings?.defaultCurrency ?? '—'} />
          <SettingRow
            label="Calendar System"
            value={CALENDAR_LABELS[settings?.defaultCalendarSystem ?? ''] ?? settings?.defaultCalendarSystem ?? '—'}
          />
          <SettingRow label="Timezone" value={settings?.defaultTimezone ?? '—'} />
          <SettingRow
            label="Number Format"
            value={NUMBER_FORMAT_LABELS[settings?.defaultNumberFormat ?? ''] ?? settings?.defaultNumberFormat ?? '—'}
          />
        </div>

        <p className="mt-0 mb-6 text-xs text-[rgb(var(--text-secondary))]">
          These settings apply to your entire organization.
        </p>

        <button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="w-full px-4 py-3 mb-3 text-sm font-semibold rounded-lg border-none cursor-pointer bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isConfirming ? 'Confirming...' : 'Confirm & Start Using EdForge'}
        </button>

        <button
          onClick={handleEditSettings}
          className="w-full px-4 py-2 text-xs underline bg-transparent border-none cursor-pointer text-[rgb(var(--text-secondary))]"
        >
          These look wrong — edit settings
        </button>
      </div>
    </div>
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-3 py-2 rounded-md bg-[rgb(var(--background-secondary))]">
      <span className="text-xs text-[rgb(var(--text-secondary))]">
        {label}
      </span>
      <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
        {value}
      </span>
    </div>
  )
}
