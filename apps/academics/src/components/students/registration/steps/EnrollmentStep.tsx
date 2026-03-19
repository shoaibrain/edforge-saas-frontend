/**
 * Enrollment Step
 *
 * Fifth step of the student registration wizard.
 * Collects enrollment type, date, academic year selection,
 * Ed-Fi descriptor fields, and transfer-specific fields.
 *
 * Sprint Alaska changes:
 * - Academic Year is now a dropdown populated from API (AK-1.5/1.6)
 * - Ed-Fi descriptor fields added (AK-2.3/2.4)
 * - Academic year status validation with visual feedback (AK-3.1)
 * - Enrollment date constrained to academic year range (AK-3.2)
 * - Enrollment step is now required (AK-2.8)
 */

import { useEffect, useMemo } from 'react'
import { FormProvider } from 'react-hook-form'
import { TextField, DateField, RadioGroupField, SelectField, TextareaField } from '@edforge/forms'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import { useWizardForm } from '../../../../hooks/useWizardForm'
import { useAcademicYears } from '../../../../hooks/useSchool'
import { useActiveSchoolId } from '../../../../stores/app.store'
import { ENROLLMENT_TYPE_OPTIONS } from '../../../../schemas/student.form'
import {
  ENTRY_TYPE_OPTIONS,
  RESIDENCY_STATUS_OPTIONS,
} from '../../../../schemas/edfi-descriptors'

const ENROLLMENT_TYPE_RADIO = ENROLLMENT_TYPE_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
  description:
    o.value === 'new'
      ? 'First-time enrollment in this school'
      : o.value === 'transfer'
        ? 'Transferring from another school'
        : o.value === 'returning'
          ? 'Previously enrolled and returning'
          : 'Re-enrolling after a break in enrollment',
}))

export function EnrollmentStep({
  data,
  updateData,
  errors,
  clearError,
}: WizardStepProps) {
  const form = useWizardForm({ data, updateData, errors, clearError })
  const enrollmentType = form.watch('enrollment.enrollmentType') as string
  const selectedYearId = form.watch('enrollment.academicYearId') as string

  // Fetch academic years from API
  const schoolId = useActiveSchoolId()
  const {
    data: academicYears,
    isLoading: yearsLoading,
    isError: yearsError,
  } = useAcademicYears(schoolId || '', !!schoolId)

  // Filter to active years only (planning years not supported for enrollment in MVP)
  const eligibleYears = useMemo(() => {
    if (!academicYears) return []
    return academicYears.filter((y) => y.status === 'active')
  }, [academicYears])

  const yearOptions = useMemo(() => {
    return eligibleYears.map((y) => ({
      value: y.yearId,
      label: `${y.name}${y.isCurrent ? ' (Current)' : ''}`,
    }))
  }, [eligibleYears])

  // Get the selected year object
  const selectedYear = useMemo(() => {
    if (!selectedYearId || !eligibleYears.length) return null
    return eligibleYears.find((y) => y.yearId === selectedYearId) ?? null
  }, [selectedYearId, eligibleYears])

  // Auto-select if only one active year exists
  useEffect(() => {
    if (!selectedYearId && eligibleYears.length > 0) {
      const activeYears = eligibleYears.filter((y) => y.status === 'active')
      if (activeYears.length === 1) {
        form.setValue('enrollment.academicYearId', activeYears[0].yearId)
      }
    }
  }, [eligibleYears, selectedYearId, form])

  // Auto-populate enrollment date to year's start date & constrain range
  useEffect(() => {
    if (selectedYear) {
      const currentDate = form.getValues('enrollment.enrollmentDate') as string
      if (!currentDate) {
        // Default to today if within range, else year start
        const today = new Date().toISOString().split('T')[0]
        const inRange = today >= selectedYear.startDate && today <= selectedYear.endDate
        form.setValue(
          'enrollment.enrollmentDate',
          inRange ? today : selectedYear.startDate
        )
      } else if (currentDate < selectedYear.startDate || currentDate > selectedYear.endDate) {
        // Current date is out of range — reset to year start
        form.setValue('enrollment.enrollmentDate', selectedYear.startDate)
      }
    }
  }, [selectedYear, form])

  const noActiveYear = !yearsLoading && eligibleYears.length === 0

  return (
    <FormProvider {...form}>
      <div className="space-y-8">
        {/* No active academic year blocking message */}
        {noActiveYear && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                No active academic year available
              </p>
              <p className="text-sm text-red-700 mt-1">
                Please configure and activate an academic year in School Settings before enrolling students.
              </p>
            </div>
          </div>
        )}

        {/* Enrollment Type */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-4">
            Enrollment Type
          </h3>
          <RadioGroupField
            name="enrollment.enrollmentType"
            options={ENROLLMENT_TYPE_RADIO}
            direction="horizontal"
            optionsClassName="grid grid-cols-2 gap-4"
          />
        </div>

        {/* Enrollment Details */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-4">
            Enrollment Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Academic Year dropdown */}
            <div>
              {yearsLoading ? (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
                    Academic Year *
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]">
                    <Loader2 className="w-4 h-4 animate-spin text-[rgb(var(--text-tertiary))]" />
                    <span className="text-sm text-[rgb(var(--text-tertiary))]">Loading academic years...</span>
                  </div>
                </div>
              ) : yearsError ? (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-red-500">
                    Academic Year *
                  </label>
                  <div className="px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
                    Failed to load academic years. Please refresh.
                  </div>
                </div>
              ) : (
                <SelectField
                  name="enrollment.academicYearId"
                  label="Academic Year"
                  placeholder="Select academic year"
                  options={yearOptions}
                  required
                />
              )}
            </div>

            {/* Enrollment Date with range constraints */}
            <div>
              <DateField
                name="enrollment.enrollmentDate"
                label="Enrollment Date"
                required
                min={selectedYear?.startDate}
                max={selectedYear?.endDate}
                helperText={
                  selectedYear
                    ? `Must be within ${selectedYear.startDate} – ${selectedYear.endDate}`
                    : undefined
                }
              />
            </div>
          </div>

          {/* Academic Year Status Feedback */}
          <AnimatePresence>
            {selectedYear && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-3"
              >
                {selectedYear.status === 'active' ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-50 border border-teal-200">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="text-sm text-teal-700">
                      Active academic year — enrollment will be immediately active
                    </span>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ed-Fi Entry Details */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-1">
            Entry Details
          </h3>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mb-4">
            Ed-Fi aligned descriptor fields for state reporting
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <SelectField
              name="enrollment.entryTypeDescriptor"
              label="Entry Type"
              placeholder="Select entry type"
              options={ENTRY_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              helperText="How the student is entering this school"
            />
            <SelectField
              name="enrollment.residencyStatusDescriptor"
              label="Residency Status"
              placeholder="Select residency status"
              options={RESIDENCY_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              helperText="Student's residency relative to the school"
            />
          </div>
        </div>

        {/* Enrollment Settings */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-1">
            Enrollment Settings
          </h3>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mb-4">
            These settings have recommended defaults. Adjust only if needed.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            {/* Primary School toggle */}
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]">
                <input
                  type="checkbox"
                  {...form.register('enrollment.primarySchool')}
                  id="enrollment.primarySchool"
                  className="h-4 w-4 rounded border-[rgb(var(--border-primary))] text-teal-500 focus:ring-teal-500/20"
                />
                <label
                  htmlFor="enrollment.primarySchool"
                  className="text-sm text-[rgb(var(--text-primary))] select-none"
                >
                  Primary School
                </label>
              </div>
              <p className="text-xs text-[rgb(var(--text-tertiary))] pl-1">
                Is this the student's primary school of enrollment?
              </p>
            </div>

            {/* Full-Time Equivalency */}
            <TextField
              name="enrollment.fullTimeEquivalency"
              label="Full-Time Equivalency (FTE)"
              type="number"
              helperText="1.0 = full-time, 0.5 = half-time. Most students are 1.0."
            />

            {/* Repeat Grade toggle */}
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]">
                <input
                  type="checkbox"
                  {...form.register('enrollment.repeatGradeIndicator')}
                  id="enrollment.repeatGradeIndicator"
                  className="h-4 w-4 rounded border-[rgb(var(--border-primary))] text-teal-500 focus:ring-teal-500/20"
                />
                <label
                  htmlFor="enrollment.repeatGradeIndicator"
                  className="text-sm text-[rgb(var(--text-primary))] select-none"
                >
                  Repeat Grade
                </label>
              </div>
              <p className="text-xs text-[rgb(var(--text-tertiary))] pl-1">
                Check if the student is repeating the current grade level
              </p>
            </div>
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
                    required
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
        <div className="rounded-lg bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-secondary))] p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-[rgb(var(--text-tertiary))] shrink-0 mt-0.5" />
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            <span className="font-medium">Auto-populated:</span> School, grade level, and entry grade level descriptor are automatically set based on your school context and Step 1 selections.
          </p>
        </div>
      </div>
    </FormProvider>
  )
}
