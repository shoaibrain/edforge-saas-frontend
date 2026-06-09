/**
 * Medical Information Step — V2
 *
 * Fourth step of the student registration wizard.
 * Collects medical info, demographics, special programs — all optional.
 *
 * V2: All sections default collapsed since entire step is optional.
 * Collapsible sections with icons, titles, and completion indicators.
 */

import { useCallback } from 'react'
import { FormProvider } from 'react-hook-form'
import { Heart, Stethoscope, Globe, Info } from 'lucide-react'
import { TextField, SelectField } from '@edforge/forms'
import type { WizardStepProps } from '@edforge/wizard'
import { useWizardForm } from '../../../../hooks/useWizardForm'
import { TagInput } from '../../../common/TagInput'
import { CollapsibleSection } from '../CollapsibleSection'

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

  const updateTags = useCallback(
    (path: string, tags: string[]) => {
      const parts = path.split('.')
      if (parts.length === 1) {
        updateData({ [parts[0]]: tags })
        return
      }
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
      <div className="space-y-4">
        {/* Info Banner */}
        <div
          className="flex items-start gap-3 rounded-lg p-3"
          style={{
            background: 'rgb(var(--state-info-bg))',
            border: '1px solid rgb(var(--state-info-border))',
          }}
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'rgb(var(--state-info-fg))' }} />
          <p style={{ fontSize: 12, color: 'rgb(var(--text-secondary))' }}>
            All fields on this page are optional. You can skip this step and add information later.
          </p>
        </div>

        {/* Health Information */}
        <CollapsibleSection
          id="medical-health"
          icon={Heart}
          title="Health Information"
          description="Allergies, medications, conditions, dietary restrictions"
          fields={[
            'medicalInfo.allergies',
            'medicalInfo.medications',
            'medicalInfo.conditions',
            'medicalInfo.dietaryRestrictions',
          ]}
          defaultExpanded={false}
        >
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
        </CollapsibleSection>

        {/* Physician & Insurance */}
        <CollapsibleSection
          id="medical-physician"
          icon={Stethoscope}
          title="Physician & Insurance"
          description="Primary care physician and insurance details"
          fields={[
            'medicalInfo.physicianName',
            'medicalInfo.physicianPhone',
            'medicalInfo.insuranceProvider',
            'medicalInfo.insurancePolicyNumber',
          ]}
          defaultExpanded={false}
        >
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
        </CollapsibleSection>

        {/* Demographics */}
        <CollapsibleSection
          id="medical-demographics"
          icon={Globe}
          title="Demographics"
          description="Ethnicity, language, and country of birth"
          fields={['ethnicity', 'primaryLanguage', 'homeLanguage', 'countryOfBirth']}
          defaultExpanded={false}
        >
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
        </CollapsibleSection>
      </div>
    </FormProvider>
  )
}
