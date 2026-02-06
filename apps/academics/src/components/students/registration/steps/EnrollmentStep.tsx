/**
 * Enrollment Step
 *
 * Fifth step of the student registration wizard.
 * Collects enrollment type, date, and transfer-specific fields.
 * schoolId and gradeLevel are auto-populated from context / step 1.
 */

import { FormProvider } from 'react-hook-form'
import { TextField, DateField, RadioGroupField, TextareaField } from '@edforge/forms'
import { motion, AnimatePresence } from 'framer-motion'
import type { WizardStepProps } from '@edforge/wizard'
import { useWizardForm } from '../../../../hooks/useWizardForm'
import { ENROLLMENT_TYPE_OPTIONS } from '../../../../schemas/student.form'

const ENROLLMENT_TYPE_RADIO = ENROLLMENT_TYPE_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
  description:
    o.value === 'new'
      ? 'First-time enrollment in this school'
      : o.value === 'transfer'
        ? 'Transferring from another school'
        : 'Previously enrolled and returning',
}))

export function EnrollmentStep({
  data,
  updateData,
  errors,
  clearError,
}: WizardStepProps) {
  const form = useWizardForm({ data, updateData, errors, clearError })
  const enrollmentType = form.watch('enrollment.enrollmentType') as string

  return (
    <FormProvider {...form}>
      <div className="space-y-8">
        {/* Enrollment Type */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-4">
            Enrollment Type
          </h3>
          <RadioGroupField
            name="enrollment.enrollmentType"
            options={ENROLLMENT_TYPE_RADIO}
            direction="vertical"
          />
        </div>

        {/* Enrollment Details */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-4">
            Enrollment Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <DateField
              name="enrollment.enrollmentDate"
              label="Enrollment Date"
              required
            />
            <TextField
              name="enrollment.academicYearId"
              label="Academic Year"
              placeholder="e.g. 2025-2026"
              helperText="Academic year identifier"
            />
          </div>
        </div>

        {/* Transfer-specific fields */}
        <AnimatePresence>
          {enrollmentType === 'transfer' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-4">
                  Transfer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <TextField
                    name="enrollment.previousSchoolName"
                    label="Previous School"
                    placeholder="Name of previous school"
                  />
                  <TextField
                    name="enrollment.previousSchoolAddress"
                    label="Previous School Address"
                    placeholder="City, State"
                  />
                </div>
                <TextareaField
                  name="enrollment.transferReason"
                  label="Reason for Transfer"
                  placeholder="Briefly describe the reason for transfer"
                  rows={3}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-4">
            Additional Notes
          </h3>
          <TextareaField
            name="enrollment.notes"
            label="Notes"
            placeholder="Any additional notes about this enrollment..."
            rows={3}
            maxLength={2000}
            showCharCount
          />
        </div>

        {/* Auto-populated Info */}
        <div className="rounded-lg bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-secondary))] p-4">
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            <span className="font-medium">Note:</span> School and grade level will be automatically set based on your school context and the grade selected in Step 1.
          </p>
        </div>
      </div>
    </FormProvider>
  )
}
