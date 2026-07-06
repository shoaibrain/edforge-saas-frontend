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
import { useAcademicsI18n } from '../../../lib/i18n'

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
  const { t } = useAcademicsI18n()

  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[rgb(var(--border-primary))] last:border-0">
      <span className="text-sm text-[rgb(var(--text-tertiary))] min-w-40">{label}</span>
      <div className="flex-1 text-end">
        {display.kind === 'unset' && (
          <span className="text-sm italic text-[rgb(var(--text-tertiary))]">{t('studentProfile.demographics.notSpecified')}</span>
        )}
        {display.kind === 'set' && (
          <span className="text-sm text-[rgb(var(--text-primary))]">{display.label}</span>
        )}
        {display.kind === 'derived' && (
          <div className="inline-flex flex-col items-end gap-0.5">
            <span className="text-sm text-[rgb(var(--text-secondary))]">{display.label}</span>
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded border border-amber-500/30 bg-[rgb(var(--state-warning-fg))]/10 text-[rgb(var(--state-warning-fg))]"
              data-testid="derived-badge"
            >
              <AlertTriangle className="w-2.5 h-2.5" aria-hidden />
              {t('studentProfile.demographics.derivedConfirm')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function BooleanRow({ label, value }: { label: string; value: boolean | undefined }) {
  const { t } = useAcademicsI18n()

  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-[rgb(var(--border-primary))] last:border-0">
      <span className="text-sm text-[rgb(var(--text-tertiary))] min-w-40">{label}</span>
      {value === true && (
        <span className="text-sm font-medium text-[rgb(var(--accent-enrollment-text))]">{t('yesNo.yes')}</span>
      )}
      {value === false && (
        <span className="text-sm text-[rgb(var(--text-primary))]">{t('yesNo.no')}</span>
      )}
      {value === undefined && (
        <span className="text-sm italic text-[rgb(var(--text-tertiary))]">{t('studentProfile.demographics.notSpecified')}</span>
      )}
    </div>
  )
}

function TextRow({ label, value }: { label: string; value?: string }) {
  const { t } = useAcademicsI18n()

  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[rgb(var(--border-primary))] last:border-0">
      <span className="text-sm text-[rgb(var(--text-tertiary))] min-w-40">{label}</span>
      {value ? (
        <span className="text-sm text-[rgb(var(--text-primary))] text-end">{value}</span>
      ) : (
        <span className="text-sm italic text-[rgb(var(--text-tertiary))]">{t('studentProfile.demographics.notSpecified')}</span>
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
  const { t } = useAcademicsI18n()

  if (!disabilities || disabilities.length === 0) {
    return (
      <div className="py-2.5 text-sm italic text-[rgb(var(--text-tertiary))]">
        {t('studentProfile.demographics.noDisabilities')}
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
  const { t } = useAcademicsI18n()
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
            {t('studentProfile.demographics.title')}
          </h2>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
            {t('studentProfile.demographics.description')}
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            data-testid="open-edit-demographics"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[rgb(var(--border-primary))] text-xs font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary))] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden />
            {t('studentProfile.demographics.edit')}
          </button>
        )}
      </div>

      <section className="rounded-lg border border-[rgb(var(--border-primary))] px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))] py-2">
          {t('studentProfile.demographics.identity')}
        </h3>
        <FieldRow label={t('studentProfile.demographics.sex')} display={sex} />
        <FieldRow label={t('studentProfile.demographics.primaryLanguage')} display={lang} />
        <FieldRow label={t('studentProfile.demographics.motherTongue')} display={mother} />
        <FieldRow label={t('studentProfile.demographics.ethnicity')} display={ethnicity} />
      </section>

      <section className="rounded-lg border border-[rgb(var(--border-primary))] px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))] py-2">
          {t('studentProfile.demographics.disabilities')}
        </h3>
        <DisabilitiesBlock disabilities={student.disabilities} locale={locale} />
      </section>

      <section className="rounded-lg border border-[rgb(var(--border-primary))] px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))] py-2">
          {t('studentProfile.demographics.flags')}
        </h3>
        <BooleanRow label={t('studentProfile.demographics.transferredIn')} value={student.isTransferred} />
        <BooleanRow label={t('studentProfile.demographics.belowPovertyLine')} value={student.belowPovertyLine} />
        {student.belowPovertyLine && (
          <TextRow label={t('studentProfile.demographics.scholarshipCategory')} value={student.scholarshipCategory} />
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
