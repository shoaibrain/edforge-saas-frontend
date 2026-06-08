/**
 * Review Step
 *
 * Step 5: Read-only summary of all entered data + Ed-Fi JSON preview.
 * No editable fields — user reviews before final submit.
 * Displays human-readable labels for descriptors and grade levels.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, MapPin, Users, Building2, Tag } from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import { EdFiPreview } from '@/components/settings/EdFiPreview'
import type { CreateSchoolDto } from '@aibrains/shared-types'
import {
  SCHOOL_CATEGORY_DESCRIPTORS,
  SCHOOL_TYPE_DESCRIPTORS,
  SCHOOL_GRADE_LEVEL_DESCRIPTORS,
  CHARTER_STATUS_DESCRIPTORS,
  ADMINISTRATIVE_FUNDING_CONTROL_DESCRIPTORS,
} from '@aibrains/shared-types'
import {
  SCHOOL_TYPE_LABELS,
  GRADE_OPTIONS,
  COUNTRY_OPTIONS,
  US_TIMEZONE_OPTIONS,
  transformWizardDataToDto,
} from '../school-wizard.utils'

// ============================================================================
// DESCRIPTOR LABEL HELPERS
// ============================================================================

function getCategoryLabel(value: string): string {
  return SCHOOL_CATEGORY_DESCRIPTORS.find((d) => d.value === value)?.label || value
}

function getSchoolTypeDescriptorLabel(value: string): string {
  return SCHOOL_TYPE_DESCRIPTORS.find((d) => d.value === value)?.label || value
}

function getGradeLevelDescriptorLabel(value: string): string {
  return SCHOOL_GRADE_LEVEL_DESCRIPTORS.find((d) => d.value === value)?.label || value
}

function getCharterStatusLabel(value: string): string {
  return CHARTER_STATUS_DESCRIPTORS.find((d) => d.value === value)?.label || value
}

function getAdminFundingLabel(value: string): string {
  return ADMINISTRATIVE_FUNDING_CONTROL_DESCRIPTORS.find((d) => d.value === value)?.label || value
}

function getCountryLabel(value: string): string {
  return COUNTRY_OPTIONS.find((c) => c.value === value)?.label || value
}

function getTimezoneLabel(value: string): string {
  return US_TIMEZONE_OPTIONS.find((t) => t.value === value)?.label || value
}

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
    <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] " />
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

  // Human-readable values
  const categories = (data.schoolCategories as string[]) || []
  const gradeLevels = (data.gradeLevels as string[]) || []
  const idCodes = (data.identificationCodes as unknown[]) || []
  const instPhones = (data.institutionTelephones as unknown[]) || []
  const timezone = data.timezone as string
  const country = data['address.country'] as string

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgb(var(--action-primary-bg))]/5 border border-[rgb(var(--border-focus)/0.35)]">
        <CheckCircle2 className="w-5 h-5 text-[rgb(var(--action-secondary-fg))]  flex-shrink-0" />
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
      <SummarySection title="Location & Contact" icon={MapPin} isEmpty={!hasAddress && !hasContact && !timezone}>
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
            <SummaryField label="Country" value={country ? getCountryLabel(country) : undefined} />
          </>
        )}
        {hasContact && (
          <>
            <SummaryField label="Phone" value={data.phone as string} />
            <SummaryField label="Email" value={data.email as string} />
            <SummaryField label="Website" value={data.website as string} />
          </>
        )}
        {timezone && <SummaryField label="Timezone" value={getTimezoneLabel(timezone)} />}
      </SummarySection>

      {/* Organization */}
      <SummarySection title="Organization" icon={Users} isEmpty={!hasOrg}>
        <SummaryField label="District (LEA)" value={(data._leaName as string) || (data.localEducationAgencyId as string)} />
        <SummaryField label="Principal" value={data.principalName as string} />
        <SummaryField label="Principal Email" value={data.principalEmail as string} />
      </SummarySection>

      {/* Ed-Fi Compliance */}
      <SummarySection title="Ed-Fi Compliance" icon={Tag} isEmpty={!hasEdFi}>
        {categories.length > 0 && (
          <SummaryField
            label="Categories"
            value={categories.map(getCategoryLabel).join(', ')}
          />
        )}
        {(data.schoolTypeDescriptor as string) && (
          <SummaryField
            label="Ed-Fi School Type"
            value={getSchoolTypeDescriptorLabel(data.schoolTypeDescriptor as string)}
          />
        )}
        {gradeLevels.length > 0 && (
          <SummaryField
            label="Grade Levels"
            value={gradeLevels.map(getGradeLevelDescriptorLabel).join(', ')}
          />
        )}
        {idCodes.length > 0 && (
          <SummaryField
            label="ID Codes"
            value={`${idCodes.length} identification code(s)`}
          />
        )}
        {instPhones.length > 0 && (
          <SummaryField
            label="Institution Phones"
            value={`${instPhones.length} phone number(s)`}
          />
        )}
        {(data.charterStatusDescriptor as string) && (
          <SummaryField
            label="Charter Status"
            value={getCharterStatusLabel(data.charterStatusDescriptor as string)}
          />
        )}
        {(data.administrativeFundingControlDescriptor as string) && (
          <SummaryField
            label="Admin Funding"
            value={getAdminFundingLabel(data.administrativeFundingControlDescriptor as string)}
          />
        )}
      </SummarySection>

      {/* Ed-Fi JSON Preview */}
      <EdFiPreview formData={formDataForPreview} />
    </motion.div>
  )
}
