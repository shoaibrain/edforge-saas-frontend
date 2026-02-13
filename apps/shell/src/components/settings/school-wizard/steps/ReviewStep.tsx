/**
 * Review Step
 *
 * Step 5: Read-only summary of all entered data + Ed-Fi JSON preview.
 * No editable fields — user reviews before final submit.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, MapPin, Users, Building2, Tag } from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import { EdFiPreview } from '@/components/settings/EdFiPreview'
import type { CreateSchoolDto } from '@aibrains/shared-types'
import {
  SCHOOL_TYPE_LABELS,
  GRADE_OPTIONS,
  transformWizardDataToDto,
} from '../school-wizard.utils'

// ============================================================================
// SUMMARY FIELD
// ============================================================================

function SummaryField({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs text-[rgb(var(--text-tertiary))] mb-0.5">{label}</dt>
      <dd className={`text-sm text-[rgb(var(--text-primary))] ${mono ? 'font-mono' : ''}`}>
        {value}
      </dd>
    </div>
  )
}

function SummarySection({
  title,
  icon: Icon,
  children,
  isEmpty,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  isEmpty?: boolean
}) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <h4 className="text-sm font-medium text-[rgb(var(--text-primary))]">{title}</h4>
      </div>
      {isEmpty ? (
        <p className="text-xs text-[rgb(var(--text-tertiary))] italic">Not provided — can be added later</p>
      ) : (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</dl>
      )}
    </div>
  )
}

// ============================================================================
// STEP COMPONENT
// ============================================================================

export function ReviewStep({ data }: WizardStepProps) {
  const gradeStartLabel = GRADE_OPTIONS.find((g) => g.value === data['gradeRange.start'])?.label || data['gradeRange.start']
  const gradeEndLabel = GRADE_OPTIONS.find((g) => g.value === data['gradeRange.end'])?.label || data['gradeRange.end']

  // Transform wizard data to DTO for EdFiPreview
  const formDataForPreview = useMemo(() => {
    try {
      return transformWizardDataToDto(data as Record<string, unknown>) as Partial<CreateSchoolDto>
    } catch {
      return {} as Partial<CreateSchoolDto>
    }
  }, [data])

  const hasAddress = !!(data['address.street1'] as string)
  const hasContact = !!((data.phone as string) || (data.email as string) || (data.website as string))
  const hasOrg = !!((data.localEducationAgencyId as string) || (data.principalName as string))
  const hasEdFi = !!(
    (data.schoolCategories as string[])?.length ||
    (data.identificationCodes as unknown[])?.length ||
    (data.schoolTypeDescriptor as string)
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-teal-500/5 border border-teal-500/20">
        <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-[rgb(var(--text-primary))]">
            Review your school details
          </h3>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            Make sure everything looks correct before creating the school.
          </p>
        </div>
      </div>

      {/* School Identity */}
      <SummarySection title="School Identity" icon={Building2}>
        <SummaryField label="School Name" value={data.name as string} />
        <SummaryField label="Short Name" value={data.shortName as string} />
        <SummaryField label="School Code" value={data.schoolCode as string} mono />
        <SummaryField
          label="School Type"
          value={SCHOOL_TYPE_LABELS[(data.schoolType as string) || ''] || (data.schoolType as string)}
        />
        <SummaryField label="Grade Range" value={`${gradeStartLabel} — ${gradeEndLabel}`} />
      </SummarySection>

      {/* Location & Contact */}
      <SummarySection title="Location & Contact" icon={MapPin} isEmpty={!hasAddress && !hasContact}>
        {hasAddress && (
          <>
            <SummaryField
              label="Address"
              value={[
                data['address.street1'],
                data['address.street2'],
                [data['address.city'], data['address.state'], data['address.zipCode']].filter(Boolean).join(', '),
              ]
                .filter(Boolean)
                .join('\n')}
            />
            <SummaryField label="Country" value={data['address.country'] as string} />
          </>
        )}
        {hasContact && (
          <>
            <SummaryField label="Phone" value={data.phone as string} />
            <SummaryField label="Email" value={data.email as string} />
            <SummaryField label="Website" value={data.website as string} />
          </>
        )}
      </SummarySection>

      {/* Organization */}
      <SummarySection title="Organization" icon={Users} isEmpty={!hasOrg}>
        <SummaryField label="District (LEA)" value={data.localEducationAgencyId as string} mono />
        <SummaryField label="Principal" value={data.principalName as string} />
        <SummaryField label="Principal Email" value={data.principalEmail as string} />
      </SummarySection>

      {/* Ed-Fi Compliance */}
      <SummarySection title="Ed-Fi Compliance" icon={Tag} isEmpty={!hasEdFi}>
        {(data.schoolCategories as string[])?.length > 0 && (
          <SummaryField
            label="Categories"
            value={(data.schoolCategories as string[]).join(', ')}
          />
        )}
        <SummaryField label="Ed-Fi School Type" value={data.schoolTypeDescriptor as string} />
        {(data.gradeLevels as string[])?.length > 0 && (
          <SummaryField
            label="Grade Levels"
            value={`${(data.gradeLevels as string[]).length} grade levels`}
          />
        )}
        {(data.identificationCodes as unknown[])?.length > 0 && (
          <SummaryField
            label="ID Codes"
            value={`${(data.identificationCodes as unknown[]).length} identification code(s)`}
          />
        )}
        {(data.institutionTelephones as unknown[])?.length > 0 && (
          <SummaryField
            label="Institution Phones"
            value={`${(data.institutionTelephones as unknown[]).length} phone number(s)`}
          />
        )}
        <SummaryField label="Charter Status" value={data.charterStatusDescriptor as string} />
        <SummaryField label="Admin Funding" value={data.administrativeFundingControlDescriptor as string} />
      </SummarySection>

      {/* Ed-Fi JSON Preview */}
      <EdFiPreview formData={formDataForPreview} />
    </motion.div>
  )
}
