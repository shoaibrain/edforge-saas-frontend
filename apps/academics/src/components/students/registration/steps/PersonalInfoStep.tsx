/**
 * Personal Information Step — V2
 *
 * First step of the student registration wizard.
 * Collects name, DOB, gender, and grade level.
 *
 * V2: Collapsible sections with icons, titles, and completion indicators.
 */

import { FormProvider } from 'react-hook-form'
import { User, CalendarDays } from 'lucide-react'
import { TextField, SelectField, DateField } from '@edforge/forms'
import type { WizardStepProps } from '@edforge/wizard'
import { useWizardForm } from '../../../../hooks/useWizardForm'
import { GENDER_OPTIONS } from '../../../../schemas/student.form'
import { useActiveSchoolId } from '../../../../stores/app.store'
import { useSchoolEnabledGradeOptions } from '../../../../hooks/useGradeOptions'
import { CollapsibleSection } from '../CollapsibleSection'
import { useAcademicsI18n } from '../../../../lib/i18n'

// Age bounds for date field (3–22 years)
const today = new Date()
const maxDate = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate())
  .toISOString()
  .split('T')[0]
const minDate = new Date(today.getFullYear() - 22, today.getMonth(), today.getDate())
  .toISOString()
  .split('T')[0]

export function PersonalInfoStep({
  data,
  updateData,
  errors,
  clearError,
}: WizardStepProps) {
  const { t } = useAcademicsI18n()
  const form = useWizardForm({ data, updateData, errors, clearError })
  const schoolId = useActiveSchoolId()
  const { options: filteredGradeOptions } = useSchoolEnabledGradeOptions(schoolId)

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        {/* Name Section */}
        <CollapsibleSection
          id="personal-name"
          icon={User}
          title={t('enrollmentModule.step.personal.studentName')}
          description={t('enrollmentModule.step.personal.studentNameDescription')}
          fields={['firstName', 'lastName', 'middleName', 'preferredName', 'suffix']}
          defaultExpanded
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <TextField
              name="firstName"
              label={t('fields.firstName')}
              placeholder={t('enrollmentModule.step.personal.firstNamePlaceholder')}
              required
            />
            <TextField
              name="lastName"
              label={t('fields.lastName')}
              placeholder={t('enrollmentModule.step.personal.lastNamePlaceholder')}
              required
            />
            <TextField
              name="middleName"
              label={t('fields.middleName')}
              placeholder={t('enrollmentModule.step.personal.middleNamePlaceholder')}
            />
            <TextField
              name="preferredName"
              label={t('enrollmentModule.step.personal.preferredName')}
              placeholder={t('enrollmentModule.step.personal.preferredNamePlaceholder')}
            />
            <TextField
              name="suffix"
              label={t('enrollmentModule.step.personal.suffix')}
              placeholder={t('enrollmentModule.step.personal.suffixPlaceholder')}
              className="md:col-span-1"
            />
          </div>
        </CollapsibleSection>

        {/* Details Section */}
        <CollapsibleSection
          id="personal-details"
          icon={CalendarDays}
          title={t('enrollmentModule.step.personal.basicDetails')}
          description={t('enrollmentModule.step.personal.basicDetailsDescription')}
          fields={['dateOfBirth', 'gender', 'currentGradeLevel']}
          defaultExpanded
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <DateField
              name="dateOfBirth"
              label={t('fields.dateOfBirth')}
              required
              min={minDate}
              max={maxDate}
              helperText={t('enrollmentModule.step.personal.ageHelp')}
            />
            <SelectField
              name="gender"
              label={t('fields.gender')}
              options={GENDER_OPTIONS}
              placeholder={t('enrollmentModule.step.personal.selectGender')}
              required
            />
            <SelectField
              name="currentGradeLevel"
              label={t('fields.gradeLevel')}
              options={[...filteredGradeOptions]}
              placeholder={t('enrollmentModule.step.personal.selectGradeLevel')}
              required
            />
          </div>
        </CollapsibleSection>
      </div>
    </FormProvider>
  )
}
