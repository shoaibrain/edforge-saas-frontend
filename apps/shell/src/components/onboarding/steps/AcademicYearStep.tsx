/**
 * Step 4: Academic Year — Create the first academic year for the school.
 * Auto-skipped if no school was created in step 3.
 */

import { useState } from 'react'
import { useShell } from '../../../lib/shell-context'
import { tenantService } from '../../../services/tenant.service'
import type { OnboardingStepProps } from '../onboarding.types'
import { ONBOARDING_STEPS } from '../onboarding.types'

const TERM_STRUCTURES = [
  { value: 'annual', label: 'Annual' },
  { value: 'semester', label: 'Semester' },
  { value: 'trimester', label: 'Trimester' },
  { value: 'quarter', label: 'Quarter' },
] as const

export function AcademicYearStep({ data, setData, onNext, onBack }: OnboardingStepProps) {
  const { workspaceSettings } = useShell()
  const isBs = workspaceSettings?.defaultCalendarSystem === 'bikram_sambat'

  const [yearName, setYearName] = useState(isBs ? '2082' : '2025-2026')
  const [startDate, setStartDate] = useState(isBs ? '2082-01-01' : '2025-08-15')
  const [endDate, setEndDate] = useState(isBs ? '2082-12-30' : '2026-06-15')
  const [termStructure, setTermStructure] = useState<string>('annual')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSkipWarning, setShowSkipWarning] = useState(false)

  const stepConfig = ONBOARDING_STEPS[4]
  const schoolId = data.schoolId

  const handleCreate = async () => {
    if (!schoolId) return
    if (!yearName.trim()) {
      setError('Year name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const academicYear = await tenantService.createAcademicYear(schoolId, {
        name: yearName.trim(),
        startDate,
        endDate,
      })
      setData((prev) => ({
        ...prev,
        academicYearId: academicYear.id,
        academicYearName: academicYear.name,
      }))
      onNext()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create academic year')
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
      <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-1">Academic Year</h2>
      <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">
        Set up the academic year for {data.schoolName || 'your school'}.
      </p>

      {/* Year Name */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
          Year Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={yearName}
          onChange={(e) => { setYearName(e.target.value); setError(null) }}
          className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          placeholder={isBs ? 'e.g. 2082' : 'e.g. 2025-2026'}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
        </div>
      </div>

      {/* Term Structure chips */}
      <div className="mb-8">
        <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-2">
          Year Structure
        </label>
        <div className="grid grid-cols-4 gap-2">
          {TERM_STRUCTURES.map((ts) => (
            <button
              key={ts.value}
              onClick={() => setTermStructure(ts.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                termStructure === ts.value
                  ? 'bg-teal-500/15 border-teal-500/40 text-teal-600 dark:text-cyan-400'
                  : 'bg-[rgb(var(--surface-tertiary))] border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--border-secondary))]'
              }`}
            >
              {ts.label}
            </button>
          ))}
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
          disabled={saving || !yearName.trim()}
          className="px-6 py-2.5 rounded-full bg-teal-500 hover:bg-teal-600 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white font-semibold text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {saving ? 'Creating...' : 'Create Year'}
        </button>
      </div>
    </div>
  )
}
