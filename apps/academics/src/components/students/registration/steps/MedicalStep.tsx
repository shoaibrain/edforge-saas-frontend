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
import { useAcademicsI18n } from '../../../../lib/i18n'

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
  const { t } = useAcademicsI18n()
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
        <div className="flex items-start gap-3 rounded-lg p-3 bg-[rgb(var(--state-info-bg))] border border-[rgb(var(--state-info-border))]">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[rgb(var(--state-info-fg))]" />
          <p className="text-xs text-[rgb(var(--text-secondary))]">
            {t('enrollmentModule.step.medical.optionalInfo')}
          </p>
        </div>

        {/* Health Information */}
        <CollapsibleSection
          id="medical-health"
          icon={Heart}
          title={t('enrollmentModule.step.medical.health')}
          description={t('enrollmentModule.step.medical.healthDescription')}
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
              label={t('medical.allergies')}
              value={getTagArray('medicalInfo.allergies')}
              onChange={(tags) => updateTags('medicalInfo.allergies', tags)}
              placeholder={t('enrollmentModule.step.medical.allergyPlaceholder')}
              helperText={t('enrollmentModule.step.medical.allergyHelp')}
            />
            <TagInput
              label={t('enrollmentModule.step.medical.currentMedications')}
              value={getTagArray('medicalInfo.medications')}
              onChange={(tags) => updateTags('medicalInfo.medications', tags)}
              placeholder={t('enrollmentModule.step.medical.medicationPlaceholder')}
            />
            <TagInput
              label={t('enrollmentModule.step.medical.medicalConditions')}
              value={getTagArray('medicalInfo.conditions')}
              onChange={(tags) => updateTags('medicalInfo.conditions', tags)}
              placeholder={t('enrollmentModule.step.medical.conditionPlaceholder')}
              helperText={t('enrollmentModule.step.medical.conditionHelp')}
            />
            <TagInput
              label={t('medical.dietaryRestrictions')}
              value={getTagArray('medicalInfo.dietaryRestrictions')}
              onChange={(tags) => updateTags('medicalInfo.dietaryRestrictions', tags)}
              placeholder={t('enrollmentModule.step.medical.dietaryPlaceholder')}
            />
          </div>
        </CollapsibleSection>

        {/* Physician & Insurance */}
        <CollapsibleSection
          id="medical-physician"
          icon={Stethoscope}
          title={t('enrollmentModule.step.medical.physicianInsurance')}
          description={t('enrollmentModule.step.medical.physicianInsuranceDescription')}
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
              label={t('enrollmentModule.step.medical.physicianName')}
              placeholder={t('enrollmentModule.step.medical.physicianPlaceholder')}
            />
            <TextField
              name="medicalInfo.physicianPhone"
              label={t('medical.physicianPhone')}
              placeholder="(555) 123-4567"
            />
            <TextField
              name="medicalInfo.insuranceProvider"
              label={t('enrollmentModule.step.medical.insuranceProvider')}
              placeholder={t('enrollmentModule.step.medical.insurancePlaceholder')}
            />
            <TextField
              name="medicalInfo.insurancePolicyNumber"
              label={t('enrollmentModule.step.medical.policyNumber')}
              placeholder={t('enrollmentModule.step.medical.policyPlaceholder')}
            />
          </div>
        </CollapsibleSection>

        {/* Demographics */}
        <CollapsibleSection
          id="medical-demographics"
          icon={Globe}
          title={t('enrollmentModule.step.medical.demographics')}
          description={t('enrollmentModule.step.medical.demographicsDescription')}
          fields={['ethnicity', 'primaryLanguage', 'homeLanguage', 'countryOfBirth']}
          defaultExpanded={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <SelectField
              name="ethnicity"
              label={t('fields.ethnicity')}
              options={ETHNICITY_OPTIONS}
              placeholder={t('enrollmentModule.step.medical.selectEthnicity')}
            />
            <SelectField
              name="primaryLanguage"
              label={t('fields.primaryLanguage')}
              options={LANGUAGE_OPTIONS}
              placeholder={t('enrollmentModule.step.medical.selectLanguage')}
            />
            <SelectField
              name="homeLanguage"
              label={t('fields.homeLanguage')}
              options={LANGUAGE_OPTIONS}
              placeholder={t('enrollmentModule.step.medical.selectLanguage')}
            />
            <TextField
              name="countryOfBirth"
              label={t('fields.countryOfBirth')}
              placeholder={t('enrollmentModule.step.medical.countryOfBirthPlaceholder')}
            />
          </div>
        </CollapsibleSection>
      </div>
    </FormProvider>
  )
}
