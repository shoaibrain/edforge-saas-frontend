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
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: '100%',
          background: 'var(--background-primary, #ffffff)',
          borderRadius: 12,
          border: '1px solid var(--border-primary, #e4e7f0)',
          padding: '2rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <h2
          style={{
            margin: '0 0 0.25rem',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--text-primary, #1e2436)',
          }}
        >
          Welcome{tenantName ? `, ${tenantName}` : ''}
        </h2>
        <p
          style={{
            margin: '0 0 1.5rem',
            color: 'var(--text-secondary, #7a8099)',
            fontSize: '0.875rem',
          }}
        >
          Before you start, confirm your workspace settings.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
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

        <p
          style={{
            margin: '0 0 1.5rem',
            color: 'var(--text-secondary, #7a8099)',
            fontSize: '0.75rem',
          }}
        >
          These settings apply to your entire organization.
        </p>

        <button
          onClick={handleConfirm}
          disabled={isConfirming}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: '#ffffff',
            background: 'var(--accent-primary, #1D9E75)',
            border: 'none',
            borderRadius: 8,
            cursor: isConfirming ? 'not-allowed' : 'pointer',
            opacity: isConfirming ? 0.7 : 1,
            marginBottom: '0.75rem',
          }}
        >
          {isConfirming ? 'Confirming...' : 'Confirm & Start Using EdForge'}
        </button>

        <button
          onClick={handleEditSettings}
          style={{
            width: '100%',
            padding: '0.5rem 1rem',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary, #7a8099)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          These look wrong — edit settings
        </button>
      </div>
    </div>
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0.75rem',
        background: 'var(--background-secondary, #f8f9fc)',
        borderRadius: 6,
      }}
    >
      <span style={{ color: 'var(--text-secondary, #7a8099)', fontSize: '0.8125rem' }}>
        {label}
      </span>
      <span style={{ color: 'var(--text-primary, #1e2436)', fontSize: '0.875rem', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  )
}
