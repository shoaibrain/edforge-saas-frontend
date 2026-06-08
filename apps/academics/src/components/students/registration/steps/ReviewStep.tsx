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
  ENROLLMENT_TYPE_OPTIONS,
} from '../../../../schemas/student.form'
import {
  ENTRY_TYPE_OPTIONS,
  RESIDENCY_STATUS_OPTIONS,
} from '../../../../schemas/edfi-descriptors'
import { useAcademicYears } from '../../../../hooks/useSchool'
import { useActiveSchoolId } from '../../../../stores/app.store'
import type { GuardianFormData } from '../../../../schemas/student.form'

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

/** Format a date string (YYYY-MM-DD) to readable format */
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
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
  stepIndex,
  goToStep,
}: {
  title: string
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
        Edit
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
  const { goToStep, isSubmitting } = useWizard()

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
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-[rgb(var(--state-info-fg))] flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Creating student record and enrollment...
        </div>
      )}

      {/* Enrollment Summary Confirmation Card */}
      <div className="rounded-xl border-2 border-teal-200 bg-[rgb(var(--state-info-bg)/0.18)]/50 p-5">
        <h3 className="text-sm font-semibold text-[rgb(var(--state-info-fg))] mb-3">
          What will happen when you click "Create Student"
        </h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] shrink-0 mt-0.5" />
            <span className="text-sm text-[rgb(var(--text-secondary))]">
              A student record will be created for <strong>{display(data.firstName)} {display(data.lastName)}</strong>
            </span>
          </div>
          {hasEnrollment ? (
            <>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] shrink-0 mt-0.5" />
                <span className="text-sm text-[rgb(var(--text-secondary))]">
                  Enrolled in <strong>{academicYearName}</strong> as{' '}
                  <strong>{labelFor(data.currentGradeLevel as string, GRADE_LEVEL_OPTIONS)}</strong>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] shrink-0 mt-0.5" />
                <span className="text-sm text-[rgb(var(--text-secondary))]">
                  Enrollment type: <strong>{labelFor(enrollment.enrollmentType as string, ENROLLMENT_TYPE_OPTIONS)}</strong> — Date: <strong>{formatDate(enrollment.enrollmentDate as string)}</strong>
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-sm text-amber-700">
                No enrollment data — student will be created without enrollment
              </span>
            </div>
          )}
          {guardians.length === 0 && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-sm text-amber-700">
                No guardians added — consider adding at least one guardian
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-3">
        <SectionHeader title="Personal Information" stepIndex={0} goToStep={goToStep} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
          <DataField label="First Name" value={display(data.firstName)} />
          <DataField label="Last Name" value={display(data.lastName)} />
          <DataField label="Middle Name" value={display(data.middleName)} />
          <DataField label="Preferred Name" value={display(data.preferredName)} />
          <DataField label="Suffix" value={display(data.suffix)} />
          <DataField label="Date of Birth" value={formatDate(data.dateOfBirth as string)} />
          <DataField label="Gender" value={labelFor(data.gender as string, GENDER_OPTIONS)} />
          <DataField
            label="Grade Level"
            value={labelFor(data.currentGradeLevel as string, GRADE_LEVEL_OPTIONS)}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        <SectionHeader title="Contact Information" stepIndex={1} goToStep={goToStep} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
          <DataField label="Email" value={display(contactInfo.email)} />
          <DataField label="Phone" value={display(contactInfo.phone)} />
          <DataField label="Phone Type" value={display(contactInfo.phoneType)} />
        </div>
        <DataField label="Physical Address" value={formatAddress(address)} />
        {Boolean(contactInfo.useMailingAddress) && (
          <DataField label="Mailing Address" value={formatAddress(mailingAddress)} />
        )}
      </div>

      {/* Guardians */}
      <div className="space-y-3">
        <SectionHeader title="Guardians" stepIndex={2} goToStep={goToStep} />
        {guardians.length === 0 ? (
          <p className="text-sm text-[rgb(var(--text-tertiary))]">No guardians added</p>
        ) : (
          <div className="space-y-3">
            {guardians.map((g, i) => (
              <div
                key={i}
                className="rounded-lg bg-[rgb(var(--surface-secondary))] p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    {display(g.firstName)} {display(g.lastName)}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-secondary))]">
                    {labelFor(g.relationship, RELATIONSHIP_OPTIONS)}
                  </span>
                  {g.isPrimary && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--text-secondary))] font-medium">
                      Primary
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-[rgb(var(--text-secondary))]">
                  {g.email && <span>Email: {g.email}</span>}
                  {g.phone && <span>Phone: {g.phone}</span>}
                  {g.canPickup && <span>Authorized for pickup</span>}
                  {g.hasPortalAccess && <span>Portal access</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medical / Demographics */}
      <div className="space-y-3">
        <SectionHeader title="Medical & Demographics" stepIndex={3} goToStep={goToStep} />
        <div className="space-y-2">
          <div className="py-1">
            <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Allergies</span>
            <TagList tags={(medicalInfo.allergies as string[]) ?? []} />
          </div>
          <div className="py-1">
            <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Medications</span>
            <TagList tags={(medicalInfo.medications as string[]) ?? []} />
          </div>
          <div className="py-1">
            <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Conditions</span>
            <TagList tags={(medicalInfo.conditions as string[]) ?? []} />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
          <DataField label="Physician" value={display(medicalInfo.physicianName)} />
          <DataField label="Ethnicity" value={display(data.ethnicity)} />
          <DataField label="Primary Language" value={display(data.primaryLanguage)} />
          <DataField label="Home Language" value={display(data.homeLanguage)} />
          <DataField label="Country of Birth" value={display(data.countryOfBirth)} />
        </div>
      </div>

      {/* Enrollment */}
      <div className="space-y-3">
        <SectionHeader title="Enrollment" stepIndex={4} goToStep={goToStep} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
          <DataField
            label="Enrollment Type"
            value={labelFor(enrollment.enrollmentType as string, ENROLLMENT_TYPE_OPTIONS)}
          />
          <DataField
            label="Enrollment Date"
            value={formatDate(enrollment.enrollmentDate as string)}
          />
          <DataField label="Academic Year" value={academicYearName} />

          {/* Ed-Fi Descriptor Fields */}
          <DataField
            label="Entry Type"
            value={labelFor(enrollment.entryTypeDescriptor as string, ENTRY_TYPE_OPTIONS)}
          />
          <DataField
            label="Residency Status"
            value={labelFor(enrollment.residencyStatusDescriptor as string, RESIDENCY_STATUS_OPTIONS)}
          />
          <DataField
            label="Primary School"
            value={enrollment.primarySchool === false ? 'No' : 'Yes'}
          />
          <DataField
            label="Full-Time Equivalency"
            value={enrollment.fullTimeEquivalency != null ? String(enrollment.fullTimeEquivalency) : '1.0'}
          />
          <DataField
            label="Repeat Grade"
            value={enrollment.repeatGradeIndicator ? 'Yes' : 'No'}
          />

          {enrollment.enrollmentType === 'transfer' && (
            <>
              <DataField
                label="Previous School"
                value={display(enrollment.previousSchoolName)}
              />
              <DataField
                label="Previous School Address"
                value={display(enrollment.previousSchoolAddress)}
              />
              <DataField
                label="Transfer Reason"
                value={display(enrollment.transferReason)}
              />
            </>
          )}
          {Boolean(enrollment.notes) && (
            <div className="col-span-full">
              <DataField label="Notes" value={display(enrollment.notes)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
