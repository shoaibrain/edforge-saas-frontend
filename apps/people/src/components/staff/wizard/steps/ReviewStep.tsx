/**
 * Review & Submit Step
 *
 * Step 5: Read-only summary of all entered data with edit links.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Briefcase, Building2, Pencil, UserPlus } from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import { useWizard } from '@edforge/wizard'
import {
  STAFF_ROLE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  GENDER_LABELS,
} from '../staff-wizard.utils'

// ============================================================================
// SUMMARY CARD
// ============================================================================

interface SummaryCardProps {
  title: string
  icon: React.ReactNode
  stepIndex: number
  children: React.ReactNode
}

function SummaryCard({ title, icon, stepIndex, children }: SummaryCardProps) {
  const { goToStep } = useWizard()

  return (
    <div className="border border-[rgb(var(--border-secondary))] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[rgb(var(--background-secondary))] border-b border-[rgb(var(--border-secondary))]">
        <div className="flex items-center gap-2">
          <div className="text-[rgb(var(--text-tertiary))]">{icon}</div>
          <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{title}</h4>
        </div>
        <button
          type="button"
          onClick={() => goToStep(stepIndex)}
          className="flex items-center gap-1 text-xs text-[rgb(var(--action-secondary-fg))]  hover:text-[rgb(var(--state-info-fg))] dark:hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
      </div>
      <div className="p-4 space-y-2">{children}</div>
    </div>
  )
}

// ============================================================================
// DETAIL ROW
// ============================================================================

function DetailRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const display = value === true
    ? 'Yes'
    : value === false
    ? 'No'
    : value || '\u2014'

  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs text-[rgb(var(--text-tertiary))] flex-shrink-0">{label}</span>
      <span className="text-sm text-[rgb(var(--text-primary))] text-right truncate">
        {String(display)}
      </span>
    </div>
  )
}

// ============================================================================
// STEP COMPONENT
// ============================================================================

interface AdditionalAssignment {
  schoolId: string
  role: string
  beginDate: string
  fullTimeEquivalency: number
  departmentId?: string
}

export function ReviewStep({ data }: WizardStepProps) {
  const createAccount = data.createUserAccount === true
  const addresses = (data.addresses as Array<Record<string, string>>) || []
  const emergencyContacts = (data.emergencyContacts as Array<Record<string, string>>) || []
  const additionalAssignments = (data.additionalAssignments as AdditionalAssignment[]) || []
  const filledAddresses = addresses.filter((a) => a.streetNumberName || a.city)
  const filledContacts = emergencyContacts.filter((c) => c.name && c.phone)

  const primaryFte = typeof data.primaryAssignmentFte === 'number' ? data.primaryAssignmentFte : 1.0
  const additionalFteTotal = additionalAssignments.reduce(
    (sum, a) => sum + (a.fullTimeEquivalency || 0),
    0,
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="text-center pb-2">
        <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
          Review Staff Information
        </h3>
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          Please review all details before creating the staff record.
        </p>
      </div>

      {/* Personal Info */}
      <SummaryCard title="Personal Information" icon={<User className="w-4 h-4" />} stepIndex={0}>
        <DetailRow label="Name" value={`${data.firstName || ''} ${data.middleName ? (data.middleName as string) + ' ' : ''}${data.lastSurname || ''}${data.generationCodeSuffix ? ' ' + (data.generationCodeSuffix as string) : ''}`} />
        <DetailRow label="Staff ID" value={data.staffUniqueId as string} />
        <DetailRow label="Date of Birth" value={data.birthDate as string} />
        <DetailRow label="Gender" value={GENDER_LABELS[(data.gender as string) || ''] || (data.gender as string)} />
        <DetailRow label="Hispanic/Latino" value={data.hispanicLatinoEthnicity as boolean} />
        {(data.maidenName as string) && <DetailRow label="Maiden Name" value={data.maidenName as string} />}
      </SummaryCard>

      {/* Contact */}
      <SummaryCard title="Contact Information" icon={<Mail className="w-4 h-4" />} stepIndex={1}>
        <DetailRow label="Email" value={data.email as string} />
        <DetailRow label="Phone" value={data.phone as string} />
        <DetailRow
          label="Addresses"
          value={filledAddresses.length > 0 ? `${filledAddresses.length} address(es)` : undefined}
        />
        {filledAddresses.map((addr, i) => (
          <div key={i} className="pl-4 text-xs text-[rgb(var(--text-secondary))]">
            {[addr.streetNumberName, addr.city, addr.stateAbbreviationDescriptor, addr.postalCode].filter(Boolean).join(', ')}
          </div>
        ))}
        <DetailRow
          label="Emergency Contacts"
          value={filledContacts.length > 0 ? `${filledContacts.length} contact(s)` : undefined}
        />
        {filledContacts.map((c, i) => (
          <div key={i} className="pl-4 text-xs text-[rgb(var(--text-secondary))]">
            {c.name} ({c.relationship}) — {c.phone}
          </div>
        ))}
      </SummaryCard>

      {/* Employment */}
      <SummaryCard title="Employment" icon={<Briefcase className="w-4 h-4" />} stepIndex={2}>
        <DetailRow label="Role" value={STAFF_ROLE_LABELS[(data.role as string) || '']} />
        <DetailRow label="Employment Type" value={EMPLOYMENT_TYPE_LABELS[(data.employmentType as string) || '']} />
        <DetailRow label="Hire Date" value={data.hireDate as string} />
        <DetailRow label="Title" value={data.title as string} />
        {data.highlyQualifiedTeacher !== undefined && (
          <DetailRow label="Highly Qualified Teacher" value={data.highlyQualifiedTeacher as boolean} />
        )}
        {typeof data.yearsOfPriorTeachingExperience === 'number' && (
          <DetailRow label="Teaching Experience (years)" value={data.yearsOfPriorTeachingExperience as number} />
        )}
        {typeof data.yearsOfPriorProfessionalExperience === 'number' && (
          <DetailRow label="Professional Experience (years)" value={data.yearsOfPriorProfessionalExperience as number} />
        )}
      </SummaryCard>

      {/* Assignment */}
      <SummaryCard title="School Assignments" icon={<Building2 className="w-4 h-4" />} stepIndex={3}>
        <DetailRow label="Primary School" value={data.primarySchoolId ? 'Assigned' : undefined} />
        <DetailRow label="Department" value={data.departmentName as string} />
        <DetailRow label="Primary FTE" value={primaryFte.toFixed(2)} />
        {additionalAssignments.length > 0 && (
          <DetailRow label="Additional Assignments" value={`${additionalAssignments.length}`} />
        )}
        <DetailRow label="Total FTE" value={(primaryFte + additionalFteTotal).toFixed(2)} />
      </SummaryCard>

      {/* Account Creation */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
        createAccount
          ? 'border-[rgb(var(--border-focus)/0.35)] bg-[rgb(var(--state-info-bg)/0.12)]'
          : 'border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-secondary))]'
      }`}>
        <UserPlus className={`w-5 h-5 ${createAccount ? 'text-[rgb(var(--action-secondary-fg))] ' : 'text-[rgb(var(--text-tertiary))]'}`} />
        <div>
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
            {createAccount ? 'User account will be created' : 'No user account'}
          </p>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            {createAccount
              ? `Login for ${data.email || 'email not set'} as ${data.globalRole || 'TenantUser'}`
              : 'Staff record only — no login access'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
