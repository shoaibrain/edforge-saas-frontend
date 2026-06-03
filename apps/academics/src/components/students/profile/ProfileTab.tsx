/**
 * ProfileTab Component
 *
 * Personal details for the student profile with sensitive field masking.
 * Displays demographics, contact info, medical/programs in a clean grid.
 *
 * Sensitive fields (DOB, gender, ethnicity, contact info, medical) are masked
 * by default and revealed via a privacy toggle.
 */

import { useState } from 'react'
import {
  Calendar,
  Globe,
  MapPin,
  Mail,
  Phone,
  GraduationCap,
  Shield,
  Heart,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import { DateDisplay } from '@edforge/ui'
import { EntityIdDisplay } from '@edforge/archetype'
import type { StudentProfileResponseDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

export interface ProfileTabProps {
  student: StudentProfileResponseDto
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null
  try {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  } catch {
    return null
  }
}

/**
 * Address shape — covers both legacy US fields (street1/city/state/zipCode)
 * and Sprint A.1 Nepal extension fields (wardNumber/municipality/district/
 * province). Country may be 'NPL' when the IEMIS import populated Nepal-shape
 * data, even on tenants whose archetype is GENERIC.
 */
interface DisplayableAddress {
  street1?: string
  street2?: string
  city?: string
  state?: string
  zipCode?: string
  postalCode?: string
  country?: string
  // Sprint A.1 Nepal extension fields
  wardNumber?: string
  municipality?: string
  district?: string
  province?: string
}

function isNepalAddress(address: DisplayableAddress): boolean {
  // Treat as Nepal-shape if country is NPL OR any Nepal extension field is
  // populated. This handles both PABSON tenants on edforge.app AND legacy
  // imported records that landed via the IEMIS xlsx import.
  return (
    address.country === 'NPL' ||
    address.country === 'Nepal' ||
    Boolean(address.wardNumber || address.municipality || address.district || address.province)
  )
}

function formatAddress(address?: DisplayableAddress): string | null {
  if (!address) return null

  // Sprint A.14a — Nepal-aware display branch.
  // Format: "Tole / Street\nWard X, Municipality\nDistrict, Province\nNepal"
  if (isNepalAddress(address)) {
    const parts: string[] = []
    if (address.street1) parts.push(address.street1)
    if (address.street2) parts.push(address.street2)
    const wardMunicipality = [
      address.wardNumber ? `Ward ${address.wardNumber}` : null,
      address.municipality,
    ]
      .filter(Boolean)
      .join(', ')
    if (wardMunicipality) parts.push(wardMunicipality)
    const districtProvince = [address.district, address.province].filter(Boolean).join(', ')
    if (districtProvince) parts.push(districtProvince)
    if (address.postalCode) parts.push(address.postalCode)
    parts.push(
      address.country === 'NPL' || address.country === 'Nepal'
        ? 'Nepal'
        : address.country || 'Nepal',
    )
    return parts.length > 0 ? parts.join('\n') : null
  }

  // Legacy US-shaped display (unchanged).
  const parts: string[] = []
  if (address.street1) parts.push(address.street1)
  if (address.street2) parts.push(address.street2)
  const cityLine = [address.city, address.state, address.zipCode || address.postalCode]
    .filter(Boolean)
    .join(', ')
  if (cityLine) parts.push(cityLine)
  if (address.country && address.country !== 'United States') {
    parts.push(address.country)
  }
  return parts.length > 0 ? parts.join('\n') : null
}

// ============================================================================
// DATA FIELD COMPONENT
// ============================================================================

interface DataFieldProps {
  label: string
  value?: React.ReactNode
  icon?: React.ReactNode
}

function DataField({ label, value, icon }: DataFieldProps) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
        {label}
      </dt>
      <dd className="text-sm text-text-primary flex items-start gap-1.5">
        {icon && <span className="text-text-tertiary mt-0.5 flex-shrink-0">{icon}</span>}
        <span className={value ? '' : 'text-text-tertiary'}>
          {value || '—'}
        </span>
      </dd>
    </div>
  )
}

// ============================================================================
// SECTION HEADER
// ============================================================================

interface SectionHeaderProps {
  icon: React.ReactNode
  title: string
  iconColor?: string
}

function SectionHeader({ icon, title, iconColor = 'text-text-tertiary' }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className={iconColor}>{icon}</span>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProfileTab({ student }: ProfileTabProps) {
  const [showSensitive, setShowSensitive] = useState(false)
  const { t } = useTranslation('academics')

  const mask = (value: string | undefined | null): string =>
    !showSensitive && value ? '••••••••' : (value || '—')

  const age = calculateAge(student.dateOfBirth)
  const physicalAddress = formatAddress(student.contactInfo?.address)
  const mailingAddress =
    student.contactInfo?.useMailingAddress
      ? formatAddress(student.contactInfo?.mailingAddress)
      : null

  /** Translate gender values via academics namespace */
  const formatGender = (gender?: string): string => {
    if (!gender) return '—'
    // Map snake_case keys to translation keys
    const keyMap: Record<string, string> = {
      male: 'male',
      female: 'female',
      other: 'other',
      prefer_not_to_say: 'preferNotToSay',
    }
    const key = keyMap[gender]
    return key ? t(`gender.${key}`) : gender
  }

  return (
    <div className="space-y-8">
      {/* Privacy Toggle */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowSensitive(!showSensitive)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-tertiary border border-border-secondary transition-colors"
        >
          {showSensitive ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
          {showSensitive ? t('privacy.hideSensitive') : t('privacy.showSensitive')}
        </button>
      </div>

      {/* Personal Information */}
      <section>
        <SectionHeader
          icon={<Calendar className="w-4 h-4" />}
          title={t('sections.personalInfo')}
          iconColor="text-blue-500"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          <DataField
            label={t('fields.dateOfBirth')}
            value={
              student.dateOfBirth ? (
                showSensitive ? (
                  <span>
                    <DateDisplay date={student.dateOfBirth} format="long" />
                    {age !== null && (
                      <span className="text-text-tertiary ml-1">({t('ageLabel', { age })})</span>
                    )}
                  </span>
                ) : '••••••••'
              ) : undefined
            }
          />
          <DataField label={t('fields.gender')} value={mask(formatGender(student.gender))} />
          <DataField label={t('fields.ethnicity')} value={mask(student.ethnicity)} />
          <DataField
            label={t('fields.primaryLanguage')}
            value={mask(student.primaryLanguage)}
            icon={student.primaryLanguage && showSensitive ? <Globe className="w-3.5 h-3.5" /> : undefined}
          />
          {student.homeLanguage && student.homeLanguage !== student.primaryLanguage && (
            <DataField label={t('fields.homeLanguage')} value={mask(student.homeLanguage)} />
          )}
          <DataField label={t('fields.countryOfBirth')} value={mask(student.countryOfBirth)} />
        </div>
      </section>

      {/* Contact Information */}
      <section>
        <SectionHeader
          icon={<Mail className="w-4 h-4" />}
          title={t('sections.contactInfo')}
          iconColor="text-teal-500"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          <DataField
            label={t('fields.email')}
            value={
              student.contactInfo?.email ? (
                showSensitive ? (
                  <a
                    href={`mailto:${student.contactInfo.email}`}
                    className="text-brand-600 dark:text-brand-400 hover:underline truncate"
                  >
                    {student.contactInfo.email}
                  </a>
                ) : '••••••••'
              ) : undefined
            }
          />
          <DataField
            label={t('fields.phone')}
            value={
              student.contactInfo?.phone ? (
                showSensitive ? (
                  <a
                    href={`tel:${student.contactInfo.phone}`}
                    className="hover:underline"
                  >
                    {student.contactInfo.phone}
                  </a>
                ) : '••••••••'
              ) : undefined
            }
            icon={student.contactInfo?.phone && showSensitive ? <Phone className="w-3.5 h-3.5" /> : undefined}
          />
          <DataField
            label={t('fields.address')}
            value={
              physicalAddress ? (
                showSensitive ? (
                  <span className="whitespace-pre-line">{physicalAddress}</span>
                ) : '••••••••'
              ) : undefined
            }
            icon={physicalAddress && showSensitive ? <MapPin className="w-3.5 h-3.5" /> : undefined}
          />
          {mailingAddress && (
            <DataField
              label={t('fields.mailingAddress')}
              value={
                showSensitive ? (
                  <span className="whitespace-pre-line">{mailingAddress}</span>
                ) : '••••••••'
              }
              icon={showSensitive ? <MapPin className="w-3.5 h-3.5" /> : undefined}
            />
          )}
        </div>
      </section>

      {/* Academic Information — always visible */}
      <section>
        <SectionHeader
          icon={<GraduationCap className="w-4 h-4" />}
          title={t('sections.academicInfo')}
          iconColor="text-emerald-500"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          <DataField label={t('fields.currentGrade')} value={student.currentGradeLevel ? t('gradeLabel', { level: student.currentGradeLevel }) : undefined} />
          <DataField
            label={t('tableHeaders.status')}
            value={
              <span className="capitalize">{t(`status.${student.status}`, { defaultValue: student.status })}</span>
            }
          />
          <DataField label={t('fields.enrollmentDate')} value={student.enrollmentDate ? <DateDisplay date={student.enrollmentDate} format="long" /> : undefined} />
          {/* Governance-aware student identifier: PABSON → EMIS Student ID (government
              PII, honors the privacy toggle) with the school-local studentNumber as
              secondary; GENERIC → studentNumber. Resolved via @edforge/archetype. */}
          <EntityIdDisplay
            entity="student"
            data={student}
            variant="stacked"
            masked={!showSensitive}
          />
          <DataField label={t('fields.stateStudentId')} value={student.stateStudentId} />
          {student.previousSchool && (
            <DataField label={t('fields.previousSchool')} value={student.previousSchool} />
          )}
        </div>
      </section>

      {/* Programs & Accommodations — always visible */}
      <section>
        <SectionHeader
          icon={<Shield className="w-4 h-4" />}
          title={t('sections.programsAccommodations')}
          iconColor="text-purple-500"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          <DataField
            label={t('programs.iep')}
            value={student.medicalInfo?.hasIEP ? t('yesNo.yes') : t('yesNo.no')}
          />
          <DataField
            label={t('programs.plan504')}
            value={student.medicalInfo?.has504Plan ? t('yesNo.yes') : t('yesNo.no')}
          />
          <DataField
            label={t('programs.specialPrograms')}
            value={
              student.specialPrograms && student.specialPrograms.length > 0
                ? student.specialPrograms.join(', ')
                : undefined
            }
          />
          <DataField
            label={t('programs.accommodations')}
            value={
              student.accommodations && student.accommodations.length > 0
                ? student.accommodations.join(', ')
                : undefined
            }
          />
        </div>
      </section>

      {/* Medical Information — masked */}
      {student.medicalInfo && (
        <section>
          <SectionHeader
            icon={<Heart className="w-4 h-4" />}
            title={t('sections.medicalInfo')}
            iconColor="text-red-500"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            <DataField
              label={t('medical.allergies')}
              value={
                student.medicalInfo.allergies && student.medicalInfo.allergies.length > 0
                  ? mask(student.medicalInfo.allergies.join(', '))
                  : undefined
              }
            />
            <DataField
              label={t('medical.medications')}
              value={
                student.medicalInfo.medications && student.medicalInfo.medications.length > 0
                  ? mask(student.medicalInfo.medications.join(', '))
                  : undefined
              }
            />
            <DataField
              label={t('medical.conditions')}
              value={
                student.medicalInfo.conditions && student.medicalInfo.conditions.length > 0
                  ? mask(student.medicalInfo.conditions.join(', '))
                  : undefined
              }
            />
            <DataField
              label={t('medical.dietaryRestrictions')}
              value={
                student.medicalInfo.dietaryRestrictions && student.medicalInfo.dietaryRestrictions.length > 0
                  ? mask(student.medicalInfo.dietaryRestrictions.join(', '))
                  : undefined
              }
            />
            <DataField label={t('medical.bloodType')} value={mask(student.medicalInfo.bloodType)} />
            <DataField label={t('medical.physician')} value={mask(student.medicalInfo.physicianName)} />
            {student.medicalInfo.physicianPhone && (
              <DataField label={t('medical.physicianPhone')} value={mask(student.medicalInfo.physicianPhone)} />
            )}
            {student.medicalInfo.insuranceProvider && (
              <DataField label={t('medical.insurance')} value={mask(student.medicalInfo.insuranceProvider)} />
            )}
            {student.medicalInfo.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <DataField label={t('medical.medicalNotes')} value={mask(student.medicalInfo.notes)} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Notes — always visible */}
      {student.notes && (
        <section>
          <SectionHeader
            icon={<Calendar className="w-4 h-4" />}
            title={t('sections.notes')}
            iconColor="text-slate-500"
          />
          <p className="text-sm text-text-secondary whitespace-pre-wrap">
            {student.notes}
          </p>
        </section>
      )}
    </div>
  )
}

// ============================================================================
// SKELETON
// ============================================================================

export function ProfileTabSkeleton() {
  return (
    <div className="space-y-8">
      {[...Array(3)].map((_, sectionIdx) => (
        <section key={sectionIdx}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded bg-surface-tertiary animate-pulse" />
            <div className="h-4 w-32 bg-surface-tertiary rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            {[...Array(sectionIdx === 0 ? 5 : 3)].map((_, i) => (
              <div key={i}>
                <div className="h-3 w-20 bg-surface-tertiary rounded animate-pulse mb-2" />
                <div className="h-4 w-32 bg-surface-tertiary rounded animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
