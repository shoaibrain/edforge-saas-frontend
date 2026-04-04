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
import { useSchoolGradeRange } from '../../../../hooks/useSchool'
import { useFilteredGradeOptions } from '../../../../hooks/useGradeOptions'
import { CollapsibleSection } from '../CollapsibleSection'

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
  const form = useWizardForm({ data, updateData, errors, clearError })
  const schoolId = useActiveSchoolId()
  const { gradeRange } = useSchoolGradeRange(schoolId)
  const filteredGradeOptions = useFilteredGradeOptions(gradeRange)

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        {/* Name Section */}
        <CollapsibleSection
          id="personal-name"
          icon={User}
          title="Student Name"
          description="Legal name as it appears on official documents"
          fields={['firstName', 'lastName', 'middleName', 'preferredName', 'suffix']}
          defaultExpanded
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <TextField
              name="firstName"
              label="First Name"
              placeholder="Enter first name"
              required
            />
            <TextField
              name="lastName"
              label="Last Name"
              placeholder="Enter last name"
              required
            />
            <TextField
              name="middleName"
              label="Middle Name"
              placeholder="Enter middle name"
            />
            <TextField
              name="preferredName"
              label="Preferred Name"
              placeholder="Nickname or preferred name"
            />
            <TextField
              name="suffix"
              label="Suffix"
              placeholder="Jr., III, etc."
              className="md:col-span-1"
            />
          </div>
        </CollapsibleSection>

        {/* Details Section */}
        <CollapsibleSection
          id="personal-details"
          icon={CalendarDays}
          title="Basic Details"
          description="Date of birth, gender, and grade level"
          fields={['dateOfBirth', 'gender', 'currentGradeLevel']}
          defaultExpanded
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <DateField
              name="dateOfBirth"
              label="Date of Birth"
              required
              min={minDate}
              max={maxDate}
              helperText="Student must be between 3 and 22 years old"
            />
            <SelectField
              name="gender"
              label="Gender"
              options={GENDER_OPTIONS}
              placeholder="Select gender"
              required
            />
            <SelectField
              name="currentGradeLevel"
              label="Grade Level"
              options={[...filteredGradeOptions]}
              placeholder="Select grade level"
              required
            />
          </div>
        </CollapsibleSection>
      </div>
    </FormProvider>
  )
}
