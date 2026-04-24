/**
 * DemographicsTab — Student Detail Sprint 3 S3.6
 *
 * Read-only view of the eight Ed-Fi descriptor fields that Sprint 3 added to
 * the Student entity:
 *   - sexDescriptor / languageDescriptor / motherTongueDescriptor
 *   - disabilities[] (array of { descriptor, notes })
 *   - ethnicityDescriptor (URI-shape only in V1; catalog lands in Sprint 6)
 *   - isTransferred, belowPovertyLine, scholarshipCategory
 *
 * For legacy students that only have the pre-Sprint-3 `gender` / `primaryLanguage`
 * / `homeLanguage` fields populated, we auto-derive the descriptor URIs via
 * `deriveDescriptorsFromLegacy` and flag them with a "Derived — click to
 * confirm" badge so the admin knows to save the definitive value.
 *
 * Editing routes through `EditDemographicsModal` → PATCH
 * /academics/students/:id/descriptors → backend emits a
 * `student.descriptor.edited` audit event (S3.7).
 */

import { useMemo, useState } from 'react'
import { Pencil, AlertTriangle } from 'lucide-react'
import {
  getDisplayName,
  deriveDescriptorsFromLegacy,
  type DescriptorLocale,
  type StudentProfileResponseDto,
} from '@aibrains/shared-types'
import { EditDemographicsModal } from './EditDemographicsModal'

// ============================================================================
// TYPES
// ============================================================================

export interface DemographicsTabProps {
  student: StudentProfileResponseDto
  canEdit?: boolean
  /** Display locale for descriptor labels. Defaults to 'en'; pass 'ne-NP' for Nepali. */
  locale?: DescriptorLocale
}

type DescriptorDisplay =
  | { kind: 'set'; value: string; label: string }
  | { kind: 'derived'; value: string; label: string }
  | { kind: 'unset' }

// ============================================================================
// HELPERS
// ============================================================================

function descriptorDisplay(
  liveValue: string | undefined,
  derivedValue: string | undefined,
  locale: DescriptorLocale,
): DescriptorDisplay {
  if (liveValue) {
    return { kind: 'set', value: liveValue, label: getDisplayName(liveValue, locale) }
  }
  if (derivedValue) {
    return { kind: 'derived', value: derivedValue, label: getDisplayName(derivedValue, locale) }
  }
  return { kind: 'unset' }
}

// ============================================================================
// SMALL VISUAL BITS
// ============================================================================

function FieldRow({
  label,
  display,
}: {
  label: string
  display: DescriptorDisplay
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[rgb(var(--border-primary))] last:border-0">
      <span className="text-sm text-[rgb(var(--text-tertiary))] min-w-[160px]">{label}</span>
      <div className="flex-1 text-right">
        {display.kind === 'unset' && (
          <span className="text-sm italic text-[rgb(var(--text-tertiary))]">Not specified</span>
        )}
        {display.kind === 'set' && (
          <span className="text-sm text-[rgb(var(--text-primary))]">{display.label}</span>
        )}
        {display.kind === 'derived' && (
          <div className="inline-flex flex-col items-end gap-0.5">
            <span className="text-sm text-[rgb(var(--text-secondary))]">{display.label}</span>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              data-testid="derived-badge"
            >
              <AlertTriangle className="w-2.5 h-2.5" aria-hidden />
              Derived — click Edit to confirm
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function BooleanRow({ label, value }: { label: string; value: boolean | undefined }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-[rgb(var(--border-primary))] last:border-0">
      <span className="text-sm text-[rgb(var(--text-tertiary))] min-w-[160px]">{label}</span>
      {value === true && (
        <span className="text-sm font-medium text-[#1D9E75]">Yes</span>
      )}
      {value === false && (
        <span className="text-sm text-[rgb(var(--text-primary))]">No</span>
      )}
      {value === undefined && (
        <span className="text-sm italic text-[rgb(var(--text-tertiary))]">Not specified</span>
      )}
    </div>
  )
}

function TextRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[rgb(var(--border-primary))] last:border-0">
      <span className="text-sm text-[rgb(var(--text-tertiary))] min-w-[160px]">{label}</span>
      {value ? (
        <span className="text-sm text-[rgb(var(--text-primary))] text-right">{value}</span>
      ) : (
        <span className="text-sm italic text-[rgb(var(--text-tertiary))]">Not specified</span>
      )}
    </div>
  )
}

function DisabilitiesBlock({
  disabilities,
  locale,
}: {
  disabilities: Array<{ descriptor: string; notes?: string }> | undefined
  locale: DescriptorLocale
}) {
  if (!disabilities || disabilities.length === 0) {
    return (
      <div className="py-2.5 text-sm italic text-[rgb(var(--text-tertiary))]">
        No disabilities recorded
      </div>
    )
  }
  return (
    <div className="space-y-2 py-2.5">
      {disabilities.map((d, i) => (
        <div key={`${d.descriptor}-${i}`} className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-sm text-[rgb(var(--text-primary))]">
              {getDisplayName(d.descriptor, locale)}
            </div>
            {d.notes && (
              <div className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">{d.notes}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// MAIN
// ============================================================================

export function DemographicsTab({ student, canEdit = false, locale = 'en' }: DemographicsTabProps) {
  const [editing, setEditing] = useState(false)

  // Auto-derive from legacy fields for students that predate Sprint 3.
  // deriveDescriptorsFromLegacy is pure + does NOT overwrite existing
  // descriptor values, so it's safe to run on every render.
  const derived = useMemo(
    () =>
      deriveDescriptorsFromLegacy({
        gender: (student as { gender?: string }).gender,
        primaryLanguage: (student as { primaryLanguage?: string }).primaryLanguage,
        homeLanguage: (student as { homeLanguage?: string }).homeLanguage,
        ethnicity: (student as { ethnicity?: string }).ethnicity,
        sexDescriptor: student.sexDescriptor,
        languageDescriptor: student.languageDescriptor,
        motherTongueDescriptor: student.motherTongueDescriptor,
        ethnicityDescriptor: student.ethnicityDescriptor,
      }),
    [student],
  )

  const sex = descriptorDisplay(student.sexDescriptor, derived.sexDescriptor, locale)
  const lang = descriptorDisplay(student.languageDescriptor, derived.languageDescriptor, locale)
  const mother = descriptorDisplay(
    student.motherTongueDescriptor,
    derived.motherTongueDescriptor,
    locale,
  )
  const ethnicity = descriptorDisplay(
    student.ethnicityDescriptor,
    derived.ethnicityDescriptor,
    locale,
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
            Ed-Fi Demographics
          </h2>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
            IEMIS-aligned fields used for Flash I / II reporting. Edits are audited.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            data-testid="open-edit-demographics"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[rgb(var(--border-primary))] text-xs font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--interactive-hover))] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden />
            Edit
          </button>
        )}
      </div>

      <section className="rounded-lg border border-[rgb(var(--border-primary))] px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))] py-2">
          Identity
        </h3>
        <FieldRow label="Sex" display={sex} />
        <FieldRow label="Primary language" display={lang} />
        <FieldRow label="Mother tongue" display={mother} />
        <FieldRow label="Ethnicity" display={ethnicity} />
      </section>

      <section className="rounded-lg border border-[rgb(var(--border-primary))] px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))] py-2">
          Disabilities
        </h3>
        <DisabilitiesBlock disabilities={student.disabilities} locale={locale} />
      </section>

      <section className="rounded-lg border border-[rgb(var(--border-primary))] px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))] py-2">
          Flags
        </h3>
        <BooleanRow label="Transferred in?" value={student.isTransferred} />
        <BooleanRow label="Below poverty line?" value={student.belowPovertyLine} />
        {student.belowPovertyLine && (
          <TextRow label="Scholarship category" value={student.scholarshipCategory} />
        )}
      </section>

      {editing && (
        <EditDemographicsModal
          student={student}
          onClose={() => setEditing(false)}
          locale={locale}
        />
      )}
    </div>
  )
}
