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

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

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

function formatGender(gender?: string): string {
  if (!gender) return '—'
  const labels: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
    prefer_not_to_say: 'Prefer not to say',
  }
  return labels[gender] || gender
}

function formatAddress(address?: {
  street1?: string
  street2?: string
  city?: string
  state?: string
  zipCode?: string
  postalCode?: string
  country?: string
}): string | null {
  if (!address) return null
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

  const mask = (value: string | undefined | null): string =>
    !showSensitive && value ? '••••••••' : (value || '—')

  const age = calculateAge(student.dateOfBirth)
  const physicalAddress = formatAddress(student.contactInfo?.address)
  const mailingAddress =
    student.contactInfo?.useMailingAddress
      ? formatAddress(student.contactInfo?.mailingAddress)
      : null

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
          {showSensitive ? 'Hide sensitive details' : 'Show sensitive details'}
        </button>
      </div>

      {/* Personal Information */}
      <section>
        <SectionHeader
          icon={<Calendar className="w-4 h-4" />}
          title="Personal Information"
          iconColor="text-blue-500"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          <DataField
            label="Date of Birth"
            value={
              student.dateOfBirth ? (
                showSensitive ? (
                  <span>
                    {formatDate(student.dateOfBirth)}
                    {age !== null && (
                      <span className="text-text-tertiary ml-1">({age} yrs)</span>
                    )}
                  </span>
                ) : '••••••••'
              ) : undefined
            }
          />
          <DataField label="Gender" value={mask(formatGender(student.gender))} />
          <DataField label="Ethnicity" value={mask(student.ethnicity)} />
          <DataField
            label="Primary Language"
            value={mask(student.primaryLanguage)}
            icon={student.primaryLanguage && showSensitive ? <Globe className="w-3.5 h-3.5" /> : undefined}
          />
          {student.homeLanguage && student.homeLanguage !== student.primaryLanguage && (
            <DataField label="Home Language" value={mask(student.homeLanguage)} />
          )}
          <DataField label="Country of Birth" value={mask(student.countryOfBirth)} />
        </div>
      </section>

      {/* Contact Information */}
      <section>
        <SectionHeader
          icon={<Mail className="w-4 h-4" />}
          title="Contact Information"
          iconColor="text-teal-500"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          <DataField
            label="Email"
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
            label="Phone"
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
            label="Address"
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
              label="Mailing Address"
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
          title="Academic Information"
          iconColor="text-emerald-500"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          <DataField label="Current Grade" value={student.currentGradeLevel ? `Grade ${student.currentGradeLevel}` : undefined} />
          <DataField
            label="Status"
            value={
              <span className="capitalize">{student.status}</span>
            }
          />
          <DataField label="Enrollment Date" value={formatDate(student.enrollmentDate)} />
          <DataField label="Student Number" value={student.studentNumber} />
          <DataField label="State Student ID" value={student.stateStudentId} />
          {student.previousSchool && (
            <DataField label="Previous School" value={student.previousSchool} />
          )}
        </div>
      </section>

      {/* Programs & Accommodations — always visible */}
      <section>
        <SectionHeader
          icon={<Shield className="w-4 h-4" />}
          title="Programs & Accommodations"
          iconColor="text-purple-500"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          <DataField
            label="IEP"
            value={student.medicalInfo?.hasIEP ? 'Yes' : 'No'}
          />
          <DataField
            label="504 Plan"
            value={student.medicalInfo?.has504Plan ? 'Yes' : 'No'}
          />
          <DataField
            label="Special Programs"
            value={
              student.specialPrograms && student.specialPrograms.length > 0
                ? student.specialPrograms.join(', ')
                : undefined
            }
          />
          <DataField
            label="Accommodations"
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
            title="Medical Information"
            iconColor="text-red-500"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            <DataField
              label="Allergies"
              value={
                student.medicalInfo.allergies && student.medicalInfo.allergies.length > 0
                  ? mask(student.medicalInfo.allergies.join(', '))
                  : undefined
              }
            />
            <DataField
              label="Medications"
              value={
                student.medicalInfo.medications && student.medicalInfo.medications.length > 0
                  ? mask(student.medicalInfo.medications.join(', '))
                  : undefined
              }
            />
            <DataField
              label="Conditions"
              value={
                student.medicalInfo.conditions && student.medicalInfo.conditions.length > 0
                  ? mask(student.medicalInfo.conditions.join(', '))
                  : undefined
              }
            />
            <DataField
              label="Dietary Restrictions"
              value={
                student.medicalInfo.dietaryRestrictions && student.medicalInfo.dietaryRestrictions.length > 0
                  ? mask(student.medicalInfo.dietaryRestrictions.join(', '))
                  : undefined
              }
            />
            <DataField label="Blood Type" value={mask(student.medicalInfo.bloodType)} />
            <DataField label="Physician" value={mask(student.medicalInfo.physicianName)} />
            {student.medicalInfo.physicianPhone && (
              <DataField label="Physician Phone" value={mask(student.medicalInfo.physicianPhone)} />
            )}
            {student.medicalInfo.insuranceProvider && (
              <DataField label="Insurance" value={mask(student.medicalInfo.insuranceProvider)} />
            )}
            {student.medicalInfo.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <DataField label="Medical Notes" value={mask(student.medicalInfo.notes)} />
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
            title="Notes"
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
