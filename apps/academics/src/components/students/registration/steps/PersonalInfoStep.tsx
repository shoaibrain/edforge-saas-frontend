/**
 * Personal Information Step
 *
 * First step of the student registration wizard.
 * Collects name, DOB, gender, and grade level.
 */

import { FormProvider } from 'react-hook-form'
import { TextField, SelectField, DateField } from '@edforge/forms'
import type { WizardStepProps } from '@edforge/wizard'
import { useWizardForm } from '../../../../hooks/useWizardForm'
import {
  GENDER_OPTIONS,
  GRADE_LEVEL_OPTIONS,
} from '../../../../schemas/student.form'

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

  return (
    <FormProvider {...form}>
      <div className="space-y-8">
        {/* Name Section */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-4">
            Name
          </h3>
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
        </div>

        {/* Details Section */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-4">
            Details
          </h3>
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
              options={GRADE_LEVEL_OPTIONS}
              placeholder="Select grade level"
              required
            />
          </div>
        </div>
      </div>
    </FormProvider>
  )
}
