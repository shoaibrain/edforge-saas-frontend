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
import { useTranslation } from '@edforge/i18n'
import {
  optionValueToI18nKey,
} from '../staff-wizard.utils'
import { getRoleI18nKey } from '../../StaffRoleBadge'

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
  const { t } = useTranslation('people')

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
          {t('wizard.review.edit')}
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
  const { t } = useTranslation('people')
  const display = value === true
    ? t('common.yes')
    : value === false
    ? t('common.no')
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
  const { t } = useTranslation('people')
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
  const roleLabel = (value?: string) =>
    value ? t(`roles.${getRoleI18nKey(value)}`, { defaultValue: value }) : undefined
  const employmentTypeLabel = (value?: string) =>
    value ? t(`choices.employmentType.${optionValueToI18nKey(value)}`, { defaultValue: value }) : undefined
  const genderLabel = (value?: string) =>
    value ? t(`choices.gender.${optionValueToI18nKey(value)}`, { defaultValue: value }) : undefined
  const relationshipLabel = (value?: string) =>
    value ? t(`choices.relationship.${optionValueToI18nKey(value)}`, { defaultValue: value }) : undefined

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="text-center pb-2">
        <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
          {t('wizard.review.title')}
        </h3>
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          {t('wizard.review.description')}
        </p>
      </div>

      {/* Personal Info */}
      <SummaryCard title={t('wizard.review.sections.personal')} icon={<User className="w-4 h-4" />} stepIndex={0}>
        <DetailRow label={t('fields.name')} value={`${data.firstName || ''} ${data.middleName ? (data.middleName as string) + ' ' : ''}${data.lastSurname || ''}${data.generationCodeSuffix ? ' ' + (data.generationCodeSuffix as string) : ''}`} />
        <DetailRow label={t('fields.staffId')} value={data.staffUniqueId as string} />
        <DetailRow label={t('fields.dateOfBirth')} value={data.birthDate as string} />
        <DetailRow label={t('fields.gender')} value={genderLabel(data.gender as string)} />
        <DetailRow label={t('fields.hispanicLatino')} value={data.hispanicLatinoEthnicity as boolean} />
        {(data.maidenName as string) && <DetailRow label={t('fields.maidenName')} value={data.maidenName as string} />}
      </SummaryCard>

      {/* Contact */}
      <SummaryCard title={t('sections.contactInfo')} icon={<Mail className="w-4 h-4" />} stepIndex={1}>
        <DetailRow label={t('fields.email')} value={data.email as string} />
        <DetailRow label={t('fields.phone')} value={data.phone as string} />
        <DetailRow
          label={t('wizard.contact.addresses')}
          value={filledAddresses.length > 0 ? t('wizard.review.addressCount', { count: filledAddresses.length }) : undefined}
        />
        {filledAddresses.map((addr, i) => (
          <div key={i} className="pl-4 text-xs text-[rgb(var(--text-secondary))]">
            {[addr.streetNumberName, addr.city, addr.stateAbbreviationDescriptor, addr.postalCode].filter(Boolean).join(', ')}
          </div>
        ))}
        <DetailRow
          label={t('wizard.contact.emergencyContacts')}
          value={filledContacts.length > 0 ? t('wizard.review.contactCount', { count: filledContacts.length }) : undefined}
        />
        {filledContacts.map((c, i) => (
          <div key={i} className="pl-4 text-xs text-[rgb(var(--text-secondary))]">
            {c.name} ({relationshipLabel(c.relationship)}) — {c.phone}
          </div>
        ))}
      </SummaryCard>

      {/* Employment */}
      <SummaryCard title={t('wizard.stepMeta.employment.title')} icon={<Briefcase className="w-4 h-4" />} stepIndex={2}>
        <DetailRow label={t('fields.role')} value={roleLabel(data.role as string)} />
        <DetailRow label={t('fields.employmentType')} value={employmentTypeLabel(data.employmentType as string)} />
        <DetailRow label={t('fields.hireDate')} value={data.hireDate as string} />
        <DetailRow label={t('fields.title')} value={data.title as string} />
        {data.highlyQualifiedTeacher !== undefined && (
          <DetailRow label={t('wizard.employment.highlyQualifiedTeacher')} value={data.highlyQualifiedTeacher as boolean} />
        )}
        {typeof data.yearsOfPriorTeachingExperience === 'number' && (
          <DetailRow label={t('wizard.employment.teachingExperienceYears')} value={data.yearsOfPriorTeachingExperience as number} />
        )}
        {typeof data.yearsOfPriorProfessionalExperience === 'number' && (
          <DetailRow label={t('wizard.employment.professionalExperienceYears')} value={data.yearsOfPriorProfessionalExperience as number} />
        )}
      </SummaryCard>

      {/* Assignment */}
      <SummaryCard title={t('sections.schoolAssignments')} icon={<Building2 className="w-4 h-4" />} stepIndex={3}>
        <DetailRow label={t('fields.primarySchool')} value={data.primarySchoolId ? t('wizard.review.assigned') : undefined} />
        <DetailRow label={t('fields.department')} value={data.departmentName as string} />
        <DetailRow label={t('wizard.assignment.primaryFte')} value={primaryFte.toFixed(2)} />
        {additionalAssignments.length > 0 && (
          <DetailRow label={t('wizard.assignment.additionalTitle')} value={`${additionalAssignments.length}`} />
        )}
        <DetailRow label={t('wizard.assignment.totalFte')} value={(primaryFte + additionalFteTotal).toFixed(2)} />
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
            {createAccount ? t('wizard.review.userAccountWillBeCreated') : t('wizard.review.noUserAccount')}
          </p>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            {createAccount
              ? t('wizard.review.loginSummary', { email: data.email || t('wizard.employment.emailNotSet'), role: data.globalRole || 'TenantUser' })
              : t('wizard.review.noLoginAccess')}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
