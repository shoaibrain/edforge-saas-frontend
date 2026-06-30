/**
 * Review & Submit Step
 *
 * Final step of the student registration wizard.
 * Displays a read-only summary of all entered data with
 * "Edit" links that jump back to the relevant step.
 *
 * Sprint Alaska changes:
 * - Resolves academicYearId to year name (AK-2.6)
 * - Displays Ed-Fi descriptor fields (AK-2.6)
 * - Enrollment summary confirmation card (AK-4.2)
 */

import { useMemo } from 'react'
import { useWizard } from '@edforge/wizard'
import type { WizardStepProps } from '@edforge/wizard'
import { Edit2, CheckCircle2, AlertTriangle } from 'lucide-react'
import {
  GENDER_OPTIONS,
  GRADE_LEVEL_OPTIONS,
  RELATIONSHIP_OPTIONS,
  PHONE_TYPE_OPTIONS,
  ENROLLMENT_TYPE_OPTIONS,
} from '../../../../schemas/student.form'
import {
  ENTRY_TYPE_OPTIONS,
  RESIDENCY_STATUS_OPTIONS,
} from '../../../../schemas/edfi-descriptors'
import { useAcademicYears } from '../../../../hooks/useSchool'
import { useActiveSchoolId } from '../../../../stores/app.store'
import type { GuardianFormData } from '../../../../schemas/student.form'
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

const ETHNICITY_LABEL_KEYS: Record<string, string> = {
  american_indian: 'enrollmentModule.step.medical.ethnicityOptions.americanIndian',
  asian: 'enrollmentModule.step.medical.ethnicityOptions.asian',
  black: 'enrollmentModule.step.medical.ethnicityOptions.black',
  hispanic: 'enrollmentModule.step.medical.ethnicityOptions.hispanic',
  native_hawaiian: 'enrollmentModule.step.medical.ethnicityOptions.nativeHawaiian',
  white: 'enrollmentModule.step.medical.ethnicityOptions.white',
  two_or_more: 'enrollmentModule.step.medical.ethnicityOptions.twoOrMore',
  prefer_not_to_say: 'enrollmentModule.step.medical.ethnicityOptions.preferNotToSay',
}

const LANGUAGE_LABEL_KEYS: Record<string, string> = {
  English: 'enrollmentModule.step.medical.languageOptions.english',
  Spanish: 'enrollmentModule.step.medical.languageOptions.spanish',
  Mandarin: 'enrollmentModule.step.medical.languageOptions.mandarin',
  French: 'enrollmentModule.step.medical.languageOptions.french',
  Arabic: 'enrollmentModule.step.medical.languageOptions.arabic',
  Hindi: 'enrollmentModule.step.medical.languageOptions.hindi',
  Portuguese: 'enrollmentModule.step.medical.languageOptions.portuguese',
  Vietnamese: 'enrollmentModule.step.medical.languageOptions.vietnamese',
  Korean: 'enrollmentModule.step.medical.languageOptions.korean',
  Tagalog: 'enrollmentModule.step.medical.languageOptions.tagalog',
  Other: 'enrollmentModule.step.medical.languageOptions.other',
}

// ============================================================================
// HELPERS
// ============================================================================

/** Display a value with fallback */
function display(val: unknown, fallback = '—'): string {
  if (val === undefined || val === null || val === '') return fallback
  return String(val)
}

/** Lookup label from options */
function labelFor(
  value: string | undefined,
  options: readonly { value: string; label: string }[]
): string {
  if (!value) return '—'
  return options.find((o) => o.value === value)?.label ?? value
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2">
      <dt className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-[rgb(var(--text-primary))]">{value}</dd>
    </div>
  )
}

function SectionHeader({
  title,
  editLabel,
  stepIndex,
  goToStep,
}: {
  title: string
  editLabel: string
  stepIndex: number
  goToStep: (index: number) => void
}) {
  return (
    <div className="flex items-center justify-between pb-2 border-b border-[rgb(var(--border-secondary))]">
      <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider">
        {title}
      </h3>
      <button
        type="button"
        onClick={() => goToStep(stepIndex)}
        className="flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--text-primary))] transition-colors"
      >
        <Edit2 className="w-3 h-3" />
        {editLabel}
      </button>
    </div>
  )
}

function TagList({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return <span className="text-sm text-[rgb(var(--text-tertiary))]">—</span>
  return (
    <div className="flex flex-wrap gap-1.5 mt-0.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex px-2 py-0.5 rounded-md bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--text-secondary))] text-xs font-medium"
        >
          {tag}
        </span>
      ))}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ReviewStep({ data }: WizardStepProps) {
  const { t, formatDate } = useAcademicsI18n()
  const { goToStep, isSubmitting } = useWizard()
  const genderOptions = useMemo(
    () => GENDER_OPTIONS.map((option) => ({ value: option.value, label: t(`gender.${option.value}`) })),
    [t],
  )
  const relationshipOptions = useMemo(
    () => RELATIONSHIP_OPTIONS.map((option) => ({
      value: option.value,
      label: t(`relationships.${option.value === 'guardian' ? 'legalGuardian' : option.value}`),
    })),
    [t],
  )
  const phoneTypeOptions = useMemo(
    () => PHONE_TYPE_OPTIONS.map((option) => ({
      value: option.value,
      label: t(`enrollmentModule.step.contact.phoneTypes.${option.value}`),
    })),
    [t],
  )
  const enrollmentTypeOptions = useMemo(
    () => ENROLLMENT_TYPE_OPTIONS.map((option) => ({
      value: option.value,
      label: t(`enrollmentModule.step.type.labels.${option.value}`),
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
  const ethnicityOptions = useMemo(
    () => Object.entries(ETHNICITY_LABEL_KEYS).map(([value, labelKey]) => ({
      value,
      label: t(labelKey),
    })),
    [t],
  )
  const languageOptions = useMemo(
    () => Object.entries(LANGUAGE_LABEL_KEYS).map(([value, labelKey]) => ({
      value,
      label: t(labelKey),
    })),
    [t],
  )

  const contactInfo = (data.contactInfo as Record<string, unknown> | undefined) ?? {}
  const address = (contactInfo.address as Record<string, unknown> | undefined) ?? {}
  const mailingAddress = (contactInfo.mailingAddress as Record<string, unknown> | undefined) ?? {}
  const medicalInfo = (data.medicalInfo as Record<string, unknown> | undefined) ?? {}
  const enrollment = (data.enrollment as Record<string, unknown> | undefined) ?? {}
  const guardians = (data.guardians as GuardianFormData[] | undefined) ?? []

  // Resolve academic year name
  const schoolId = useActiveSchoolId()
  const { data: academicYears } = useAcademicYears(schoolId || '', !!schoolId)
  const academicYearName = useMemo(() => {
    const yearId = enrollment.academicYearId as string
    if (!yearId || !academicYears) return '—'
    const year = academicYears.find((y) => y.yearId === yearId)
    return year?.name ?? yearId
  }, [enrollment.academicYearId, academicYears])

  const formatAddress = (addr: Record<string, unknown>): string => {
    const parts = [
      addr.street1,
      addr.street2,
      addr.city,
      addr.state,
      addr.zipCode || addr.postalCode,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : '—'
  }

  // Enrollment summary for the confirmation card
  const hasEnrollment = Boolean(enrollment.academicYearId && enrollment.enrollmentDate)

  return (
    <div className="space-y-8">
      {isSubmitting && (
        <div className="rounded-lg bg-[rgb(var(--state-info-bg)/0.18)] border border-[rgb(var(--state-info-border)/0.35)] p-4 text-sm text-[rgb(var(--state-info-fg))] flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-[rgb(var(--state-info-border))] border-t-transparent rounded-full animate-spin" />
          {t('enrollmentModule.step.review.creating')}
        </div>
      )}

      {/* Enrollment Summary Confirmation Card */}
      <div className="rounded-xl border-2 border-[rgb(var(--state-info-border)/0.35)] bg-[rgb(var(--state-info-bg)/0.18)]/50 p-5">
        <h3 className="text-sm font-semibold text-[rgb(var(--state-info-fg))] mb-3">
          {t('enrollmentModule.step.review.whatWillHappen')}
        </h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] shrink-0 mt-0.5" />
            <span className="text-sm text-[rgb(var(--text-secondary))]">
              {t('enrollmentModule.step.review.studentRecordCreated', { studentName: `${display(data.firstName)} ${display(data.lastName)}` })}
            </span>
          </div>
          {hasEnrollment ? (
            <>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] shrink-0 mt-0.5" />
                <span className="text-sm text-[rgb(var(--text-secondary))]">
                  {t('enrollmentModule.step.review.enrolledIn', {
                    academicYear: academicYearName,
                    gradeLevel: labelFor(data.currentGradeLevel as string, GRADE_LEVEL_OPTIONS),
                  })}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] shrink-0 mt-0.5" />
                <span className="text-sm text-[rgb(var(--text-secondary))]">
                  {t('enrollmentModule.step.review.enrollmentTypeDate', {
                    type: labelFor(enrollment.enrollmentType as string, enrollmentTypeOptions),
                    date: formatDate(enrollment.enrollmentDate as string, { year: 'numeric', month: 'long', day: 'numeric' }),
                  })}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-sm text-amber-700">
                {t('enrollmentModule.step.review.noEnrollment')}
              </span>
            </div>
          )}
          {guardians.length === 0 && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-sm text-amber-700">
                {t('enrollmentModule.step.review.noGuardiansWarning')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-3">
        <SectionHeader title={t('enrollmentModule.step.review.personalInfo')} editLabel={t('enrollmentModule.step.review.edit')} stepIndex={0} goToStep={goToStep} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
          <DataField label={t('fields.firstName')} value={display(data.firstName)} />
          <DataField label={t('fields.lastName')} value={display(data.lastName)} />
          <DataField label={t('fields.middleName')} value={display(data.middleName)} />
          <DataField label={t('enrollmentModule.step.personal.preferredName')} value={display(data.preferredName)} />
          <DataField label={t('enrollmentModule.step.personal.suffix')} value={display(data.suffix)} />
          <DataField label={t('fields.dateOfBirth')} value={formatDate(data.dateOfBirth as string, { year: 'numeric', month: 'long', day: 'numeric' })} />
          <DataField label={t('fields.gender')} value={labelFor(data.gender as string, genderOptions)} />
          <DataField
            label={t('fields.gradeLevel')}
            value={labelFor(data.currentGradeLevel as string, GRADE_LEVEL_OPTIONS)}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        <SectionHeader title={t('enrollmentModule.step.review.contactInfo')} editLabel={t('enrollmentModule.step.review.edit')} stepIndex={1} goToStep={goToStep} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
          <DataField label={t('fields.email')} value={display(contactInfo.email)} />
          <DataField label={t('fields.phone')} value={display(contactInfo.phone)} />
          <DataField label={t('enrollmentModule.step.contact.phoneType')} value={labelFor(contactInfo.phoneType as string, phoneTypeOptions)} />
        </div>
        <DataField label={t('enrollmentModule.step.contact.physicalAddress')} value={formatAddress(address)} />
        {Boolean(contactInfo.useMailingAddress) && (
          <DataField label={t('enrollmentModule.step.contact.mailingAddress')} value={formatAddress(mailingAddress)} />
        )}
      </div>

      {/* Guardians */}
      <div className="space-y-3">
        <SectionHeader title={t('enrollmentModule.wizard.steps.guardians.title')} editLabel={t('enrollmentModule.step.review.edit')} stepIndex={2} goToStep={goToStep} />
        {guardians.length === 0 ? (
          <p className="text-sm text-[rgb(var(--text-tertiary))]">{t('enrollmentModule.step.review.noGuardians')}</p>
        ) : (
          <div className="space-y-3">
            {guardians.map((g, i) => (
              <div
                key={i}
                className="rounded-lg bg-[rgb(var(--background-secondary))] p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    {display(g.firstName)} {display(g.lastName)}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[rgb(var(--background-primary))] text-[rgb(var(--text-secondary))]">
                    {labelFor(g.relationship, relationshipOptions)}
                  </span>
                  {g.isPrimary && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--text-secondary))] font-medium">
                      {t('enrollmentModule.step.review.primary')}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-[rgb(var(--text-secondary))]">
                  {g.email && <span>{t('enrollmentModule.step.review.emailValue', { email: g.email })}</span>}
                  {g.phone && <span>{t('enrollmentModule.step.review.phoneValue', { phone: g.phone })}</span>}
                  {g.canPickup && <span>{t('enrollmentModule.step.review.authorizedPickup')}</span>}
                  {g.hasPortalAccess && <span>{t('enrollmentModule.step.review.portalAccess')}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medical / Demographics */}
      <div className="space-y-3">
        <SectionHeader title={t('enrollmentModule.step.review.medicalDemographics')} editLabel={t('enrollmentModule.step.review.edit')} stepIndex={3} goToStep={goToStep} />
        <div className="space-y-2">
          <div className="py-1">
            <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">{t('enrollmentModule.step.review.allergies')}</span>
            <TagList tags={(medicalInfo.allergies as string[]) ?? []} />
          </div>
          <div className="py-1">
            <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">{t('enrollmentModule.step.review.medications')}</span>
            <TagList tags={(medicalInfo.medications as string[]) ?? []} />
          </div>
          <div className="py-1">
            <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">{t('enrollmentModule.step.review.conditions')}</span>
            <TagList tags={(medicalInfo.conditions as string[]) ?? []} />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
          <DataField label={t('enrollmentModule.step.review.physician')} value={display(medicalInfo.physicianName)} />
          <DataField label={t('fields.ethnicity')} value={labelFor(data.ethnicity as string, ethnicityOptions)} />
          <DataField label={t('fields.primaryLanguage')} value={labelFor(data.primaryLanguage as string, languageOptions)} />
          <DataField label={t('fields.homeLanguage')} value={labelFor(data.homeLanguage as string, languageOptions)} />
          <DataField label={t('fields.countryOfBirth')} value={display(data.countryOfBirth)} />
        </div>
      </div>

      {/* Enrollment */}
      <div className="space-y-3">
        <SectionHeader title={t('enrollmentModule.wizard.steps.enrollment.title')} editLabel={t('enrollmentModule.step.review.edit')} stepIndex={4} goToStep={goToStep} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
          <DataField
            label={t('enrollmentModule.step.type.title')}
            value={labelFor(enrollment.enrollmentType as string, enrollmentTypeOptions)}
          />
          <DataField
            label={t('enrollmentModule.step.details.enrollmentDate')}
            value={formatDate(enrollment.enrollmentDate as string, { year: 'numeric', month: 'long', day: 'numeric' })}
          />
          <DataField label={t('enrollmentModule.step.details.academicYear')} value={academicYearName} />

          {/* Ed-Fi Descriptor Fields */}
          <DataField
            label={t('enrollmentModule.step.entry.entryType')}
            value={labelFor(enrollment.entryTypeDescriptor as string, entryTypeOptions)}
          />
          <DataField
            label={t('enrollmentModule.step.entry.residencyStatus')}
            value={labelFor(enrollment.residencyStatusDescriptor as string, residencyStatusOptions)}
          />
          <DataField
            label={t('enrollmentModule.step.settings.primarySchool')}
            value={enrollment.primarySchool === false ? t('yesNo.no') : t('yesNo.yes')}
          />
          <DataField
            label={t('enrollmentModule.step.review.fullTimeEquivalency')}
            value={enrollment.fullTimeEquivalency != null ? String(enrollment.fullTimeEquivalency) : '1.0'}
          />
          <DataField
            label={t('enrollmentModule.step.settings.repeatGrade')}
            value={enrollment.repeatGradeIndicator ? t('yesNo.yes') : t('yesNo.no')}
          />

          {enrollment.enrollmentType === 'transfer' && (
            <>
              <DataField
                label={t('enrollmentModule.step.transfer.previousSchool')}
                value={display(enrollment.previousSchoolName)}
              />
              <DataField
                label={t('enrollmentModule.step.transfer.previousAddress')}
                value={display(enrollment.previousSchoolAddress)}
              />
              <DataField
                label={t('enrollmentModule.step.review.transferReason')}
                value={display(enrollment.transferReason)}
              />
            </>
          )}
          {Boolean(enrollment.notes) && (
            <div className="col-span-full">
              <DataField label={t('enrollmentModule.step.notes.label')} value={display(enrollment.notes)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
