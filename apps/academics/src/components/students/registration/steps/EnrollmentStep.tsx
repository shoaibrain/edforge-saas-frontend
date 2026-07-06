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
import { useAcademicsI18n } from '../../../../lib/i18n'

const ENTRY_TYPE_LABEL_KEYS: Record<string, string> = {
  'Next year school': 'enrollmentModule.step.entry.entryTypes.nextYearSchool',
  'Transfer from a public school in the same local education agency': 'enrollmentModule.step.entry.entryTypes.transferSameDistrict',
  'Transfer from a public school in a different local education agency in the same state': 'enrollmentModule.step.entry.entryTypes.transferDifferentDistrict',
  'Transfer from a private, non-religiously-affiliated school in the same state': 'enrollmentModule.step.entry.entryTypes.transferPrivateSchool',
  'Re-entry from the same school with no interruption of schooling': 'enrollmentModule.step.entry.entryTypes.reentrySameSchool',
  'Original entry into a United States school': 'enrollmentModule.step.entry.entryTypes.originalEntry',
  'Transfer from a school outside of the country': 'enrollmentModule.step.entry.entryTypes.transferInternational',
}

const RESIDENCY_STATUS_LABEL_KEYS: Record<string, string> = {
  'Resident of administrative unit and target school area': 'enrollmentModule.step.entry.residencyStatuses.adminUnitAndSchoolArea',
  'Resident of administrative unit but not of target school area': 'enrollmentModule.step.entry.residencyStatuses.adminUnitOnly',
  'Resident of this state but not of this administrative unit or school area': 'enrollmentModule.step.entry.residencyStatuses.stateOnly',
  'Not a resident of this state': 'enrollmentModule.step.entry.residencyStatuses.notResident',
}

export function EnrollmentStep({
  data,
  updateData,
  errors,
  clearError,
}: WizardStepProps) {
  const { t } = useAcademicsI18n()
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
      label: `${y.name}${y.isCurrent ? ` (${t('enrollmentModule.step.details.currentSuffix')})` : ''}`,
    }))
  }, [eligibleYears, t])

  const enrollmentTypeOptions = useMemo(
    () =>
      ENROLLMENT_TYPE_OPTIONS.map((o) => ({
        value: o.value,
        label: t(`enrollmentModule.step.type.labels.${o.value}`),
        description:
          o.value === 'new'
            ? t('enrollmentModule.step.type.newDescription')
            : o.value === 'transfer'
              ? t('enrollmentModule.step.type.transferDescription')
              : o.value === 'returning'
                ? t('enrollmentModule.step.type.returningDescription')
                : t('enrollmentModule.step.type.reenrollmentDescription'),
      })),
    [t],
  )
  const entryTypeOptions = useMemo(
    () => ENTRY_TYPE_OPTIONS.map((option) => ({
      value: option.value,
      label: t(ENTRY_TYPE_LABEL_KEYS[option.value], { defaultValue: option.label }),
    })),
    [t],
  )
  const residencyStatusOptions = useMemo(
    () => RESIDENCY_STATUS_OPTIONS.map((option) => ({
      value: option.value,
      label: t(RESIDENCY_STATUS_LABEL_KEYS[option.value], { defaultValue: option.label }),
    })),
    [t],
  )

  const selectedYear = useMemo(() => {
    if (!selectedYearId || !eligibleYears.length) return null
    return eligibleYears.find((y) => y.yearId === selectedYearId) ?? null
  }, [selectedYearId, eligibleYears])

  // Auto-select if only one active year exists.
  // P4 / T1.5 — `shouldDirty: true` marks the field as user-touched so
  // RHF's watch subscription syncs it through to the wizard's
  // formDataRef on the next tick. Without this flag, the auto-select
  // could land before the watcher subscribed (race during initial
  // mount) and the wizard's view of the field stayed empty — a known
  // path into the "Please select an academic year" heisenbug.
  useEffect(() => {
    if (!selectedYearId && eligibleYears.length > 0) {
      const activeYears = eligibleYears.filter((y) => y.status === 'active')
      if (activeYears.length === 1) {
        form.setValue('enrollment.academicYearId', activeYears[0].yearId, {
          shouldDirty: true,
        })
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
          <div className="flex items-start gap-3 rounded-lg p-3 bg-[rgb(var(--state-danger-bg))] border border-[rgb(var(--state-danger-border))]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[rgb(var(--state-danger-fg))]" />
            <div>
              <p className="text-xs font-medium text-[rgb(var(--state-danger-fg))]">
                {t('enrollmentModule.step.details.noActiveYearTitle')}
              </p>
              <p className="text-2xs text-[rgb(var(--text-secondary))] mt-0.5">
                {t('enrollmentModule.step.details.noActiveYearDescription')}
              </p>
            </div>
          </div>
        )}

        {/* Enrollment Type */}
        <CollapsibleSection
          id="enrollment-type"
          icon={ClipboardList}
          title={t('enrollmentModule.step.type.title')}
          description={t('enrollmentModule.step.type.description')}
          fields={['enrollment.enrollmentType']}
          defaultExpanded
        >
          <RadioGroupField
            name="enrollment.enrollmentType"
            options={enrollmentTypeOptions}
            direction="horizontal"
            optionsClassName="grid grid-cols-2 gap-4"
          />
        </CollapsibleSection>

        {/* Enrollment Details */}
        <CollapsibleSection
          id="enrollment-details"
          icon={CalendarDays}
          title={t('enrollmentModule.step.details.title')}
          description={t('enrollmentModule.step.details.description')}
          fields={['enrollment.academicYearId', 'enrollment.enrollmentDate']}
          defaultExpanded
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Academic Year dropdown */}
            <div>
              {yearsLoading ? (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
                    {t('enrollmentModule.step.details.academicYear')} *
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-tertiary))]">
                    <Loader2 className="w-4 h-4 animate-spin text-[rgb(var(--text-tertiary))]" />
                    <span className="text-xs text-[rgb(var(--text-tertiary))]">{t('enrollmentModule.step.details.loadingYears')}</span>
                  </div>
                </div>
              ) : yearsError ? (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[rgb(var(--state-danger-fg))]">
                    {t('enrollmentModule.step.details.academicYear')} *
                  </label>
                  <div className="px-3 py-2.5 rounded-lg text-xs border border-[rgb(var(--state-danger-border))] bg-[rgb(var(--state-danger-bg))] text-[rgb(var(--state-danger-fg))]">
                    {t('enrollmentModule.step.details.failedYears')}
                  </div>
                </div>
              ) : (
                <SelectField
                  name="enrollment.academicYearId"
                  label={t('enrollmentModule.step.details.academicYear')}
                  placeholder={t('enrollmentModule.step.details.selectAcademicYear')}
                  options={yearOptions}
                  required
                />
              )}
            </div>

            <div>
              <DateField
                name="enrollment.enrollmentDate"
                label={t('enrollmentModule.step.details.enrollmentDate')}
                required
                min={selectedYear?.startDate}
                max={selectedYear?.endDate}
                helperText={
                  selectedYear
                    ? t('enrollmentModule.step.details.dateRange', { start: selectedYear.startDate, end: selectedYear.endDate })
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
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgb(var(--state-success-bg))] border border-[rgb(var(--state-success-border))]">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[rgb(var(--accent-enrollment-text))]" />
                    <span className="text-xs text-[rgb(var(--accent-enrollment-text))]">
                      {t('enrollmentModule.step.details.activeYear')}
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
          title={t('enrollmentModule.step.entry.title')}
          description={t('enrollmentModule.step.entry.description')}
          fields={['enrollment.entryTypeDescriptor', 'enrollment.residencyStatusDescriptor']}
          defaultExpanded={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <SelectField
              name="enrollment.entryTypeDescriptor"
              label={t('enrollmentModule.step.entry.entryType')}
              placeholder={t('enrollmentModule.step.entry.selectEntryType')}
              options={entryTypeOptions}
              helperText={t('enrollmentModule.step.entry.entryTypeHelp')}
            />
            <SelectField
              name="enrollment.residencyStatusDescriptor"
              label={t('enrollmentModule.step.entry.residencyStatus')}
              placeholder={t('enrollmentModule.step.entry.selectResidencyStatus')}
              options={residencyStatusOptions}
              helperText={t('enrollmentModule.step.entry.residencyHelp')}
            />
          </div>
        </CollapsibleSection>

        {/* Enrollment Settings */}
        <CollapsibleSection
          id="enrollment-settings"
          icon={Settings}
          title={t('enrollmentModule.step.settings.title')}
          description={t('enrollmentModule.step.settings.description')}
          fields={['enrollment.primarySchool', 'enrollment.fullTimeEquivalency', 'enrollment.repeatGradeIndicator']}
          defaultExpanded={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-tertiary))]">
                <input
                  type="checkbox"
                  {...form.register('enrollment.primarySchool')}
                  id="enrollment.primarySchool"
                  className="h-4 w-4 rounded"
                />
                <label
                  htmlFor="enrollment.primarySchool"
                  className="text-sm select-none text-[rgb(var(--text-primary))]"
                >
                  {t('enrollmentModule.step.settings.primarySchool')}
                </label>
              </div>
              <p className="text-3xs text-[rgb(var(--text-tertiary))] ps-1">
                {t('enrollmentModule.step.settings.primarySchoolHelp')}
              </p>
            </div>

            <TextField
              name="enrollment.fullTimeEquivalency"
              label={t('enrollmentModule.step.settings.fte')}
              type="number"
              helperText={t('enrollmentModule.step.settings.fteHelp')}
            />

            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-tertiary))]">
                <input
                  type="checkbox"
                  {...form.register('enrollment.repeatGradeIndicator')}
                  id="enrollment.repeatGradeIndicator"
                  className="h-4 w-4 rounded"
                />
                <label
                  htmlFor="enrollment.repeatGradeIndicator"
                  className="text-sm select-none text-[rgb(var(--text-primary))]"
                >
                  {t('enrollmentModule.step.settings.repeatGrade')}
                </label>
              </div>
              <p className="text-3xs text-[rgb(var(--text-tertiary))] ps-1">
                {t('enrollmentModule.step.settings.repeatGradeHelp')}
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
                title={t('enrollmentModule.step.transfer.title')}
                description={t('enrollmentModule.step.transfer.description')}
                fields={['enrollment.previousSchoolName', 'enrollment.previousSchoolAddress', 'enrollment.transferReason']}
                defaultExpanded
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <TextField
                      name="enrollment.previousSchoolName"
                      label={t('enrollmentModule.step.transfer.previousSchool')}
                      placeholder={t('enrollmentModule.step.transfer.previousSchoolPlaceholder')}
                      required
                    />
                    <TextField
                      name="enrollment.previousSchoolAddress"
                      label={t('enrollmentModule.step.transfer.previousAddress')}
                      placeholder={t('enrollmentModule.step.transfer.previousAddressPlaceholder')}
                    />
                  </div>
                  <TextareaField
                    name="enrollment.transferReason"
                    label={t('enrollmentModule.step.transfer.reason')}
                    placeholder={t('enrollmentModule.step.transfer.reasonPlaceholder')}
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
          title={t('enrollmentModule.step.notes.title')}
          description={t('enrollmentModule.step.notes.description')}
          fields={['enrollment.notes']}
          defaultExpanded={false}
        >
          <TextareaField
            name="enrollment.notes"
            label={t('enrollmentModule.step.notes.label')}
            placeholder={t('enrollmentModule.step.notes.placeholder')}
            rows={3}
            maxLength={2000}
            showCharCount
          />
        </CollapsibleSection>

        {/* Auto-populated Info */}
        <div className="flex items-start gap-3 rounded-lg p-3 bg-[rgb(var(--background-tertiary)/0.5)] border border-[rgb(var(--border-primary)/0.35)]">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[rgb(var(--text-tertiary))]" />
          <p className="text-2xs text-[rgb(var(--text-tertiary))]">
            <span className="font-medium">{t('enrollmentModule.step.auto.label')}</span> {t('enrollmentModule.step.auto.description')}
          </p>
        </div>
      </div>
    </FormProvider>
  )
}
