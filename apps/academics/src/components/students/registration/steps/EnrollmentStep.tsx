/**
 * Enrollment Step — V2
 *
 * Fifth step of the student registration wizard.
 * Collects enrollment type, date, academic year selection,
 * Ed-Fi descriptor fields, and transfer-specific fields.
 *
 * V2: Collapsible sections with icons, titles, and completion indicators.
 * Required sections expanded by default; optional sections collapsed.
 */

import { useEffect, useMemo } from 'react'
import { FormProvider } from 'react-hook-form'
import { TextField, DateField, RadioGroupField, SelectField, TextareaField } from '@edforge/forms'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  ClipboardList,
  CalendarDays,
  FileText,
  Settings,
  ArrowRightLeft,
  MessageSquare,
} from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import { useWizardForm } from '../../../../hooks/useWizardForm'
import { useAcademicYears } from '../../../../hooks/useSchool'
import { useActiveSchoolId } from '../../../../stores/app.store'
import { ENROLLMENT_TYPE_OPTIONS } from '../../../../schemas/student.form'
import {
  ENTRY_TYPE_OPTIONS,
  RESIDENCY_STATUS_OPTIONS,
} from '../../../../schemas/edfi-descriptors'
import { CollapsibleSection } from '../CollapsibleSection'

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

  // Auto-populate enrollment date
  useEffect(() => {
    if (selectedYear) {
      const currentDate = form.getValues('enrollment.enrollmentDate') as string
      if (!currentDate) {
        const today = new Date().toISOString().split('T')[0]
        const inRange = today >= selectedYear.startDate && today <= selectedYear.endDate
        form.setValue(
          'enrollment.enrollmentDate',
          inRange ? today : selectedYear.startDate
        )
      } else if (currentDate < selectedYear.startDate || currentDate > selectedYear.endDate) {
        form.setValue('enrollment.enrollmentDate', selectedYear.startDate)
      }
    }
  }, [selectedYear, form])

  const noActiveYear = !yearsLoading && eligibleYears.length === 0

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        {/* No active academic year blocking message */}
        {noActiveYear && (
          <div
            className="flex items-start gap-3 rounded-lg p-3"
            style={{
              background: 'var(--v2-danger-bg)',
              border: '1px solid var(--v2-danger-border)',
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--v2-danger)' }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--v2-danger)' }}>
                No active academic year available
              </p>
              <p style={{ fontSize: 11, color: 'var(--v2-text-secondary)', marginTop: 2 }}>
                Please configure and activate an academic year in School Settings before enrolling students.
              </p>
            </div>
          </div>
        )}

        {/* Enrollment Type */}
        <CollapsibleSection
          id="enrollment-type"
          icon={ClipboardList}
          title="Enrollment Type"
          description="How the student is enrolling"
          fields={['enrollment.enrollmentType']}
          defaultExpanded
        >
          <RadioGroupField
            name="enrollment.enrollmentType"
            options={ENROLLMENT_TYPE_RADIO}
            direction="horizontal"
            optionsClassName="grid grid-cols-2 gap-4"
          />
        </CollapsibleSection>

        {/* Enrollment Details */}
        <CollapsibleSection
          id="enrollment-details"
          icon={CalendarDays}
          title="Enrollment Details"
          description="Academic year and enrollment date"
          fields={['enrollment.academicYearId', 'enrollment.enrollmentDate']}
          defaultExpanded
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Academic Year dropdown */}
            <div>
              {yearsLoading ? (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium" style={{ color: 'var(--v2-text-secondary)' }}>
                    Academic Year *
                  </label>
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                    style={{
                      border: '1px solid var(--v2-border-default)',
                      background: 'rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--v2-text-hint)' }} />
                    <span style={{ fontSize: 12, color: 'var(--v2-text-hint)' }}>Loading academic years...</span>
                  </div>
                </div>
              ) : yearsError ? (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium" style={{ color: 'var(--v2-danger)' }}>
                    Academic Year *
                  </label>
                  <div
                    className="px-3 py-2.5 rounded-lg"
                    style={{
                      border: '1px solid var(--v2-danger-border)',
                      background: 'var(--v2-danger-bg)',
                      fontSize: 12,
                      color: 'var(--v2-danger)',
                    }}
                  >
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
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: 'var(--v2-success-bg)',
                      border: '1px solid var(--v2-success-border)',
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#1D9E75' }} />
                    <span style={{ fontSize: 12, color: '#1D9E75' }}>
                      Active academic year — enrollment will be immediately active
                    </span>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleSection>

        {/* Entry Details */}
        <CollapsibleSection
          id="enrollment-entry"
          icon={FileText}
          title="Entry Details"
          description="Ed-Fi descriptor fields for state reporting"
          fields={['enrollment.entryTypeDescriptor', 'enrollment.residencyStatusDescriptor']}
          defaultExpanded={false}
        >
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
        </CollapsibleSection>

        {/* Enrollment Settings */}
        <CollapsibleSection
          id="enrollment-settings"
          icon={Settings}
          title="Enrollment Settings"
          description="Defaults are pre-configured — adjust only if needed"
          fields={['enrollment.primarySchool', 'enrollment.fullTimeEquivalency', 'enrollment.repeatGradeIndicator']}
          defaultExpanded={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div className="space-y-1">
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{
                  border: '1px solid var(--v2-border-default)',
                  background: 'rgba(255, 255, 255, 0.04)',
                }}
              >
                <input
                  type="checkbox"
                  {...form.register('enrollment.primarySchool')}
                  id="enrollment.primarySchool"
                  className="h-4 w-4 rounded"
                />
                <label
                  htmlFor="enrollment.primarySchool"
                  className="text-sm select-none"
                  style={{ color: 'var(--v2-text-primary)' }}
                >
                  Primary School
                </label>
              </div>
              <p style={{ fontSize: 10, color: 'var(--v2-text-hint)', paddingLeft: 4 }}>
                Is this the student's primary school of enrollment?
              </p>
            </div>

            <TextField
              name="enrollment.fullTimeEquivalency"
              label="Full-Time Equivalency (FTE)"
              type="number"
              helperText="1.0 = full-time, 0.5 = half-time"
            />

            <div className="space-y-1">
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{
                  border: '1px solid var(--v2-border-default)',
                  background: 'rgba(255, 255, 255, 0.04)',
                }}
              >
                <input
                  type="checkbox"
                  {...form.register('enrollment.repeatGradeIndicator')}
                  id="enrollment.repeatGradeIndicator"
                  className="h-4 w-4 rounded"
                />
                <label
                  htmlFor="enrollment.repeatGradeIndicator"
                  className="text-sm select-none"
                  style={{ color: 'var(--v2-text-primary)' }}
                >
                  Repeat Grade
                </label>
              </div>
              <p style={{ fontSize: 10, color: 'var(--v2-text-hint)', paddingLeft: 4 }}>
                Check if the student is repeating the current grade level
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Transfer Information (conditional) */}
        <AnimatePresence>
          {enrollmentType === 'transfer' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <CollapsibleSection
                id="enrollment-transfer"
                icon={ArrowRightLeft}
                title="Transfer Information"
                description="Details about the previous school"
                fields={['enrollment.previousSchoolName', 'enrollment.previousSchoolAddress', 'enrollment.transferReason']}
                defaultExpanded
              >
                <div className="space-y-4">
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
              </CollapsibleSection>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Additional Notes */}
        <CollapsibleSection
          id="enrollment-notes"
          icon={MessageSquare}
          title="Additional Notes"
          description="Optional notes about this enrollment"
          fields={['enrollment.notes']}
          defaultExpanded={false}
        >
          <TextareaField
            name="enrollment.notes"
            label="Notes"
            placeholder="Any additional notes about this enrollment..."
            rows={3}
            maxLength={2000}
            showCharCount
          />
        </CollapsibleSection>

        {/* Auto-populated Info */}
        <div
          className="flex items-start gap-3 rounded-lg p-3"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--v2-border-default)',
          }}
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--v2-text-hint)' }} />
          <p style={{ fontSize: 11, color: 'var(--v2-text-muted)' }}>
            <span className="font-medium">Auto-populated:</span> School, grade level, and entry grade level descriptor are automatically set based on your school context and Step 1 selections.
          </p>
        </div>
      </div>
    </FormProvider>
  )
}
