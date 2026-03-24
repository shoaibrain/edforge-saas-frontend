/**
 * Step 5: Invite Team — Add team members by email.
 * Skippable without warning.
 */

import { useState } from 'react'
import { usersService } from '../../../services/users.service'
import type { OnboardingStepProps } from '../onboarding.types'

interface Invitee {
  email: string
  firstName: string
  lastName: string
  globalRole: string
}

const ROLE_OPTIONS = [
  { value: 'TenantAdmin', label: 'Admin' },
  { value: 'StandardUser', label: 'Staff' },
]

export function InviteTeamStep({ data, setData, onNext, onBack }: OnboardingStepProps) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState('StandardUser')
  const [invitees, setInvitees] = useState<Invitee[]>(data.invitees || [])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  const handleAdd = () => {
    setAddError(null)
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setAddError('Email, first name, and last name are required')
      return
    }
    if (invitees.some((i) => i.email === email.trim())) {
      setAddError('This email is already in the list')
      return
    }
    const newInvitee: Invitee = {
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      globalRole: role,
    }
    setInvitees((prev) => [...prev, newInvitee])
    setEmail('')
    setFirstName('')
    setLastName('')
    setRole('StandardUser')
  }

  const handleRemove = (emailToRemove: string) => {
    setInvitees((prev) => prev.filter((i) => i.email !== emailToRemove))
  }

  const handleSendAndContinue = async () => {
    if (invitees.length === 0) {
      onNext()
      return
    }
    setSending(true)
    setError(null)
    try {
      for (const invitee of invitees) {
        await usersService.createUser({
          email: invitee.email,
          firstName: invitee.firstName,
          lastName: invitee.lastName,
        })
      }
      setData((prev) => ({ ...prev, invitees }))
      onNext()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitations')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-[rgb(var(--surface-secondary))] rounded-2xl p-9 border border-[rgb(var(--border-primary))]">
      <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-1">Invite Your Team</h2>
      <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">
        Add team members who'll help manage your organization. They'll receive an email invitation.
      </p>

      {/* Add form */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            placeholder="First name"
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            placeholder="Last name"
          />
        </div>
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setAddError(null) }}
            className="flex-1 px-3 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            placeholder="Email address"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            className="px-4 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-sm font-medium text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--interactive-hover))] transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {addError && (
        <p className="text-xs text-red-500 mb-3">{addError}</p>
      )}

      {/* Invitee list */}
      {invitees.length > 0 && (
        <div className="space-y-2 mb-6 max-h-40 overflow-y-auto">
          {invitees.map((inv) => (
            <div
              key={inv.email}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))]"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-teal-500/15 flex items-center justify-center">
                  <span className="text-xs font-medium text-teal-600 dark:text-cyan-400">
                    {inv.firstName.charAt(0)}{inv.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-[rgb(var(--text-primary))]">{inv.firstName} {inv.lastName}</p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">{inv.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-tertiary))]">
                  {ROLE_OPTIONS.find((r) => r.value === inv.globalRole)?.label}
                </span>
                <button
                  onClick={() => handleRemove(inv.email)}
                  className="text-[rgb(var(--text-tertiary))] hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {invitees.length === 0 && (
        <div className="py-6 text-center text-xs text-[rgb(var(--text-tertiary))] mb-6">
          No team members added yet
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 mb-4">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] transition-colors"
          >
            Back
          </button>
          <button
            onClick={onNext}
            className="text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] transition-colors"
          >
            Skip
          </button>
        </div>
        <button
          onClick={handleSendAndContinue}
          disabled={sending}
          className="px-6 py-2.5 rounded-full bg-teal-500 hover:bg-teal-600 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white font-semibold text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {sending ? 'Sending...' : invitees.length > 0 ? `Send ${invitees.length} Invite${invitees.length > 1 ? 's' : ''} & Continue` : 'Continue'}
        </button>
      </div>
    </div>
  )
}
