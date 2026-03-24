/**
 * Step 1: Identity — Name + avatar display
 */

import { useState } from 'react'
import { useShell } from '../../../lib/shell-context'
import { usersService } from '../../../services/users.service'
import type { OnboardingStepProps } from '../onboarding.types'

export function IdentityStep({ data, setData, onNext, onSkip }: OnboardingStepProps) {
  const { user } = useShell()
  const nameParts = (user?.name || '').split(' ')
  const [firstName, setFirstName] = useState(data.firstName || nameParts[0] || '')
  const [lastName, setLastName] = useState(data.lastName || nameParts.slice(1).join(' ') || '')
  const [displayName, setDisplayName] = useState(data.displayName || user?.displayName || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initials = [firstName, lastName]
    .map((n) => n.charAt(0).toUpperCase())
    .filter(Boolean)
    .join('')

  const handleContinue = async () => {
    if (!user?.id) return
    setSaving(true)
    setError(null)
    try {
      await usersService.updateUser(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim() || undefined,
      })
      setData((prev) => ({
        ...prev,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim(),
      }))
      onNext()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[rgb(var(--surface-secondary))] rounded-2xl p-9 border border-[rgb(var(--border-primary))]">
      <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-1">Your Profile</h2>
      <p className="text-sm text-[rgb(var(--text-secondary))] mb-8">How should we address you?</p>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-400/20 border-2 border-[rgb(var(--border-primary))] flex items-center justify-center mb-2">
          <span className="text-2xl font-bold text-teal-600 dark:text-cyan-400">
            {initials || '?'}
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]">
          Photo upload coming soon
        </span>
      </div>

      {/* Fields */}
      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              placeholder="Last name"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
            Display Name <span className="text-[rgb(var(--text-tertiary))]">(optional)</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            placeholder="e.g. Dr. Smith"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-4">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onSkip}
          className="text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] transition-colors"
        >
          Skip for now
        </button>
        <button
          onClick={handleContinue}
          disabled={saving}
          className="px-6 py-2.5 rounded-full bg-teal-500 hover:bg-teal-600 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white font-semibold text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
