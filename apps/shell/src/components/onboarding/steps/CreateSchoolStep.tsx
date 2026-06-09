/**
 * Step 3: Create School — Simplified single-card school creation.
 */

import { useState } from 'react'
import { extractApiErrorMessage } from '@edforge/api-client'
import { Button, Field, InlineAlert, Input, RadioGroup, Select, Stack } from '@edforge/ui'
import { useShell } from '../../../lib/shell-context'
import { tenantService } from '../../../services/tenant.service'
import type { OnboardingStepProps } from '../onboarding.types'
import { ONBOARDING_STEPS } from '../onboarding.types'
import { GRADE_LEVEL_OPTIONS } from '@aibrains/shared-types'

const SCHOOL_TYPES = [
  { value: 'elementary', label: 'Elementary' },
  { value: 'middle', label: 'Middle' },
  { value: 'high', label: 'High School' },
  { value: 'k12', label: 'K-12' },
] as const

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
    <div className="bg-[rgb(var(--background-secondary))] rounded-2xl p-9 border border-[rgb(var(--border-primary))]">
      <h2 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-1">Create Your First School</h2>
      <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">
        Add a school to your organization. You can add more later.
      </p>

      <Stack space="md" className="mb-8">
        <InlineAlert variant="info">
          This school inherits your organization's {currency} currency, calendar, and timezone settings.
        </InlineAlert>

        <Field label="School Name" required optionalText={null} error={error === 'School name is required' ? error : undefined}>
          <Input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null) }}
            placeholder="e.g. Sunrise Academy"
            autoFocus
          />
        </Field>

        <Field label="School Type" optionalText={null}>
          <RadioGroup
            name="onboarding-school-type"
            value={schoolType}
            onChange={setSchoolType}
            direction="horizontal"
            variant="card"
            options={SCHOOL_TYPES}
          />
        </Field>

        <div>
          <p className="mb-2 text-sm font-medium text-[rgb(var(--text-secondary))]">Grade Range</p>
          <div className="flex items-start gap-3">
            <Select
              label="Start grade"
              optionalText={null}
              value={gradeFrom}
              onChange={(value) => value && setGradeFrom(value)}
              options={GRADE_LEVEL_OPTIONS}
              buttonClassName="min-w-0"
            />
            <span className="pt-3 text-xs text-[rgb(var(--text-tertiary))]">to</span>
            <Select
              label="End grade"
              optionalText={null}
              value={gradeTo}
              onChange={(value) => value && setGradeTo(value)}
              options={GRADE_LEVEL_OPTIONS}
              buttonClassName="min-w-0"
            />
          </div>
        </div>
      </Stack>

      {error && (
        error !== 'School name is required' ? (
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
          disabled={saving || !name.trim()}
          isLoading={saving}
        >
          Create School
        </Button>
      </div>
    </div>
  )
}
