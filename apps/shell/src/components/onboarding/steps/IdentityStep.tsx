/**
 * Step 1: Identity — Name + avatar display
 */

import { useState } from 'react'
import { extractApiErrorMessage } from '@edforge/api-client'
import type { AxiosError } from '@edforge/api-client'
import { useShell } from '../../../lib/shell-context'
import { usersService } from '../../../services/users.service'
import type { OnboardingStepProps } from '../onboarding.types'

interface ValidationError {
  path: string[]
  message: string
  code?: string
}

export function IdentityStep({ data, setData, onNext, onSkip }: OnboardingStepProps) {
  const { user } = useShell()
  const nameParts = (user?.name || '').split(' ')
  const [firstName, setFirstName] = useState(data.firstName || nameParts[0] || '')
  const [lastName, setLastName] = useState(data.lastName || nameParts.slice(1).join(' ') || '')
  const [displayName, setDisplayName] = useState(data.displayName || user?.displayName || '')
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const initials = [firstName, lastName]
    .map((n) => n.charAt(0).toUpperCase())
    .filter(Boolean)
    .join('')

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleContinue = async () => {
    if (!user?.id) return

    // Client-side validation
    const errors: Record<string, string> = {}
    if (firstName.trim().length < 1) errors.firstName = 'First name is required'
    if (lastName.trim().length < 2) errors.lastName = 'Last name must be at least 2 characters'
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setGeneralError(null)
      return
    }

    setSaving(true)
    setFieldErrors({})
    setGeneralError(null)
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
      const axiosErr = err as AxiosError<{ errors?: ValidationError[] }>
      const apiErrors = axiosErr?.response?.data?.errors
      if (apiErrors?.length) {
        const mapped: Record<string, string> = {}
        for (const e of apiErrors) {
          const field = e.path?.[0]
          if (field) mapped[field] = e.message
        }
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped)
        } else {
          setGeneralError(extractApiErrorMessage(err))
        }
      } else {
        setGeneralError(extractApiErrorMessage(err))
      }
    } finally {
      setSaving(false)
    }
  }

  const inputBase = 'w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--background-tertiary))] border text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 transition-colors'
  const inputNormal = `${inputBase} border-[rgb(var(--border-primary))] focus:ring-[rgb(var(--border-focus)/0.40)]`
  const inputError = `${inputBase} border-[rgb(var(--state-danger-border)/0.60)] ring-2 ring-[rgb(var(--state-danger-border)/0.30)] focus:ring-[rgb(var(--state-danger-border)/0.50)]`

  return (
    <div className="bg-[rgb(var(--background-secondary))] rounded-2xl p-9 border border-[rgb(var(--border-primary))]">
      <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-1">Your Profile</h2>
      <p className="text-sm text-[rgb(var(--text-secondary))] mb-8">How should we address you?</p>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[rgb(var(--action-primary-bg))]/20 to-[rgb(var(--action-primary-bg-hover))]/20 border-2 border-[rgb(var(--border-primary))] flex items-center justify-center mb-2">
          <span className="text-2xl font-bold text-[rgb(var(--action-secondary-fg))] ">
            {initials || '?'}
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]">
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
              onChange={(e) => { setFirstName(e.target.value); clearFieldError('firstName') }}
              className={fieldErrors.firstName ? inputError : inputNormal}
              placeholder="First name"
            />
            {fieldErrors.firstName && (
              <p className="text-xs text-[rgb(var(--state-danger-fg))] mt-1.5">{fieldErrors.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); clearFieldError('lastName') }}
              className={fieldErrors.lastName ? inputError : inputNormal}
              placeholder="Last name"
            />
            {fieldErrors.lastName && (
              <p className="text-xs text-[rgb(var(--state-danger-fg))] mt-1.5">{fieldErrors.lastName}</p>
            )}
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
            className={inputNormal}
            placeholder="e.g. Dr. Smith"
          />
        </div>
      </div>

      {generalError && (
        <p className="text-xs text-[rgb(var(--state-danger-fg))] mb-4">{generalError}</p>
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
          className="px-6 py-2.5 rounded-full bg-[rgb(var(--action-primary-bg))] hover:bg-[rgb(var(--action-primary-bg-hover))]  dark: text-[rgb(var(--action-primary-fg))] font-semibold text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
