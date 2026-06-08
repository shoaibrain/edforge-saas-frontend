/**
 * Step 4: Academic Year — Create the first academic year for the school.
 * Auto-skipped if no school was created in step 3.
 */

import { useState } from 'react'
import { Button, Field, InlineAlert, Input, RadioGroup, Stack } from '@edforge/ui'
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
    <div className="bg-[rgb(var(--background-secondary))] rounded-2xl p-9 border border-[rgb(var(--border-primary))]">
      <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-1">Academic Year</h2>
      <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">
        Set up the academic year for {data.schoolName || 'your school'}.
      </p>

      <Stack space="md" className="mb-8">
        <Field label="Year Name" required optionalText={null} error={error === 'Year name is required' ? error : undefined}>
          <Input
            type="text"
            value={yearName}
            onChange={(e) => { setYearName(e.target.value); setError(null) }}
            placeholder={isBs ? 'e.g. 2082' : 'e.g. 2025-2026'}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date" optionalText={null}>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label="End Date" optionalText={null}>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Year Structure" optionalText={null}>
          <RadioGroup
            name="onboarding-term-structure"
            value={termStructure}
            onChange={setTermStructure}
            direction="horizontal"
            variant="card"
            options={TERM_STRUCTURES}
          />
        </Field>
      </Stack>

      {error && (
        error !== 'Year name is required' ? (
          <p className="text-xs text-[rgb(var(--state-danger-fg))] mb-4">{error}</p>
        ) : null
      )}

      {showSkipWarning && (
        <InlineAlert variant="warning" className="mb-4">
          {stepConfig.skipWarning} Click skip again to confirm.
        </InlineAlert>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={onBack}
            variant="ghost"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleSkip}
            variant="ghost"
          >
            Skip
          </Button>
        </div>
        <Button
          type="button"
          onClick={handleCreate}
          disabled={saving || !yearName.trim()}
          isLoading={saving}
        >
          Create Year
        </Button>
      </div>
    </div>
  )
}
