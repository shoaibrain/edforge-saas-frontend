/**
 * Step 3: Create School — Simplified single-card school creation.
 */

import { useState } from 'react'
import { extractApiErrorMessage } from '@edforge/api-client'
import { useShell } from '../../../lib/shell-context'
import { tenantService } from '../../../services/tenant.service'
import type { OnboardingStepProps } from '../onboarding.types'
import { ONBOARDING_STEPS } from '../onboarding.types'

const SCHOOL_TYPES = [
  { value: 'elementary', label: 'Elementary' },
  { value: 'middle', label: 'Middle' },
  { value: 'high', label: 'High School' },
  { value: 'k12', label: 'K-12' },
] as const

const GRADE_OPTIONS = ['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

export function CreateSchoolStep({ setData, onNext, onBack }: OnboardingStepProps) {
  const { workspaceSettings } = useShell()
  const [name, setName] = useState('')
  const [schoolType, setSchoolType] = useState<string>('k12')
  const [gradeFrom, setGradeFrom] = useState('K')
  const [gradeTo, setGradeTo] = useState('12')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSkipWarning, setShowSkipWarning] = useState(false)

  const currency = workspaceSettings?.defaultCurrency || 'USD'
  const stepConfig = ONBOARDING_STEPS[3]

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('School name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      // Generate a short code from the school name
      const schoolCode = name.trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase())
        .join('')
        .slice(0, 6) || 'SCH'

      const school = await tenantService.createSchool({
        name: name.trim(),
        schoolCode,
        schoolType: schoolType as any,
        gradeRange: { start: gradeFrom, end: gradeTo },
        timezone: workspaceSettings?.defaultTimezone || 'America/New_York',
        locale: workspaceSettings?.defaultLocale || 'en-US',
        academicCalendarType: 'annual',
        calendarSystem: workspaceSettings?.defaultCalendarSystem || 'gregorian',
      })
      setData((prev) => ({
        ...prev,
        schoolId: school.id,
        schoolName: school.name,
      }))
      onNext()
    } catch (err) {
      setError(extractApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    if (!showSkipWarning) {
      setShowSkipWarning(true)
      return
    }
    onNext()
  }

  return (
    <div className="bg-[rgb(var(--surface-secondary))] rounded-2xl p-9 border border-[rgb(var(--border-primary))]">
      <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-1">Create Your First School</h2>
      <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">
        Add a school to your organization. You can add more later.
      </p>

      {/* Info banner */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6">
        <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <span className="text-xs text-blue-600 dark:text-blue-400">
          This school inherits your organization's {currency} currency, calendar, and timezone settings.
        </span>
      </div>

      {/* School Name */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
          School Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null) }}
          className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          placeholder="e.g. Sunrise Academy"
          autoFocus
        />
      </div>

      {/* School Type chips */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-2">
          School Type
        </label>
        <div className="grid grid-cols-4 gap-2">
          {SCHOOL_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setSchoolType(type.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                schoolType === type.value
                  ? 'bg-teal-500/15 border-teal-500/40 text-teal-600 dark:text-cyan-400'
                  : 'bg-[rgb(var(--surface-tertiary))] border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--border-secondary))]'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grade Range */}
      <div className="mb-8">
        <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-2">
          Grade Range
        </label>
        <div className="flex items-center gap-3">
          <select
            value={gradeFrom}
            onChange={(e) => setGradeFrom(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          >
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <span className="text-xs text-[rgb(var(--text-tertiary))]">to</span>
          <select
            value={gradeTo}
            onChange={(e) => setGradeTo(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          >
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-4">{error}</p>
      )}

      {showSkipWarning && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
          <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span className="text-xs text-amber-600 dark:text-amber-400">
            {stepConfig.skipWarning} Click skip again to confirm.
          </span>
        </div>
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
            onClick={handleSkip}
            className="text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] transition-colors"
          >
            Skip
          </button>
        </div>
        <button
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className="px-6 py-2.5 rounded-full bg-teal-500 hover:bg-teal-600 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white font-semibold text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {saving ? 'Creating...' : 'Create School'}
        </button>
      </div>
    </div>
  )
}
