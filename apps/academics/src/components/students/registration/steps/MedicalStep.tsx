/**
 * Medical Information Step
 *
 * Fourth step of the student registration wizard.
 * Collects medical info, demographics, special programs — all optional.
 */

import { useCallback } from 'react'
import { FormProvider } from 'react-hook-form'
import { TextField, CheckboxField, SelectField } from '@edforge/forms'
import type { WizardStepProps } from '@edforge/wizard'
import { useWizardForm } from '../../../../hooks/useWizardForm'
import { TagInput } from '../../../common/TagInput'

const ETHNICITY_OPTIONS = [
  { value: 'american_indian', label: 'American Indian / Alaska Native' },
  { value: 'asian', label: 'Asian' },
  { value: 'black', label: 'Black / African American' },
  { value: 'hispanic', label: 'Hispanic / Latino' },
  { value: 'native_hawaiian', label: 'Native Hawaiian / Pacific Islander' },
  { value: 'white', label: 'White' },
  { value: 'two_or_more', label: 'Two or More Races' },
  { value: 'prefer_not_to_say', label: 'Prefer Not to Say' },
]

const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'Mandarin', label: 'Mandarin Chinese' },
  { value: 'French', label: 'French' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Vietnamese', label: 'Vietnamese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Tagalog', label: 'Tagalog' },
  { value: 'Other', label: 'Other' },
]

export function MedicalStep({
  data,
  updateData,
  errors,
  clearError,
}: WizardStepProps) {
  const form = useWizardForm({ data, updateData, errors, clearError })

  // Helper to safely get nested arrays from wizard data
  const getTagArray = useCallback(
    (path: string): string[] => {
      const parts = path.split('.')
      let current: unknown = data
      for (const part of parts) {
        if (current && typeof current === 'object') {
          current = (current as Record<string, unknown>)[part]
        } else {
          return []
        }
      }
      return Array.isArray(current) ? current : []
    },
    [data]
  )

  // Update a nested tag array in the wizard data
  const updateTags = useCallback(
    (path: string, tags: string[]) => {
      const parts = path.split('.')
      if (parts.length === 1) {
        updateData({ [parts[0]]: tags })
        return
      }
      // e.g. "medicalInfo.allergies" → update medicalInfo.allergies
      const topKey = parts[0]
      const subKey = parts[1]
      const existing = (data[topKey] as Record<string, unknown> | undefined) ?? {}
      updateData({
        [topKey]: { ...existing, [subKey]: tags },
      })
    },
    [data, updateData]
  )

  return (
    <FormProvider {...form}>
      <div className="space-y-8">
        {/* Info Banner */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
          All fields on this page are optional. You can skip this step and add medical information later.
        </div>

        {/* Health Conditions */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-4">
            Health Information
          </h3>
          <div className="space-y-4">
            <TagInput
              label="Allergies"
              value={getTagArray('medicalInfo.allergies')}
              onChange={(tags) => updateTags('medicalInfo.allergies', tags)}
              placeholder="Type an allergy and press Enter"
              helperText="e.g. Peanuts, Latex, Penicillin"
            />
            <TagInput
              label="Current Medications"
              value={getTagArray('medicalInfo.medications')}
              onChange={(tags) => updateTags('medicalInfo.medications', tags)}
              placeholder="Type a medication and press Enter"
            />
            <TagInput
              label="Medical Conditions"
              value={getTagArray('medicalInfo.conditions')}
              onChange={(tags) => updateTags('medicalInfo.conditions', tags)}
              placeholder="Type a condition and press Enter"
              helperText="e.g. Asthma, Diabetes, Epilepsy"
            />
            <TagInput
              label="Dietary Restrictions"
              value={getTagArray('medicalInfo.dietaryRestrictions')}
              onChange={(tags) => updateTags('medicalInfo.dietaryRestrictions', tags)}
              placeholder="Type a dietary restriction and press Enter"
            />
          </div>
        </div>

        {/* Special Education */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-4">
            Special Education
          </h3>
          <div className="flex flex-wrap gap-x-8 gap-y-3 mb-4">
            <CheckboxField
              name="medicalInfo.hasIEP"
              label="Individualized Education Program (IEP)"
              description="Student has an active IEP"
            />
            <CheckboxField
              name="medicalInfo.has504Plan"
              label="Section 504 Plan"
              description="Student has an active 504 plan"
            />
          </div>
          <div className="space-y-4">
            <TagInput
              label="Special Programs"
              value={getTagArray('specialPrograms')}
              onChange={(tags) => updateTags('specialPrograms', tags)}
              placeholder="e.g. Gifted & Talented, ESL, Title I"
            />
            <TagInput
              label="Accommodations"
              value={getTagArray('accommodations')}
              onChange={(tags) => updateTags('accommodations', tags)}
              placeholder="e.g. Extended time, Preferential seating"
            />
          </div>
        </div>

        {/* Physician */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-4">
            Physician Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <TextField
              name="medicalInfo.physicianName"
              label="Physician Name"
              placeholder="Dr. Jane Smith"
            />
            <TextField
              name="medicalInfo.physicianPhone"
              label="Physician Phone"
              placeholder="(555) 123-4567"
            />
            <TextField
              name="medicalInfo.insuranceProvider"
              label="Insurance Provider"
              placeholder="Insurance company name"
            />
            <TextField
              name="medicalInfo.insurancePolicyNumber"
              label="Policy Number"
              placeholder="Policy or ID number"
            />
          </div>
        </div>

        {/* Demographics */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-4">
            Demographics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <SelectField
              name="ethnicity"
              label="Ethnicity"
              options={ETHNICITY_OPTIONS}
              placeholder="Select ethnicity"
            />
            <SelectField
              name="primaryLanguage"
              label="Primary Language"
              options={LANGUAGE_OPTIONS}
              placeholder="Select language"
            />
            <SelectField
              name="homeLanguage"
              label="Home Language"
              options={LANGUAGE_OPTIONS}
              placeholder="Select language"
            />
            <TextField
              name="countryOfBirth"
              label="Country of Birth"
              placeholder="Country of birth"
            />
          </div>
        </div>
      </div>
    </FormProvider>
  )
}
